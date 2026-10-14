const requiredInProduction = ['JWT_SECRET', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'];
function loadConfig(env = process.env) {
  const isProduction = env.NODE_ENV === 'production';
  if (isProduction) { const missing = requiredInProduction.filter((key) => !env[key]); if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(', ')}`); }
  return { env: env.NODE_ENV || 'development', port: Number(env.PORT || 3000), jwtSecret: env.JWT_SECRET || 'development-only-change-me-do-not-deploy', jwtExpiresIn: env.JWT_EXPIRES_IN || '1h', stripeKey: env.STRIPE_SECRET_KEY || '', stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET || '', clientOrigin: env.CLIENT_ORIGIN || '', emailMode: env.EMAIL_MODE || 'console', smtp: { host: env.SMTP_HOST, port: Number(env.SMTP_PORT || 587), user: env.SMTP_USER, pass: env.SMTP_PASS, from: env.SMTP_FROM || 'billing@nexus.example' } };
}
module.exports = { loadConfig };
