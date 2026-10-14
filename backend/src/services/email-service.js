const nodemailer = require('nodemailer');
async function sendReceipt({ config, invoice, client, filePath }) {
  if (config.emailMode === 'console') { console.info(JSON.stringify({ event: 'receipt_email_simulated', to: client.email, invoiceId: invoice.id })); return; }
  const transporter = nodemailer.createTransport({ host: config.smtp.host, port: config.smtp.port, secure: config.smtp.port === 465, auth: { user: config.smtp.user, pass: config.smtp.pass } });
  await transporter.sendMail({ from: config.smtp.from, to: client.email, subject: `Payment receipt for invoice ${invoice.invoiceNumber}`, text: `Your payment of ${(invoice.amount / 100).toFixed(2)} ${invoice.currency.toUpperCase()} has been received. Your receipt is attached.`, attachments: [{ filename: `receipt-${invoice.invoiceNumber}.pdf`, path: filePath }] });
  console.info(JSON.stringify({ event: 'receipt_email_sent', to: client.email, invoiceId: invoice.id }));
}
module.exports = { sendReceipt };
