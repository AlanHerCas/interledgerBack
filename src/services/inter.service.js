// Importamos las librerías necesarias
const { createAuthenticatedClient, isFinalizedGrant } = require('@interledger/open-payments');
const readline = require('readline/promises');

class InterService {
// ==== FUNCIÓN PRINCIPAL ====
 async  procesarPagoInternacional({
  sender,
  receiver,
  keyId,
  privateKey,
  walletAddressUrl,
} = {}) {
  try {
    // 1️⃣ Crear un cliente autenticado
    // Normalize privateKey: allow PEM or compact/base64 string from the request
    let privateKeyOption = privateKey;
    if (typeof privateKeyOption === 'string') {
      if (privateKeyOption.includes('-----BEGIN')) {
        // assume PEM already
      } else {
        // convert single-line/base64 key to PEM format
        const cleaned = privateKeyOption.replace(/\r|\n|\s+/g, '');
        const chunks = cleaned.match(/.{1,64}/g) || [cleaned];
        privateKeyOption = `-----BEGIN PRIVATE KEY-----\n${chunks.join('\n')}\n-----END PRIVATE KEY-----`;
      }
    }

    const client = await createAuthenticatedClient({
      walletAddressUrl,
      privateKey: privateKeyOption,
      keyId,
    });

    // 2️⃣ Obtener información de las wallets
    const sendingWalletAddress = await client.walletAddress.get({ url: sender });
    const receiverWalletAddress = await client.walletAddress.get({ url: receiver });

    console.log('Remitente:', sendingWalletAddress.id);
    console.log('Receptor:', receiverWalletAddress.id);

    // 3️⃣ Solicitar permiso para crear un pago entrante
    const accessTypes = ['incoming_payment', 'incoming-payment', 'incoming-payments', 'incoming_payments'];
    let incomingPaymentGrant;
    let lastError;

    for (const typeName of accessTypes) {
      try {
        console.log(`Intentando grant.request con tipo de acceso: ${typeName}`);
        incomingPaymentGrant = await client.grant.request({
          url: receiverWalletAddress.authServer,
        }, {
          access_token: {
            access: [{ type: typeName, actions: ['create'] }],
          },
        });
        break;
      } catch (err) {
        lastError = err;
        console.warn('Fallo grant request para tipo', typeName, 'error:', err?.message || err);
      }
    }

    if (!incomingPaymentGrant) throw lastError;
    if (!isFinalizedGrant(incomingPaymentGrant)) throw new Error('Esperando confirmación de pago.');

    // 4️⃣ Crear pago entrante
    const incomingPayment = await client.incomingPayment.create({
      url: receiverWalletAddress.resourceServer,
      accessToken: incomingPaymentGrant.access_token.value,
    }, {
      walletAddress: receiverWalletAddress.id,
      incomingAmount: {
        assetCode: receiverWalletAddress.assetCode,
        assetScale: receiverWalletAddress.assetScale,
        value: '100',
      },
    });

    console.log('Pago entrante creado:', incomingPayment);

    // 5️⃣ Permiso para cotización
    const quoteGrant = await client.grant.request({
      url: sendingWalletAddress.authServer,
    }, {
      access_token: {
        access: [{ type: 'quote', actions: ['create'] }],
      },
    });

    if (!isFinalizedGrant(quoteGrant)) throw new Error('Esperando confirmación de cotización.');

    // 6️⃣ Crear cotización
    const quote = await client.quote.create({
      url: receiverWalletAddress.resourceServer,
      accessToken: quoteGrant.access_token.value,
    }, {
      walletAddress: sendingWalletAddress.id,
      receiver: incomingPayment.id,
      method: 'ilp',
    });

    console.log('Cotización creada:', quote);

    // 7️⃣ Permiso para pago saliente
    const outgoingPaymentGrant = await client.grant.request({
      url: sendingWalletAddress.authServer,
    }, {
      access_token: {
        access: [{
          type: 'outgoing-payment',
          actions: ['create'],
          limits: { debitAmount: quote.debitAmount },
          identifier: sendingWalletAddress.id,
        }],
      },
      interact: { start: ['redirect'] },
    });

    console.log('Permiso para pago saliente obtenido:', outgoingPaymentGrant);

    // 8️⃣ Intentar finalizar el permiso (grant) automáticamente usando el flujo `continue`
    let finalizedOutgoingPaymentGrant = null;

    if (outgoingPaymentGrant && outgoingPaymentGrant.continue) {
      const continueUri = outgoingPaymentGrant.continue.uri;
      const continueToken = outgoingPaymentGrant.continue.access_token && outgoingPaymentGrant.continue.access_token.value;

      // Polling loop: intenta continuar el grant hasta que se finalice o se agote el timeout
      const maxAttempts = 12; // ~1 minuto si intervalMs = 5000
      const intervalMs = 5000;
      let attempt = 0;
      let lastErr = null;

      while (attempt < maxAttempts) {
        try {
          finalizedOutgoingPaymentGrant = await client.grant.continue({ url: continueUri, accessToken: continueToken });
          if (isFinalizedGrant(finalizedOutgoingPaymentGrant)) {
            break; // finalizado
          }
        } catch (err) {
          lastErr = err;
          // continuar intentando; el servidor puede tardar en procesar la interacción
          console.warn('Intento de continue falló (intento', attempt + 1, '):', err?.message || err);
          // Loguear detalles HTTP si existen para diagnóstico
          try {
            if (err && err.response) {
              console.error('continue error response status:', err.response.status);
              console.error('continue error response data:', JSON.stringify(err.response.data));
            }
          } catch (logErr) {
            console.error('Error al loguear err.response:', logErr);
          }
        }
        attempt += 1;
        await new Promise((r) => setTimeout(r, intervalMs));
      }

      if (!finalizedOutgoingPaymentGrant || !isFinalizedGrant(finalizedOutgoingPaymentGrant)) {
        // No se finalizó automáticamente
        let reason = lastErr ? (lastErr.message || String(lastErr)) : 'timeout';
        try {
          if (lastErr && lastErr.response && lastErr.response.data) {
            reason += ' | response: ' + JSON.stringify(lastErr.response.data);
          }
        } catch (e) {
          // ignore
        }
        throw new Error(`Esperando confirmación de pago saliente. Auto-continue no finalizó: ${reason}`);
      }
    } else if (outgoingPaymentGrant && outgoingPaymentGrant.interact && outgoingPaymentGrant.interact.redirect) {
      // No hay `continue` disponible — se requiere interacción manual
      throw new Error('El grant requiere interacción del usuario. Abre la URL en grant.interact.redirect para autorizar.');
    } else {
      throw new Error('No hay información de continue/interact para finalizar el grant.');
    }

    // 🔟 Crear el pago saliente
    const outgoingPayment = await client.outgoingPayment.create({
      url: sendingWalletAddress.resourceServer,
      accessToken: finalizedOutgoingPaymentGrant.access_token.value,
    }, {
      walletAddress: sendingWalletAddress.id,
      quoteUrl: quote.id,
    });

    console.log('Pago saliente creado:', outgoingPayment);

    // Retornar respuesta final del servidor
    return outgoingPayment;

  } catch (error) {
    console.error('❌ Error en el proceso de pago:', error);
    return { error: error.message || error };
  }
}
}

module.exports = InterService;