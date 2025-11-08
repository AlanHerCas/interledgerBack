// src/controllers/paymentController.js
import { initSenderClient, initReceiverClient } from '../services/interledger.service.js';

export async function simulatePayment(req, res) {
  try {
    const senderClient = await initSenderClient();
    const receiverClient = await initReceiverClient();

    // 1️⃣ Obtener info del receptor (su payment pointer)
    const receiverWallet = await receiverClient.walletAddress.get({
      url: 'https://wallet.interledger-test.dev/account/089a32a8-f27d-4778-8117-e3b173800dee', // URL real del receptor
    });

    console.log('Receiver wallet info:', receiverWallet);

    // 2️⃣ Crear una cotización de pago (quote)
    const quote = await senderClient.quote.create({
      walletAddressUrl: 'https://wallet.interledger-test.dev/account/049bfa28-9047-4609-abdd-de10d03fc98d', // URL real del emisor
      receiver: 'https://wallet.interledger-test.dev/account/089a32a8-f27d-4778-8117-e3b173800dee', // URL real del receptor
      debitAmount: {
        value: '50', // monto a enviar (en la moneda del emisor)
        assetCode: '€',
        assetScale: 2,
      },
    });

    console.log('Quote creada:', quote);

    // 3️⃣ Crear el pago usando la cotización
    const payment = await senderClient.outgoingPayment.create({
      walletAddressUrl: 'https://wallet.interledger-test.dev/account/049bfa28-9047-4609-abdd-de10d03fc98d', // URL real del emisor
      quoteUrl: quote.id,
      metadata: {
        description: 'Pago de artesanía (demo)',
      },
    });

    console.log('Pago realizado:', payment);

    res.status(200).json({
      message: '✅ Transacción simulada con éxito',
      payment,
    });
  } catch (error) {
    console.error('Error al simular pago:', error);
    res.status(500).json({ error: error.message });
  }
}
