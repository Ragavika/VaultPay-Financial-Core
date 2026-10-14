# VaultPay Financial Core

This repository is organized as two independently runnable applications:

- `frontend/` — browser portal for administrators and clients.
- `backend/` — secured Express API, Stripe webhook handler, PDF receipt, and mail delivery.

## Start the applications

1. Configure `backend/.env` from `backend/.env.example`.
2. In one terminal: `cd backend` then `npm install` and `npm run dev`.
3. In a second terminal: `cd frontend` then `npm run dev`.
4. Visit `http://localhost:5173`.

The frontend does not contain private keys. Add only a Stripe **publishable** (`pk_test_...`) key in the portal's connection settings. Stripe secret keys and the webhook secret stay in `backend/.env`.

Detailed API and production guidance: [backend/README.md](backend/README.md).


