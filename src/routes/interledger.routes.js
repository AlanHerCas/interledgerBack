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
// Wallet helper
router.get('/wallets', controller.getWalletAddresses);

module.exports = router;
