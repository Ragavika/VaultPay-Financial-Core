const { hashPassword } = require('../services/password-service');
async function seedDevelopmentData(repository) {
  if (process.env.NODE_ENV === 'production' || process.env.DEMO_SEED === 'false') return;
  if (await repository.findUserByEmail('admin@nexus.example')) return;
  const admin = await repository.addUser({ name: 'Nexus Administrator', email: 'admin@nexus.example', role: 'admin', passwordHash: await hashPassword('ChangeMeAdmin!2026') });
  const client = await repository.addUser({ name: 'Evelyn Croft', email: 'evelyn@example.com', role: 'client', passwordHash: await hashPassword('ChangeMeClient!2026') });
  await repository.addInvoice({ clientId: client.id, invoiceNumber: 'NEX-2026-0001', amount: 1250000, description: 'Corporate financial consulting' });
  console.info('Development demo data created. Do not use demo credentials in production.');
  return { admin, client };
}
module.exports = { seedDevelopmentData };
