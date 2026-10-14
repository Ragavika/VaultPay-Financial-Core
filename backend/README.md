# VaultPay Backend

The Express backend protects the financial system: JWT authentication, admin/client roles, invoice ownership authorization, server-created Stripe PaymentIntents, cryptographically verified Stripe webhooks, PDF receipt generation, and receipt delivery by email.

## Run

1. Copy `.env.example` to `.env` and set Stripe and SMTP values.
2. Run `npm install` then `npm run dev`.
3. For local Stripe development: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`, then put Stripe's printed `whsec_...` value in `.env`.

## Local demo accounts

When `DEMO_SEED=true` outside production, startup creates these local-only users:

- Administrator: `admin@nexus.example` / `ChangeMeAdmin!2026`
- Client: `evelyn@example.com` / `ChangeMeClient!2026`

Set `DEMO_SEED=false` for an empty local repository. Production never seeds these users.

## Security controls

- Client invoice read and payment-intent routes compare the verified JWT subject to the invoice owner and return 403 on a mismatch.
- Only administrators can create invoices or retrieve the client list.
- Browsers cannot mark an invoice paid; the API derives Stripe amount/currency from the server invoice.
- `/api/webhooks/stripe` consumes raw bytes and verifies `stripe.webhooks.constructEvent` before updating any invoice.
- Webhook event IDs are tracked for idempotency; payment metadata, amount, and currency must match the invoice.
- Secrets are supplied only through environment variables. `.env` is excluded from version control.

## Production requirement

`src/data/repository.js` is a deliberately simple in-memory adapter for demonstrations and tests. Replace it with a database adapter using transactions and a unique Stripe-event constraint before any production deployment.

## Verification

Run `npm test`. The test suite covers missing JWTs, forbidden client-to-client invoice access, client-to-admin API access, and invalid Stripe signatures.
