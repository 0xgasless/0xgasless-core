# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] - 2026-08-08

### Fixed
- **Package was uninstallable in Node** (both ESM and CJS): relative imports lacked
  `.js` extensions (rejected by Node's ESM loader) and `dist/cjs` had no
  `{"type":"commonjs"}` marker, so its CommonJS files were parsed as ESM under the
  root `"type": "module"`. Bundlers masked both; every server/bot consumer failed
  at import.
- Imports referenced `@0xgasless/smart-account` while `package.json` declared
  `@0xgasless/smart-account-sdk` — now consistently `@0xgasless/smart-account-sdk`
  (`^0.0.15`, which also breaks the former circular dependency).
- `VERSION` constant stuck at 1.0.0 — now tracks the package version.

## [1.1.0] - 2026-04-27

### Added
- `OxGasServerWallet` — server/bot wallet SDK (create/list wallets, instant KMS
  transaction signing, typed policy errors). (Retroactive entry.)

## [1.0.0] - 2024-03-04

### Added
- Config object constructor with full customization (`apiKey`, `widgetUrl`, `network`, `chainId`, `debug`, timeouts)
- Typed EventEmitter (`connected`, `disconnected`, `signatureComplete`, `error`, `stateChange`)
- Custom error classes: `OxGasError`, `NotConnectedError`, `SigningRejectedError`, `SigningTimeoutError`, `WidgetError`
- Debug mode — conditional logging via `debug: true` config
- Configurable timeouts for login (5 min) and signing (2 min)
- EVM network name registry (40+ chains)
- `destroy()` method for full teardown
- `isConnected()` and `getAuthState()` helpers
- Dual ESM/CJS builds
- Full JSDoc on every public method
- README with API reference and integration guide
