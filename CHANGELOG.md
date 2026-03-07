# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
