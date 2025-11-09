const path = require('path');
const { createAuthenticatedClient, isFinalizedGrant } = require('@interledger/open-payments');
const { fileURLToPath } = require('url');
const fs = require('fs');

// Simple in-memory store for grants and resources (for demo/testing only)
const store = {
  grants: {},
  incomingPayments: {},
  quotes: {},
  outgoingPayments: {}
};

function makeId(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function getPrivateKeyPath() {
  // Resolve private.key placed in project root (two levels up from src/controllers)
  return path.resolve(__dirname, '../../private.key');
}

async function createClient() {
  const walletAddressUrl = process.env.client;
  const keyId = process.env.key_id;
  const privateKeyPath = getPrivateKeyPath();
  // Support multiple private key sources:
  // 1) process.env.private_key containing a PEM string
  // 2) process.env.private_key containing a base64/raw key which we convert to PEM
  // 3) a file at ./private.key (resolved by getPrivateKeyPath)
  const envKey = process.env.private_key;
  let privateKeyOption;

  if (envKey) {
    // If env contains PEM headers, use it directly
    if (envKey.includes('-----BEGIN')) {
      console.log('Using private key from environment (PEM)');
      privateKeyOption = envKey;
    } else {
      // Assume it's a base64-like single-line key; wrap to PEM format
      console.log('Converting private_key from .env to PEM format');
      const cleaned = envKey.replace(/\r|\n|\s+/g, '');
      const chunks = cleaned.match(/.{1,64}/g) || [cleaned];
      privateKeyOption = `-----BEGIN PRIVATE KEY-----\n${chunks.join('\n')}\n-----END PRIVATE KEY-----`;
    }
  } else if (fs.existsSync(privateKeyPath)) {
    console.log('Using private.key file at', privateKeyPath);
    privateKeyOption = privateKeyPath;
  } else {
    throw new Error(`private.key not found at ${privateKeyPath} and process.env.private_key is not set`);
  }

  // Create authenticated client using either a PEM string or a path
  return await createAuthenticatedClient({
    walletAddressUrl,
    privateKey: privateKeyOption,
    keyId
  });
}

// POST /api/interledger/grants/incoming
async function requestIncomingGrant(req, res) {
  try {
    const receiverUrl = req.body.walletUrl || process.env.receiver;
    const client = await createClient();
    const grant = await client.grant.request({ url: receiverUrl + '' }, {
      access_token: { access: [{ type: 'incoming-payment', actions: ['create'] }] }
    });
    const id = makeId('g_');
    store.grants[id] = grant;
    res.json({ id, finalized: isFinalizedGrant(grant), grant: { interact: grant.interact, continue: grant.continue, access_token: grant.access_token } });
  } catch (err) {
    // Log full error server-side for debugging (includes stack and structured details)
    console.error('requestIncomingGrant error (stack):', err && err.stack ? err.stack : err);
    // The OpenPaymentsClientError thrown by the library includes structured fields
    if (err && typeof err === 'object') {
      console.error('error.message:', err.message);
      if ('description' in err) console.error('error.description:', err.description);
      if ('status' in err) console.error('error.status:', err.status);
      if ('code' in err) console.error('error.code:', err.code);
      if ('details' in err) console.error('error.details:', err.details);
    }
    // Some errors may include an underlying response (from HTTP client)
    if (err && err.response) {
      try {
        console.error('response status:', err.response.status);
        console.error('response data:', JSON.stringify(err.response.data));
      } catch (e) {
        console.error('error reading err.response:', e);
      }
    }
    // Return a concise error message to the client
    res.status(500).json({ error: err.message || 'Error making Open Payments POST request' });
  }
}

// GET /api/interledger/wallets
async function getWalletAddresses(req, res) {
  try {
    const client = await createClient();
    const sending = await client.walletAddress.get({ url: process.env.sender });
    const receiving = await client.walletAddress.get({ url: process.env.receiver });
    res.json({ sending, receiving });
  } catch (err) {
    console.error('getWalletAddresses error:', err && err.stack ? err.stack : err);
    res.status(500).json({ error: err.message || 'Error fetching wallet addresses' });
  }
}

// POST /api/interledger/incoming-payments
async function createIncomingPayment(req, res) {
  try {
    const { grantId, walletAddress, amount, incomingAmount } = req.body;
    const grant = store.grants[grantId];
    if (!grant) return res.status(404).json({ error: 'grant not found' });
    const client = await createClient();
    // Determine the incoming amount value. Accept either:
    // - incomingAmount: { value: '123', assetCode, assetScale }
    // - amount: numeric (e.g. 100)
    let valueStr;
    if (incomingAmount && typeof incomingAmount.value !== 'undefined') {
      // If incomingAmount.value provided, accept only digits string
      if (typeof incomingAmount.value !== 'string' || !/^[0-9]+$/.test(incomingAmount.value)) {
        return res.status(400).json({ error: 'incomingAmount.value must be a string of digits (uint64)' });
      }
      valueStr = incomingAmount.value;
    } else if (typeof amount !== 'undefined') {
      // Accept number or numeric string
      if (typeof amount === 'number') {
        if (!Number.isInteger(amount) || amount < 0) return res.status(400).json({ error: 'amount must be a non-negative integer' });
        valueStr = String(amount);
      } else if (typeof amount === 'string' && /^[0-9]+$/.test(amount)) {
        valueStr = amount;
      } else {
        return res.status(400).json({ error: 'amount must be an integer or numeric string' });
      }
    } else {
      valueStr = '100';
    }

    const incoming = await client.incomingPayment.create({ url: walletAddress.resourceServer, accessToken: grant.access_token.value }, {
      walletAddress: walletAddress.id,
      incomingAmount: { assetCode: walletAddress.assetCode, assetScale: walletAddress.assetScale, value: valueStr }
    });
    const id = makeId('ip_');
    store.incomingPayments[id] = incoming;
    res.json({ id, incoming });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/interledger/grants/quote
async function requestQuoteGrant(req, res) {
  try {
    const senderUrl = req.body.walletUrl || process.env.sender;
    const client = await createClient();
    const grant = await client.grant.request({ url: senderUrl + '' }, {
      access_token: { access: [{ type: 'quote', actions: ['create'] }] }
    });
    const id = makeId('g_');
    store.grants[id] = grant;
    res.json({ id, finalized: isFinalizedGrant(grant), grant: { interact: grant.interact, continue: grant.continue, access_token: grant.access_token } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/interledger/quotes
async function createQuote(req, res) {
  try {
    const { grantId, sendingWallet, incomingPaymentUrl } = req.body;
    const grant = store.grants[grantId];
    if (!grant) return res.status(404).json({ error: 'grant not found' });
    const client = await createClient();
    const quote = await client.quote.create({ url: sendingWallet.resourceServer, accessToken: grant.access_token.value }, {
      walletAddress: sendingWallet.id,
      receiver: incomingPaymentUrl,
      method: 'ilp'
    });
    const id = makeId('q_');
    store.quotes[id] = quote;
    res.json({ id, quote });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/interledger/grants/outgoing
async function requestOutgoingGrant(req, res) {
  try {
    const { sendingWallet, debitAmount } = req.body;
    const client = await createClient();
    const grant = await client.grant.request({ url: sendingWallet.authServer }, {
      access_token: { access: [{ type: 'outgoing-payment', actions: ['create'], limits: { debitAmount }, identifier: sendingWallet.id }] },
      interact: { start: ['redirect'] }
    });
    const id = makeId('g_');
    store.grants[id] = grant;
    res.json({ id, finalized: isFinalizedGrant(grant), grant: { interact: grant.interact, continue: grant.continue } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/interledger/grants/:id/continue
async function continueGrant(req, res) {
  try {
    const { id } = req.params;
    const grant = store.grants[id];
    if (!grant) return res.status(404).json({ error: 'grant not found' });
    if (!grant.continue) return res.status(400).json({ error: 'grant has no continue info' });
    const client = await createClient();
    const continued = await client.grant.continue({ url: grant.continue.uri, accessToken: grant.continue.access_token.value });
    store.grants[id] = continued;
    res.json({ finalized: isFinalizedGrant(continued), grant: continued });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/interledger/outgoing-payments
async function createOutgoingPayment(req, res) {
  try {
    const { grantId, sendingWallet, quoteUrl } = req.body;
    const grant = store.grants[grantId];
    if (!grant) return res.status(404).json({ error: 'grant not found' });
    if (!isFinalizedGrant(grant)) return res.status(400).json({ error: 'grant not finalized' });
    const client = await createClient();
    const payment = await client.outgoingPayment.create({ url: sendingWallet.resourceServer, accessToken: grant.access_token.value }, {
      walletAddress: sendingWallet.id,
      quoteId: quoteUrl
    });
    const id = makeId('op_');
    store.outgoingPayments[id] = payment;
    res.json({ id, payment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  requestIncomingGrant,
  createIncomingPayment,
  requestQuoteGrant,
  createQuote,
  requestOutgoingGrant,
  continueGrant,
  createOutgoingPayment,
  getWalletAddresses,
  store
};
