const express = require('express');
const router = express.Router();
const controller = require('../controllers/interledger.controller');

// Grants and payments
router.post('/grants/incoming', controller.requestIncomingGrant);
router.post('/incoming-payments', controller.createIncomingPayment);
router.post('/grants/quote', controller.requestQuoteGrant);
router.post('/quotes', controller.createQuote);
router.post('/grants/outgoing', controller.requestOutgoingGrant);
router.post('/grants/:id/continue', controller.continueGrant);
router.post('/outgoing-payments', controller.createOutgoingPayment);

router.get('/outgoing-payments', controller.listOutgoingPayments);
router.get('/incoming-payments', controller.listIncomingPayments);


// Wallet helper
router.get('/wallets', controller.getWalletAddresses);
// Run full interledger service script (runs src/services/interledger.service.js)
router.post('/run-service', controller.runInterledgerService);

module.exports = router;
