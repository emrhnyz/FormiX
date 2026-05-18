# FormiX

**Private by design** — encrypted forms on-chain with [Fhenix CoFHE](https://cofhe-docs.fhenix.zone/).

Built by **Emirhan** and **Eren** for Akindo Wave Hacks.

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

## Docs

- [Fhenix docs](https://cofhe-docs.fhenix.zone/)
- [Encrypting inputs](https://cofhe-docs.fhenix.zone/client-sdk/guides/encrypting-inputs)
- [Hardhat quick start](https://cofhe-docs.fhenix.zone/client-sdk/quick-start/hardhat)
