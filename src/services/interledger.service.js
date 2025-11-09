const { models } = require('../libs/sequlize');

// src/services/interledgerService.js
import { createAuthenticatedClient } from '@interledger/open-payments';

const SENDER_WALLET_URL = 'https://wallet.interledger-test.dev/account/049bfa28-9047-4609-abdd-de10d03fc98d';   // Cambia por tu URL real
const RECEIVER_WALLET_URL = 'https://wallet.interledger-test.dev/account/089a32a8-f27d-4778-8117-e3b173800dee';   // Cambia por tu URL real

const SENDER_KEY_ID = `${SENDER_WALLET_URL}/keys/1`;
const RECEIVER_KEY_ID = `${RECEIVER_WALLET_URL}/keys/1`;

// Claves (usa tus propias)
const SENDER_PRIVATE_KEY = 'MC4CAQAwBQYDK2VwBCIEIB5mtYyvUCWmL6KDzK0kHE7GBWt3+HMGo1xyG1/giDeO';

const RECEIVER_PUBLIC_KEY = 'MC4CAQAwBQYDK2VwBCIEILbsw+7o5hbOgTnFqR8wwoyTWAQVaaajOqN13XS9l9RO';


// Inicializar el cliente autenticado (emisor)
export async function initSenderClient() {
  const senderClient = await createAuthenticatedClient({
    walletAddressUrl: SENDER_WALLET_URL,
    keyId: SENDER_KEY_ID,
    privateKey: SENDER_PRIVATE_KEY,
  });

  console.log('✅ Cliente emisor ILP inicializado');
  return senderClient;
}

// Cliente receptor (solo lectura, para obtener info)
export async function initReceiverClient() {
  const receiverClient = await createAuthenticatedClient({
    walletAddressUrl: RECEIVER_WALLET_URL,
    keyId: RECEIVER_KEY_ID,
    privateKey: SENDER_PRIVATE_KEY, // usamos sender para firmar solicitudes
  });

  console.log('✅ Cliente receptor ILP inicializado');
  return receiverClient;
}

class InterledgerService {

    async createTransaction (transaction) {
        const transactionCreated = await models.Transaction.create(transaction);
        console.log (transactionCreated);
        return transactionCreated;
    }
    async finAll() {
        const transactions = await models.Transaction.findAll();
        console.log (transactions);
        return transactions;
    }
    async findById (id) {
        const transaction = await models.Transaction.findOne({ 
            where: {
                id_transaction: id
            }
        });
        console.log (transaction);
        return transaction;
    }
}

module.exports = InterledgerService;
