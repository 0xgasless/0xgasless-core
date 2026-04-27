# @0xgasless/core

> The all-in-one SDK for secure embedded wallets, ERC-4337 smart accounts, and server-side wallet management on EVM chains.

[![npm version](https://img.shields.io/npm/v/@0xgasless/core)](https://www.npmjs.com/package/@0xgasless/core)
[![license](https://img.shields.io/npm/l/@0xgasless/core)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)

`@0xgasless/core` provides two powerful wallet primitives in a single package:

| | **User Wallets** (`OxGasClient`) | **Server Wallets** (`OxGasServerWallet`) |
|---|---|---|
| **Environment** | Browser | Node.js / Server |
| **Auth** | Email OTP, Google, MetaMask via widget | API key only — no login required |
| **Signing** | User approves in secure iframe | Instant — no human approval |
| **Use case** | dApps, web3 frontends | Telegram bots, trading bots, cron jobs |
| **Key storage** | AWS KMS (iframe-secured) | AWS KMS (API-secured + policy engine) |

Private keys **never leave AWS KMS** in either mode.

---

## Installation

```bash
npm install @0xgasless/core
# or
yarn add @0xgasless/core
# or
pnpm add @0xgasless/core
```

---

# User Wallets (Browser)

Use `OxGasClient` for browser-based dApps where end users authenticate and approve transactions.

## Quick Start

```typescript
import { OxGasClient } from '@0xgasless/core';

const client = new OxGasClient({
  apiKey: 'your-api-key',
  chainId: 11155111,
  bundlerUrl: 'https://bundler.0xgasless.com/11155111',
  paymasterUrl: 'https://paymaster.0xgasless.com/v1/11155111/rpc/your-paymaster-key',
  debug: true,
});

// 1. Authenticate — opens the secure widget
const wallet = await client.login();
console.log('Logged in as:', wallet.email);

// 2. Initialize Smart Account
const smartAccountAddress = await client.setupSmartAccount();
console.log('Smart Account:', smartAccountAddress);

// 3. Send a Gasless Transaction
const { wait } = await client.sendTransaction({
  to: '0xTargetContract...',
  value: 0n,
  data: '0x...',
});
const receipt = await wait();
console.log('Confirmed:', receipt.receipt.transactionHash);
```

## OxGasClient Configuration

| Option | Type | Default | Description |
|---|---|---|---|
| `apiKey` | `string` | **(required)** | Your 0xGas API key |
| `chainId` | `number` | `1` | Target EVM chain ID |
| `bundlerUrl` | `string` | **(required)** | ERC-4337 bundler RPC URL |
| `paymasterUrl` | `string` | **(required)** | Paymaster RPC URL for gas sponsorship |
| `rpcUrl` | `string` | — | Optional custom RPC URL |
| `accountIndex` | `number` | `0` | Derive multiple smart accounts per user |
| `debug` | `boolean` | `false` | Enable verbose console logging |

## OxGasClient API

### `client.login()`
Opens the widget for email/password authentication. Returns `WalletInfo` with the KMS EOA address and email. Resolves immediately if already logged in.

### `client.setupSmartAccount()`
Derives the ERC-4337 smart account. Must be called after `login()`. Returns the deterministic smart account address.

### `client.sendTransaction(tx)`
Signs via KMS widget, sponsors gas via paymaster, submits to bundler. Returns `UserOpResponse` with `wait()` for confirmation.

### `client.sendBatchTransactions(txs)`
Execute multiple calls in a single UserOperation:

```typescript
await client.sendBatchTransactions([
  { to: '0xToken...', data: '0xApprove...' },
  { to: '0xProtocol...', data: '0xDeposit...' },
]);
```

### `client.transferToken(params)`
Gasless ERC-20 transfer with automatic decimal handling:

```typescript
await client.transferToken({
  tokenAddress: '0xUSDC...',
  to: '0xRecipient...',
  amount: '10.5', // Human-readable, parsed automatically
});
```

### `client.getTokenBalance(tokenAddress)`
Returns `{ balance, symbol, name, decimals, rawBalance }` for the smart account.

### Properties & Lifecycle

```typescript
client.isLoggedIn            // boolean
client.eoaAddress            // KMS signer address
client.smartAccountAddress   // Smart account address
client.chainId               // Active chain ID
client.rpcUrl                // Active RPC URL

await client.logout();       // Clear session & iframe
```

---

# Server Wallets (Node.js)

Use `OxGasServerWallet` for backend systems — Telegram bots, trading bots, cron jobs, AI agents — where wallets need to be managed programmatically without any user interaction.

## Quick Start

```typescript
import { OxGasServerWallet } from '@0xgasless/core';

const wallet = new OxGasServerWallet({
  apiKey: 'your_project_api_key',
  defaultChainId: 43113, // Avalanche Fuji
});

// Create or retrieve a wallet — safe to call every time
const address = await wallet.getAddress('telegram_123456789');
console.log('Wallet:', address);

// Sign a transaction
const result = await wallet.signTransaction('telegram_123456789', {
  to: '0x1111111111111111111111111111111111111111',
  value: '1000000000000000', // wei as string
  nonce: 0,
  chainId: 43113,
});

// Broadcast to the network
const { txHash } = await wallet.broadcastTransaction(
  result.rawTx,
  'https://api.avax-test.network/ext/bc/C/rpc'
);
console.log('Transaction:', txHash);
```

## OxGasServerWallet Configuration

| Option | Type | Default | Description |
|---|---|---|---|
| `apiKey` | `string` | **(required)** | Your 0xGas project API key |
| `baseUrl` | `string` | `https://pmwv2d8iwa...` | Override the API base URL |
| `defaultChainId` | `number` | `1` | Default chain ID when not specified per call |
| `timeout` | `number` | `30000` (30s) | HTTP request timeout in ms |

## OxGasServerWallet API

### `wallet.getOrCreateWallet(userId, options?)`

Creates a new wallet or returns the existing one. **Idempotent** — safe to call on every user interaction.

```typescript
const info = await wallet.getOrCreateWallet('telegram_123456789', {
  label: "John's trading wallet", // Optional, shown in dashboard
  chainId: 43113,                 // Optional, overrides defaultChainId
});
// info.address, info.userId, info.existing, info.projectId, ...
```

### `wallet.getAddress(userId, options?)`

Convenience method — calls `getOrCreateWallet` and returns just the address string.

```typescript
const address = await wallet.getAddress('telegram_123456789');
```

### `wallet.signTransaction(userId, txParams)`

Signs a transaction instantly via KMS — no human approval required.

```typescript
const result = await wallet.signTransaction('telegram_123456789', {
  to: '0x1111111111111111111111111111111111111111',
  value: '1000000000000000',   // wei as string
  nonce: 0,
  chainId: 43113,
  gas: 21000,                  // optional, default 21000
  gasPrice: '30000000000',     // optional, default 30 gwei
  data: '0x',                  // optional, for contract calls
});
// result.rawTx — signed, RLP-encoded, ready to broadcast
// result.txHash — pre-computed hash
// result.from — the server wallet address
```

### `wallet.broadcastTransaction(rawTx, rpcUrl)`

Broadcasts a signed transaction to any EVM-compatible RPC endpoint.

```typescript
const { txHash } = await wallet.broadcastTransaction(
  result.rawTx,
  'https://api.avax-test.network/ext/bc/C/rpc'
);
```

### `wallet.listWallets()`

List all server wallets in the project.

```typescript
const { wallets, totalWallets } = await wallet.listWallets();
```

## Telegram Bot Example

A complete example integrating `OxGasServerWallet` with a Telegram bot:

```typescript
import { OxGasServerWallet, PolicyViolationError } from '@0xgasless/core';

const wallet = new OxGasServerWallet({
  apiKey: 'your_project_api_key',
  defaultChainId: 43113,
});

// Handle /wallet command
bot.command('wallet', async (ctx) => {
  const userId = `telegram_${ctx.from.id}`;
  const address = await wallet.getAddress(userId);
  await ctx.reply(`Your wallet address:\n\`${address}\``, { parse_mode: 'Markdown' });
});

// Handle /send command
bot.command('send', async (ctx) => {
  const userId = `telegram_${ctx.from.id}`;
  const [toAddress, amountWei] = ctx.message.text.split(' ').slice(1);

  try {
    const result = await wallet.signTransaction(userId, {
      to: toAddress as `0x${string}`,
      value: amountWei,
      nonce: 0, // Fetch from chain in production
      chainId: 43113,
    });

    const { txHash } = await wallet.broadcastTransaction(
      result.rawTx,
      'https://api.avax-test.network/ext/bc/C/rpc'
    );

    await ctx.reply(`✅ Transaction sent!\nHash: ${txHash}`);
  } catch (err) {
    if (err instanceof PolicyViolationError) {
      await ctx.reply(`❌ Blocked by policy: ${err.reason}`);
    } else {
      await ctx.reply(`❌ Transaction failed: ${(err as Error).message}`);
    }
  }
});
```

---

## Error Handling

All errors extend `OxGasError` and include a programmatic `code` field:

```typescript
import {
  // User wallet errors
  NotConnectedError,     // code: 'NOT_CONNECTED'
  SigningRejectedError,  // code: 'SIGNING_REJECTED'
  SigningTimeoutError,   // code: 'TIMEOUT'
  WidgetError,           // code: 'WIDGET_ERROR'

  // Server wallet errors
  WalletNotFoundError,   // code: 'WALLET_NOT_FOUND'
  PolicyViolationError,  // code: 'POLICY_VIOLATION'  — includes .reason
  ServerSigningError,    // code: 'SERVER_SIGNING_ERROR'
  NetworkError,          // code: 'NETWORK_ERROR'     — includes .statusCode
} from '@0xgasless/core';
```

---

## Security & Architecture

1. **AWS KMS**: All private keys live inside HSM hardware. Keys never leave KMS in either user wallet or server wallet mode.
2. **Iframe Widget** (user wallets): Authentication and signing happen inside a sandboxed cross-origin iframe. The parent app never sees tokens or keys.
3. **Policy Engine** (server wallets): Transactions are validated against spending limits, allowed chains, and blocked addresses configured in the 0xgas dashboard before KMS signs.
4. **Signer Adapter**: Bridges the KMS-backed iframe with the ERC-4337 smart account infrastructure via an EIP-191 compatible interface.

## License

[MIT](./LICENSE)

