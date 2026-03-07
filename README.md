# 0xgas-auth

> Secure embedded wallet SDK for EVM chains — AWS KMS-backed signing via iframe widget.

[![npm version](https://img.shields.io/npm/v/0xgas-auth)](https://www.npmjs.com/package/0xgas-auth)
[![license](https://img.shields.io/npm/l/0xgas-auth)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)

`0xgas-auth` provides non-custodial, KMS-backed wallets through a secure iframe. Private keys and access tokens **never leave the iframe** — your application only receives addresses, emails, and signatures.

---

## Installation

```bash
npm install 0xgas-auth
# or
yarn add 0xgas-auth
# or
pnpm add 0xgas-auth
```

## Quick Start

```ts
import { OxGasAuth } from '0xgas-auth';

const auth = new OxGasAuth({
  apiKey: 'your-api-key',
  chainId: 11155111, // Sepolia — auto-resolves to "Sepolia" in the widget
  debug: true,       // Enable console logging during development
});

// Listen for events
auth.on('connected', (wallet) => {
  console.log('Connected:', wallet.address, wallet.email);
});

// Authenticate
const wallet = await auth.login();
console.log('EOA Address:', wallet.address);

// Sign a message hash (e.g. ERC-4337 UserOp hash)
const { signature } = await auth.signMessage('0xdeadbeef...');

// Sign a transaction
const result = await auth.signTransaction({
  to: '0x...',
  value: '0',
  data: '0x...',
  chainId: 11155111,
});
```

## Configuration

| Option | Type | Default | Description |
|---|---|---|---|
| `apiKey` | `string` | **(required)** | Your 0xgas API key |
| `widgetUrl` | `string` | `https://d1p4m...cloudfront.net` | Override widget URL (self-hosted / local dev) |
| `network` | `string` | `"Ethereum"` | Network name shown in approval screen |
| `chainId` | `number` | — | Auto-resolves network name (40+ chains built-in) |
| `zIndex` | `number` | `99999` | z-index of the widget overlay |
| `loginTimeout` | `number` | `300000` (5 min) | Login timeout in ms |
| `signTimeout` | `number` | `120000` (2 min) | Signing timeout in ms |
| `debug` | `boolean` | `false` | Enable verbose console logging |

You can also use the shorthand string constructor:

```ts
const auth = new OxGasAuth('your-api-key');
```

## API Reference

### `login(): Promise<WalletInfo>`

Opens the widget for email/password authentication. Returns wallet info with the KMS EOA address and email. Resolves immediately if already logged in.

### `signMessage(message, network?): Promise<SignMessageResult>`

Signs a message hash via the KMS widget. Accepts hex strings or `Uint8Array`. Used for ERC-4337 UserOperation signing.

### `signTransaction(txParams): Promise<SignTxResult>`

Signs a raw transaction via the KMS widget. Opens the "Approve Transaction" screen.

### `getAddress(): \`0x${string}\``

Returns the EOA address. Throws `NotConnectedError` if not logged in.

### `getWalletInfo(): WalletInfo | null`

Returns full wallet info or `null`.

### `isConnected(): boolean`

Returns whether the user is currently authenticated.

### `getAuthState(): AuthState`

Returns `"disconnected"`, `"connecting"`, or `"connected"`.

### `logout(): Promise<void>`

Clears the session and removes the iframe.

### `destroy(): void`

Full teardown — clears state, removes iframe, removes all event listeners. Call this when unmounting.

## Events

```ts
auth.on('connected',         (wallet) => { /* WalletInfo */ });
auth.on('disconnected',      ()       => { /* logged out */ });
auth.on('signatureComplete', (data)   => { /* { type, result } */ });
auth.on('error',             (err)    => { /* any error */ });
auth.on('stateChange',       (state)  => { /* AuthState */ });

// One-shot listener
auth.once('connected', (wallet) => { ... });

// Unsubscribe
const unsub = auth.on('error', handler);
unsub();
```

## Error Handling

All errors extend `OxGasError` and include a programmatic `code`:

```ts
import {
  OxGasError,
  NotConnectedError,
  SigningRejectedError,
  SigningTimeoutError,
  WidgetError,
} from '0xgas-auth';

try {
  await auth.signMessage(hash);
} catch (err) {
  if (err instanceof SigningRejectedError) {
    console.log('User rejected');          // err.code === 'SIGNING_REJECTED'
  } else if (err instanceof SigningTimeoutError) {
    console.log('Timed out:', err.timeoutMs); // err.code === 'TIMEOUT'
  } else if (err instanceof NotConnectedError) {
    console.log('Not logged in');          // err.code === 'NOT_CONNECTED'
  }
}
```

## ERC-4337 Smart Account Integration

`0xgas-auth` is designed to work with [`@0xgasless/smart-account`](https://www.npmjs.com/package/@0xgasless/smart-account) for gasless transactions:

```ts
import { OxGasAuth } from '0xgas-auth';
import { createSmartAccountClient, PaymasterMode } from '@0xgasless/smart-account';

const auth = new OxGasAuth({
  apiKey: 'your-key',
  chainId: 11155111,
});

const wallet = await auth.login();

const smartAccount = await createSmartAccountClient({
  signer: auth,
  paymasterUrl: 'https://paymaster.0xgasless.com/v1/11155111/rpc/your-api-key',
  bundlerUrl: 'https://bundler.0xgasless.com/11155111',
  chainId: 11155111,
});

const { hash } = await smartAccount.sendTransaction(tx, {
  paymasterServiceData: { mode: PaymasterMode.SPONSORED },
});
```

## Supported Networks

The SDK includes a built-in registry of 40+ EVM networks. Pass `chainId` and the widget automatically displays the correct network name:

```
Ethereum (1), Optimism (10), BNB Chain (56), Polygon (137),
Base (8453), Arbitrum (42161), Avalanche (43114), Fantom (250),
Sepolia (11155111), Linea (59144), Scroll (534352), ...
```

Add custom networks via the `network` option:

```ts
const auth = new OxGasAuth({ apiKey: 'key', network: 'My L2' });
```

## TypeScript

Full TypeScript support with exported types:

```ts
import type {
  OxGasAuthConfig,
  WalletInfo,
  SignMessageResult,
  SignTxResult,
  AuthState,
} from '0xgas-auth';
```

## License

[MIT](./LICENSE)
