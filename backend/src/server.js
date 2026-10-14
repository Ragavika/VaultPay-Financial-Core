require('dotenv').config();
const { createApp } = require('./app'); const { loadConfig } = require('./config'); const { MemoryRepository } = require('./data/repository'); const { seedDevelopmentData } = require('./data/demo-seed');
const config = loadConfig(); const repository = new MemoryRepository(); const app = createApp({ config, repository });
seedDevelopmentData(repository).then(() => app.listen(config.port, () => console.info(`VaultPay API listening on port ${config.port}`))).catch((error) => { console.error(error); process.exit(1); });
