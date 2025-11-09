const path = require("path");
const {
  createAuthenticatedClient,
  isFinalizedGrant,
} = require("@interledger/open-payments");
const { fileURLToPath } = require("url");
const fs = require("fs");

// Simple in-memory store for grants and resources (for demo/testing only)
const store = {
  grants: {},
  incomingPayments: {},
  quotes: {},
  outgoingPayments: {},
};

function makeId(prefix = "") {
  return (
    prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  );
}

function getPrivateKeyPath() {
  // Resolve private.key placed in project root (two levels up from src/controllers)
  return path.resolve(__dirname, "../../private.key");
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
    const receiverUrl = req.body.receiverUrl || process.env.receiver;
    const client = await createClient();

    const grant = await client.grant.request(
      { url: receiverUrl },
      {
        access_token: {
          access: [{ type: "incoming-payment", actions: ["create"] }],
        },
      }
    );

    const id = makeId("g_");
    store.grants[id] = grant;
    res.json({
      id,
      finalized: isFinalizedGrant(grant),
      grant,
    });
  } catch (err) {
    console.error("requestIncomingGrant error:", err);
    res.status(500).json({ error: err.message });
  }
}


// GET /api/interledger/wallets
async function getWalletAddresses(req, res) {
  try {
    const client = await createClient();
    const sending = await client.walletAddress.get({ url: process.env.sender });
    const receiving = await client.walletAddress.get({
      url: process.env.receiver,
    });
    res.json({ sending, receiving });
  } catch (err) {
    console.error(
      "getWalletAddresses error:",
      err && err.stack ? err.stack : err
    );
    res
      .status(500)
      .json({ error: err.message || "Error fetching wallet addresses" });
  }
}

// POST /api/interledger/incoming-payments
// POST /api/interledger/incoming-payments
async function createIncomingPayment(req, res) {
  try {
    const { grantId, receiverUrl, amount } = req.body;
    const grant = store.grants[grantId];
    if (!grant) return res.status(404).json({ error: "grant not found" });

    const client = await createClient();
    
    // Obtener datos de la wallet receptora
    const receiverWallet = await client.walletAddress.get({ url: receiverUrl });

    // Validar monto (en entero string)
    const valueStr = String(parseInt(amount, 10));
    if (isNaN(valueStr) || parseInt(valueStr) <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // Crear el pago entrante (incoming payment)
    const incoming = await client.incomingPayment.create({
      url: receiverWallet.resourceServer,
      accessToken: grant.access_token.value
    }, {
      walletAddress: receiverWallet.id,
      incomingAmount: {
        assetCode: receiverWallet.assetCode,
        assetScale: receiverWallet.assetScale,
        value: valueStr
      }
    });

    const id = makeId('ip_');
    store.incomingPayments[id] = incoming;

    res.json({ id, incoming });
  } catch (err) {
    console.error("createIncomingPayment error:", err);
    res.status(500).json({ error: err.message });
  }
}

// POST /api/interledger/grants/quote
async function requestQuoteGrant(req, res) {
  try {
    const senderUrl = req.body.walletUrl || process.env.sender;
    const client = await createClient();
    const grant = await client.grant.request(
      { url: senderUrl + "" },
      {
        access_token: { access: [{ type: "quote", actions: ["create"] }] },
      }
    );
    const id = makeId("g_");
    store.grants[id] = grant;
    res.json({
      id,
      finalized: isFinalizedGrant(grant),
      grant: {
        interact: grant.interact,
        continue: grant.continue,
        access_token: grant.access_token,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/interledger/quotes
async function createQuote(req, res) {
  try {
    const { grantId, sendingWallet, incomingPaymentUrl } = req.body;
    const grant = store.grants[grantId];
    if (!grant) return res.status(404).json({ error: "grant not found" });
    const client = await createClient();
    const quote = await client.quote.create(
      {
        url: sendingWallet.resourceServer,
        accessToken: grant.access_token.value,
      },
      {
        walletAddress: sendingWallet.id,
        receiver: incomingPaymentUrl,
        method: "ilp",
      }
    );
    const id = makeId("q_");
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
    const grant = await client.grant.request(
      { url: sendingWallet.authServer },
      {
        access_token: {
          access: [
            {
              type: "outgoing-payment",
              actions: ["create"],
              limits: { debitAmount },
              identifier: sendingWallet.id,
            },
          ],
        },
        interact: { start: ["redirect"] },
      }
    );
    const id = makeId("g_");
    store.grants[id] = grant;
    res.json({
      id,
      finalized: isFinalizedGrant(grant),
      grant: { interact: grant.interact, continue: grant.continue },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/interledger/grants/:id/continue
async function continueGrant(req, res) {
  try {
    const { id } = req.params;
    const grant = store.grants[id];
    if (!grant) return res.status(404).json({ error: "grant not found" });
    if (!grant.continue)
      return res.status(400).json({ error: "grant has no continue info" });
    const client = await createClient();
    const continued = await client.grant.continue({
      url: grant.continue.uri,
      accessToken: grant.continue.access_token.value,
    });
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
    if (!grant) return res.status(404).json({ error: "grant not found" });
    if (!isFinalizedGrant(grant))
      return res.status(400).json({ error: "grant not finalized" });
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

  //Nuevos

  // GET /api/interledger/outgoing-payments
  async function listOutgoingPayments(req, res) { // Es para listar los pagos salientes
    try {
      const payments = Object.entries(store.outgoingPayments).map(
        ([id, payment]) => ({
          id,
          ...payment,
        })
      );
      res.json({ count: payments.length, payments });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
  // GET /api/interledger/incoming-payments
  async function listIncomingPayments(req, res) { // Es para listar los pagos entrantes
    try {
      const payments = Object.entries(store.incomingPayments).map(
        ([id, payment]) => ({
          id,
          ...payment,
        })
      );
      res.json({ count: payments.length, payments });
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
  listOutgoingPayments,
  listIncomingPayments,
  store,
};
