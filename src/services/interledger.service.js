// Importamos las librerías necesarias
import { createAuthenticatedClient, isFinalizedGrant } from '@interledger/open-payments';
import dotenv from 'dotenv';
import { access, read } from 'fs';
import { type } from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline/promises';


// ==== CONFIGURACIÓN INICIAL ====

// Solución para obtener __dirname en módulos ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno desde el archivo .env (ubicado dos niveles arriba)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// ==== VARIABLES DEL ENTORNO ====
// Estas variables deben existir en tu archivo .env
const walletAddressUrl = process.env.client; // Usuario cliente hack  // URL de la wallet del cliente
const keyId = process.env.key_id; // API KEY para EURO             // ID de la clave pública
const sender = process.env.sender; // Uusuario de Jena            // URL de la wallet del remitente
const receiver = process.env.receiver;    // Uusuario de Diego     // URL de la wallet del receptor


// ==== PROCESO PRINCIPAL ====
(async () => {

    // 1️⃣ Crear un cliente autenticado usando la clave privada y el keyId
    const client = await createAuthenticatedClient({
        walletAddressUrl,
        privateKey: path.resolve(__dirname, '../../private.key'), // Ruta al archivo con la clave privada
        keyId
    });

    // 2️⃣ Obtener información de las wallets del remitente y receptor
    const sendingWalletAddress = await client.walletAddress.get({ 
        url: sender 
    });
    const receiverWalletAddress = await client.walletAddress.get({ 
        url: receiver 
    });

    console.log('Dirección del remitente:', sendingWalletAddress);
    console.log('Dirección del receptor:', receiverWalletAddress);


    // ==== 3️⃣ SOLICITAR PERMISO PARA CREAR UN PAGO ENTRANTE ====

    // Se prueban distintos nombres posibles para el tipo de permiso (por compatibilidad)
    const accessTypes = ['incoming_payment', 'incoming-payment', 'incoming-payments', 'incoming_payments'];
    let incomingPaymentGrant;
    let lastError;

    // Intentar cada tipo hasta que uno funcione
    for (const typeName of accessTypes) {
        try {
            console.log('Intentando grant.request con tipo de acceso:', typeName);
            incomingPaymentGrant = await client.grant.request({
                url: receiverWalletAddress.authServer, // Servidor de autorización del receptor
            },{
                access_token: {
                    access: [
                        {
                            type: typeName,       // Tipo de permiso (crear pago entrante)
                            actions: ['create'],  // Acción permitida
                        },
                    ],
                },
            });
            // Si funciona, se sale del bucle
            break;
        } catch (err) {
            lastError = err;
            console.warn('Fallo grant request para tipo', typeName, 'error:', err?.message || err);
        }
    }

    // Si no se pudo obtener ningún permiso, mostrar error
    if (!incomingPaymentGrant) {
        // Inform about the failure and exit cleanly so the runner can capture details
        console.error(JSON.stringify({ status: 'error', stage: 'incoming_grant_request', message: String(lastError?.message || lastError) }));
        process.exit(1);
    }

    // Verificar que el permiso esté finalizado (ya autorizado)
    if (!isFinalizedGrant(incomingPaymentGrant)) {
        // Instead of throwing, print a JSON status and exit successfully so the controller can surface it
        console.log(JSON.stringify({ status: 'awaiting_confirmation', stage: 'incoming_grant', message: 'Esperando confirmación de pago.' }));
        process.exit(0);
    }

    console.log('Permiso (grant) para pago entrante obtenido:', incomingPaymentGrant);


    // ==== 4️⃣ CREAR UN PAGO ENTRANTE (INCOMING PAYMENT) PARA EL RECEPTOR ====
    // Allow overriding incoming amount via env var INCOMING_AMOUNT (digits-only string)
    const incomingAmountValue = (process.env.INCOMING_AMOUNT && /^[0-9]+$/.test(process.env.INCOMING_AMOUNT))
        ? process.env.INCOMING_AMOUNT
        : '50000';

    const incomingPayment = await client.incomingPayment.create({
        url: receiverWalletAddress.resourceServer,                 // Servidor de recursos del receptor
        accessToken: incomingPaymentGrant.access_token.value,      // Token de acceso autorizado
    },{
        walletAddress: receiverWalletAddress.id,                   // ID de la wallet receptora
        incomingAmount:{
            assetCode: receiverWalletAddress.assetCode,            // Código del activo (por ej. USD)
            assetScale: receiverWalletAddress.assetScale,          // Escala del activo
            value: incomingAmountValue,                            // Monto máximo permitido (en entero)
        },
    });
    console.log('Pago entrante creado:', incomingPayment);


    // ==== 5️⃣ SOLICITAR PERMISO PARA CREAR UNA COTIZACIÓN (QUOTE) ====
    const quoteGrant = await client.grant.request({
        url: sendingWalletAddress.authServer, // Servidor de autorización del remitente
    },{
        access_token: {
            access: [
                {
                    type: 'quote',           // Tipo de permiso: crear cotización
                    actions: ['create'],
                },
            ],
        },
    });

    // Verificar que la autorización esté completa
    if (!isFinalizedGrant(quoteGrant)) {
        console.log(JSON.stringify({ status: 'awaiting_confirmation', stage: 'quote_grant', message: 'Esperando confirmación de cotización.' }));
        process.exit(0);
    }
    console.log('Permiso (grant) para cotización obtenido:', quoteGrant);


    // ==== 6️⃣ CREAR UNA COTIZACIÓN ENTRE EL REMITENTE Y EL RECEPTOR ====
    const quote = await client.quote.create({
        url: receiverWalletAddress.resourceServer,
        accessToken: quoteGrant.access_token.value,
    },{
        walletAddress: sendingWalletAddress.id,  // ID de la wallet que enviará
        receiver: incomingPayment.id,             // El receptor es el pago entrante que acabamos de crear
        method: "ilp",                            // Protocolo Interledger
    });

    console.log('Cotización creada:', quote);


    // ==== 7️⃣ SOLICITAR PERMISO PARA CREAR UN PAGO SALIENTE (OUTGOING PAYMENT) ====
    const outgoingPaymentGrant = await client.grant.request({
        url: sendingWalletAddress.authServer,
    },{
        access_token: {
            access: [{
                type: 'outgoing-payment',           // Tipo de permiso
                actions: ['create'],                // Acción permitida
                limits:{ debitAmount: quote.debitAmount }, // Monto límite basado en la cotización
                identifier: sendingWalletAddress.id // Identificador de la wallet remitente
            }],
        },
        interact: {
            start: ["redirect"], // Tipo de interacción (puede requerir aprobación del usuario)
        },
    });

    console.log('Permiso (grant) para pago saliente obtenido:', outgoingPaymentGrant);


    // ==== 8️⃣ INTERACCIÓN (AUTO) ====
    // Esperar automáticamente 15 segundos antes de continuar (simula aprobación automática)
    console.log('Esperando 15 segundos antes de intentar continuar el grant automáticamente...');
    await new Promise((resolve) => setTimeout(resolve, 15000));


    // ==== 9️⃣ FINALIZAR EL GRANT DEL PAGO SALIENTE ====
    const finalizedOutgoingPaymentGrant = await client.grant.continue({
        url: outgoingPaymentGrant.continue.uri,
        accessToken: outgoingPaymentGrant.continue.access_token.value,
    });

    if (!isFinalizedGrant(finalizedOutgoingPaymentGrant)) {
        console.log(JSON.stringify({ status: 'awaiting_confirmation', stage: 'outgoing_grant', message: 'Esperando confirmación de pago saliente.' }));
        process.exit(0);
    }


    // 🔟 CREAR EL PAGO SALIENTE (OUTGOING PAYMENT)
    const outgoingPayment =  await client.outgoingPayment.create({
        url: sendingWalletAddress.resourceServer,
        accessToken: finalizedOutgoingPaymentGrant.access_token.value,
    },{
        walletAddress: sendingWalletAddress.id,  // Wallet que envía
        quoteId: quote.id,                      // ID de la cotización asociada (campo requerido por Open Payments)
    });

    console.log('Pago saliente creado:', outgoingPayment);
})();
