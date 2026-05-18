# FormiX

**Private by design** — encrypted forms on-chain with [Fhenix CoFHE](https://cofhe-docs.fhenix.zone/).

Built by **Emirhan** for Akindo Wave Hacks.

## Supported networks (official CoFHE)

Per [Compatibility](https://cofhe-docs.fhenix.zone/get-started/introduction/compatibility):

| Network | Chain ID | Public RPC (default) |
|---------|----------|----------------------|
| **Base Sepolia** (default) | `84532` | `https://sepolia.base.org` |
| Ethereum Sepolia | `11155111` | plugin / `SEPOLIA_RPC_URL` |
| Arbitrum Sepolia | `421614` | plugin / `ARB_SEPOLIA_RPC_URL` |

> **Not used:** legacy Fhenix Helium (`8008135`) — replaced by CoFHE on L1/L2 Sepolia testnets.

## Stack

- Contracts: `@fhenixprotocol/cofhe-contracts`, `@cofhe/hardhat-plugin`
- Frontend: `@cofhe/sdk`, Wagmi, RainbowKit, Next.js

## Quick start

### 1. Environment

Root `.env`:

```env
PRIVATE_KEY=0x...
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
```

`frontend/.env`:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...   # https://cloud.walletconnect.com
NEXT_PUBLIC_FORM_FACTORY_ADDRESS=0x...     # after deploy
NEXT_PUBLIC_CHAIN=baseSepolia              # or sepolia | arbitrumSepolia
```

### 2. Deploy contracts

```bash
cd contracts
npm install
npm run compile
npm run deploy:base-sepolia
```

Also: `npm run deploy:sepolia` · `npm run deploy:arb-sepolia`

### 3. Run frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 — connect wallet on **Base Sepolia**, fund with [Base Sepolia faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet) ETH.

## Deploy on Vercel

The Next.js app lives in **`frontend/`**. If Root Directory is wrong, Vercel shows `404: NOT_FOUND`.

1. [Vercel](https://vercel.com) → your project → **Settings** → **General** → **Root Directory** → set to **`frontend`** → Save.
2. **Settings** → **Environment Variables** (Production + Preview):
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
   - `NEXT_PUBLIC_FORM_FACTORY_ADDRESS`
   - `NEXT_PUBLIC_CHAIN` = `baseSepolia`
3. **Storage** → **Blob** → Create store (links `BLOB_READ_WRITE_TOKEN` to the project). Required for saving form schemas after deploy.
4. **Deployments** → **Redeploy** the latest commit.

Framework preset should be **Next.js**. Build command: `npm run build` (runs inside `frontend/`).

Without Blob, on-chain deploy succeeds but **“Could not save schema”** appears because serverless cannot write to `data/` on disk.

## Docs

- [Fhenix docs](https://cofhe-docs.fhenix.zone/)
- [Encrypting inputs](https://cofhe-docs.fhenix.zone/client-sdk/guides/encrypting-inputs)
- [Hardhat quick start](https://cofhe-docs.fhenix.zone/client-sdk/quick-start/hardhat)
