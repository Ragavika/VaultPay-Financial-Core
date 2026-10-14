const express = require('express');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const Stripe = require('stripe');
const { loadConfig } = require('./config');
const { MemoryRepository } = require('./data/repository');
const { authenticate, requireRole } = require('./middleware/auth');
const { AppError, forbidden } = require('./lib/errors');
const { verifyPassword } = require('./services/password-service');
const { createReceipt } = require('./services/receipt-service');
const { sendReceipt } = require('./services/email-service');

function publicUser(user) { const { passwordHash, ...safe } = user; return safe; }
function asyncRoute(fn) { return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next); }
function requireFields(body, fields) { for (const f of fields) if (body[f] === undefined || body[f] === '') throw new AppError(400, `${f} is required.`, 'VALIDATION_ERROR'); }
function createApp({ config = loadConfig(), repository = new MemoryRepository(), stripe = null, receiptCreator = createReceipt, mailer = sendReceipt } = {}) {
  const stripeClient = stripe || (config.stripeKey ? new Stripe(config.stripeKey) : null); const app = express();
  app.disable('x-powered-by'); app.use(helmet());
  // The browser portal is allow-listed; credentials are not used because auth is Bearer JWT-based.
  app.use((req, res, next) => { if (config.clientOrigin && req.headers.origin === config.clientOrigin) { res.set('Access-Control-Allow-Origin', config.clientOrigin); res.set('Vary', 'Origin'); res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type'); res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); } if (req.method === 'OPTIONS') return res.sendStatus(204); next(); });
  app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), asyncRoute(async (req, res) => {
    if (!stripeClient || !config.stripeWebhookSecret) throw new AppError(503, 'Payment webhook is not configured.', 'NOT_CONFIGURED');
    const signature = req.headers['stripe-signature']; let event;
    try { event = stripeClient.webhooks.constructEvent(req.body, signature, config.stripeWebhookSecret); } catch { throw new AppError(400, 'Invalid Stripe signature.', 'INVALID_SIGNATURE'); }
    if (await repository.isEventProcessed(event.id)) return res.status(200).json({ received: true, duplicate: true });
    if (event.type === 'payment_intent.succeeded') { const intent = event.data.object; const invoiceId = intent.metadata?.invoiceId; const invoice = invoiceId && await repository.findInvoice(invoiceId); if (!invoice || invoice.amount !== intent.amount_received || invoice.currency !== intent.currency) { console.error(JSON.stringify({ event: 'payment_rejected', reason: 'invoice_metadata_or_amount_mismatch', stripeEvent: event.id })); await repository.markEventProcessed(event.id); return res.status(200).json({ received: true }); }
      const client = await repository.findUser(invoice.clientId); const paid = await repository.markPaid({ invoiceId, paymentIntentId: intent.id }); const filePath = await receiptCreator(paid, client); paid.receiptPath = filePath; await mailer({ config, invoice: paid, client, filePath }); console.info(JSON.stringify({ event: 'invoice_paid', invoiceId, stripeEvent: event.id })); }
    await repository.markEventProcessed(event.id); res.status(200).json({ received: true });
  }));
  app.use(express.json({ limit: '100kb' }));
  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  app.post('/api/auth/login', asyncRoute(async (req, res) => { requireFields(req.body, ['email', 'password']); const user = await repository.findUserByEmail(String(req.body.email).toLowerCase()); if (!user || !(await verifyPassword(req.body.password, user.passwordHash))) throw new AppError(401, 'Invalid email or password.', 'UNAUTHORIZED'); const token = jwt.sign({ sub: user.id, role: user.role, email: user.email }, config.jwtSecret, { algorithm: 'HS256', expiresIn: config.jwtExpiresIn }); res.json({ token, user: publicUser(user) }); }));
  app.use('/api', authenticate(config));
  app.get('/api/invoices', asyncRoute(async (req, res) => { const invoices = req.user.role === 'admin' ? await repository.listInvoices() : await repository.listInvoicesForClient(req.user.sub); res.json({ invoices }); }));
  app.get('/api/invoices/:invoiceId', asyncRoute(async (req, res) => { const invoice = await repository.findInvoice(req.params.invoiceId); if (!invoice) throw new AppError(404, 'Invoice not found.', 'NOT_FOUND'); if (req.user.role !== 'admin' && invoice.clientId !== req.user.sub) throw forbidden(); res.json({ invoice }); }));
  app.post('/api/invoices', requireRole('admin'), asyncRoute(async (req, res) => { requireFields(req.body, ['clientId', 'invoiceNumber', 'amount', 'description']); const client = await repository.findUser(req.body.clientId); if (!client || client.role !== 'client') throw new AppError(400, 'clientId must refer to an existing client.', 'VALIDATION_ERROR'); const amount = Number(req.body.amount); if (!Number.isInteger(amount) || amount < 500000 || amount > 5000000) throw new AppError(400, 'amount must be an integer number of cents between $5,000 and $50,000.', 'VALIDATION_ERROR'); const invoice = await repository.addInvoice({ clientId: client.id, invoiceNumber: String(req.body.invoiceNumber), amount, description: String(req.body.description), currency: String(req.body.currency || 'usd').toLowerCase() }); res.status(201).json({ invoice }); }));
  app.get('/api/clients', requireRole('admin'), asyncRoute(async (req, res) => res.json({ clients: await repository.listClients() })));
  app.post('/api/invoices/:invoiceId/payment-intent', requireRole('client'), asyncRoute(async (req, res) => { if (!stripeClient) throw new AppError(503, 'Payments are not configured.', 'NOT_CONFIGURED'); const invoice = await repository.findInvoice(req.params.invoiceId); if (!invoice) throw new AppError(404, 'Invoice not found.', 'NOT_FOUND'); if (invoice.clientId !== req.user.sub) throw forbidden(); if (invoice.status === 'Paid') throw new AppError(409, 'Invoice is already paid.', 'ALREADY_PAID'); const intent = await stripeClient.paymentIntents.create({ amount: invoice.amount, currency: invoice.currency, metadata: { invoiceId: invoice.id }, description: `Nexus invoice ${invoice.invoiceNumber}` }); res.status(201).json({ clientSecret: intent.client_secret }); }));
  app.use((err, req, res, next) => { const status = err.status || 500; if (status >= 500) console.error(err); res.status(status).json({ error: { code: err.code || 'INTERNAL_ERROR', message: status === 500 ? 'An unexpected error occurred.' : err.message } }); });
  return app;
}
module.exports = { createApp };



