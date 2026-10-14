const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs/promises');
function money(cents, currency) { return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: currency.toUpperCase() }); }
async function createReceipt(invoice, client, outputDir = path.join(process.cwd(), 'receipts')) {
  await fs.mkdir(outputDir, { recursive: true }); const output = path.join(outputDir, `receipt-${invoice.id}.pdf`);
  await new Promise((resolve, reject) => { const doc = new PDFDocument({ margin: 56 }); const stream = require('fs').createWriteStream(output); doc.pipe(stream); doc.fillColor('#102a43').fontSize(24).text('NEXUS CORPORATE SERVICES'); doc.moveDown(.3).fillColor('#486581').fontSize(10).text('VAULTPAY FINANCIAL CORE'); doc.moveDown(2); doc.fillColor('#0b6e4f').fontSize(36).text('PAID'); doc.moveDown(); doc.fillColor('#102a43').fontSize(14).text(`Payment Receipt #${invoice.id}`); doc.moveDown(); doc.fontSize(11).text(`Bill to: ${client.name}\n${client.email}\nInvoice: ${invoice.invoiceNumber}\nPaid: ${new Date(invoice.paidAt).toLocaleString('en-US', { timeZone: 'America/New_York' })}\nPayment reference: ${invoice.stripePaymentIntentId}`); doc.moveDown(2); doc.fontSize(16).text(`Amount paid: ${money(invoice.amount, invoice.currency)}`); doc.moveDown(3).fillColor('#627d98').fontSize(9).text('This receipt was generated after verified Stripe payment confirmation.'); doc.end(); stream.on('finish', resolve); stream.on('error', reject); }); return output;
}
module.exports = { createReceipt };
