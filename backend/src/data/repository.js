const crypto = require('crypto');
class MemoryRepository {
  constructor() { this.users = new Map(); this.invoices = new Map(); this.processedEvents = new Set(); }
  id() { return crypto.randomUUID(); }
  async addUser(user) { const record = { id: this.id(), ...user, createdAt: new Date().toISOString() }; this.users.set(record.id, record); return record; }
  async findUser(id) { return this.users.get(id) || null; }
  async findUserByEmail(email) { return [...this.users.values()].find((u) => u.email === email.toLowerCase()) || null; }
  async listClients() { return [...this.users.values()].filter((u) => u.role === 'client').map(({ passwordHash, ...u }) => u); }
  async addInvoice(input) { const record = { id: this.id(), status: 'Open', currency: 'usd', stripePaymentIntentId: null, receiptPath: null, paidAt: null, createdAt: new Date().toISOString(), ...input }; this.invoices.set(record.id, record); return record; }
  async findInvoice(id) { return this.invoices.get(id) || null; }
  async listInvoicesForClient(clientId) { return [...this.invoices.values()].filter((i) => i.clientId === clientId); }
  async listInvoices() { return [...this.invoices.values()]; }
  async markPaid({ invoiceId, paymentIntentId, receiptPath }) { const invoice = await this.findInvoice(invoiceId); if (!invoice || invoice.status === 'Paid') return invoice; Object.assign(invoice, { status: 'Paid', stripePaymentIntentId: paymentIntentId, receiptPath, paidAt: new Date().toISOString() }); return invoice; }
  async isEventProcessed(eventId) { return this.processedEvents.has(eventId); }
  async markEventProcessed(eventId) { this.processedEvents.add(eventId); }
}
module.exports = { MemoryRepository };

