# FormiX — Hackathon submission

**Private by design** — encrypted forms on-chain with [Fhenix CoFHE](https://cofhe-docs.fhenix.zone/).

Built by **Emirhan** for **Akindo Wave Hacks**.

**Repository:** [github.com/emrhnyz/FormiX](https://github.com/emrhnyz/FormiX)

---

## What it does

**FormiX** is a privacy-first form platform on the blockchain. Creators deploy an `EncryptedForm` contract via **FormFactory**, define questions (text, choice, multi-select, polls, optional photo prompts), and optionally attach **fill-to-earn** ETH rewards.

Respondents connect a wallet, encrypt every answer in the browser with **Fhenix CoFHE**, and submit ciphertext on **Base Sepolia**—one transaction per FHE question, then a **finalize** step to seal the response.

Only the form owner can decrypt aggregates and text answers in the **creator dashboard** inside their wallet session. Third parties see on-chain activity, not plaintext answers.

---

## The problem it solves

Most form tools store responses as **plain text on a central server**. That creates operator risk, breach exposure, and weak guarantees for sensitive surveys, applications, and community polls.

Putting forms on-chain alone does not fix privacy if answers are readable in contract storage.

FormiX targets **confidential responses with verifiable integrity**: schema and settings live on-chain, answers stay **FHE-encrypted** before they are written, and decryption is limited to the creator. Optional **ETH bounties** incentivize completions without exposing individual replies.

---

## Challenges I ran into

- **CoFHE + gas on testnet** — FHE submissions are heavy; I batch per question and cap practical form size (~4 FHE questions per form on current testnet limits).
- **ABI / contract drift** — Public getter types and old-contract detection needed on-chain probes instead of brittle bytecode checks after redeploys.
- **Partial submission state** — If FHE txs succeed but finalize fails, the UI must detect `fheAnswersRecorded` and resume with **finalize-only** instead of resubmitting ciphertext (reverts with “Question already answered”).
- **Creator-only dashboard** — Only the deploying wallet may list forms and decrypt results; wallet-bound API auth and on-chain creator checks.
- **SDK integration** — Wiring `@cofhe/sdk` with Wagmi/RainbowKit, Base Sepolia config, and reliable encrypt → submit → decrypt loops.
- **Product polish** — Rebrand to FormiX, English UI, privacy-themed UX, and stable demo flows while the build remains an **early preview**, not a final release.

---

## Technologies I used

| Layer | Stack |
|--------|--------|
| **Smart contracts** | Solidity, Hardhat, `@fhenixprotocol/cofhe-contracts`, `@cofhe/hardhat-plugin` |
| **Frontend** | Next.js 14, React, TypeScript, Tailwind CSS |
| **Wallet** | Wagmi v2, RainbowKit, Viem |
| **Encryption** | Fhenix **CoFHE** client SDK (`@cofhe/sdk`) |
| **Network** | **Base Sepolia** (Ethereum / Arbitrum Sepolia compatible per CoFHE docs) |
| **Storage** | On-chain ciphertext; local JSON API for metadata; optional off-chain image uploads |

**Contracts:** `FormFactory`, `EncryptedForm`

---

## How I built it

1. **Contracts** — `FormFactory` deploys `EncryptedForm` instances with schema hash, question kinds, reward settings, and encrypted answer storage. Responders call `submitFheQuestion` per item and `finalizeSubmission` to complete.

2. **Client encryption** — Next.js uses CoFHE in the browser before any answer hits the chain.

3. **App flows** — **Create** (builder + deploy), **Fill** (wallet + per-question FHE + finalize), **Dashboard** (creator-only decrypt).

4. **Auth & safety** — Creator-only API routes, resume logic for half-finished submissions, testnet-only deployment, preview messaging on-site.

5. **UX** — FormiX branding, “What is FormiX” page (diagrams, tables), animated blockchain/privacy background.

| Step | Function | Actor |
|------|----------|--------|
| 1 | `createForm` | Creator via FormFactory |
| 2 | `submitFheQuestion` | Respondent — ciphertext per question |
| 3 | `finalizeSubmission` | Respondent — seals response |
| 4 | Decrypt (UI + CoFHE) | Creator — dashboard only |

---

## What I learned

- **FHE changes the form lifecycle** — UX must follow encrypt → submit → finalize → decrypt, not one “submit” click.
- **On-chain privacy ≠ invisible** — Transactions are public; privacy comes from **encryption**.
- **Redeploys are painful** — Factory address updates and capability checks must survive real testers.
- **FHE is powerful but constrained** — Question count, gas, and SDK ergonomics are product limits on testnet.
- **Demo quality** — Failure modes (stuck finalize, wrong network, wrong wallet) matter as much as the happy path.

---

## What's next for FormiX

- Security review, audited contracts, production CoFHE networks when available.
- Larger forms, smarter batching, clearer multi-tx progress UI.
- Richer homomorphic analytics and exports without leaking individual answers.
- IPFS or on-chain schema to reduce reliance on a single API server.
- Mobile-friendly wallet flows for respondents.
- Hosted public testnet demo and expanded open-source docs.

---

## Quick start (for judges)

```bash
cd contracts && npm install && npm run compile && npm run deploy:base-sepolia
cd frontend && npm install && npm run dev
```

Set `NEXT_PUBLIC_FORM_FACTORY_ADDRESS` in `frontend/.env`. Open http://localhost:3000 on **Base Sepolia** with a funded testnet wallet.
