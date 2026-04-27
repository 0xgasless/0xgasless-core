"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkError = exports.ServerSigningError = exports.PolicyViolationError = exports.WalletNotFoundError = exports.OxGasServerWallet = exports.PaymasterMode = exports.OxGasClient = exports.VERSION = exports.NETWORK_NAMES = exports.WidgetError = exports.SigningTimeoutError = exports.SigningRejectedError = exports.NotConnectedError = exports.OxGasError = exports.OxGasAuth = void 0;
// Core
var OxGasAuth_1 = require("./OxGasAuth");
Object.defineProperty(exports, "OxGasAuth", { enumerable: true, get: function () { return OxGasAuth_1.OxGasAuth; } });
// Errors
var errors_1 = require("./errors");
Object.defineProperty(exports, "OxGasError", { enumerable: true, get: function () { return errors_1.OxGasError; } });
Object.defineProperty(exports, "NotConnectedError", { enumerable: true, get: function () { return errors_1.NotConnectedError; } });
Object.defineProperty(exports, "SigningRejectedError", { enumerable: true, get: function () { return errors_1.SigningRejectedError; } });
Object.defineProperty(exports, "SigningTimeoutError", { enumerable: true, get: function () { return errors_1.SigningTimeoutError; } });
Object.defineProperty(exports, "WidgetError", { enumerable: true, get: function () { return errors_1.WidgetError; } });
// Utilities
var constants_1 = require("./constants");
Object.defineProperty(exports, "NETWORK_NAMES", { enumerable: true, get: function () { return constants_1.NETWORK_NAMES; } });
Object.defineProperty(exports, "VERSION", { enumerable: true, get: function () { return constants_1.VERSION; } });
// Smart Account (One-Stop Client)
var OxGasClient_1 = require("./OxGasClient");
Object.defineProperty(exports, "OxGasClient", { enumerable: true, get: function () { return OxGasClient_1.OxGasClient; } });
var smart_account_1 = require("@0xgasless/smart-account");
Object.defineProperty(exports, "PaymasterMode", { enumerable: true, get: function () { return smart_account_1.PaymasterMode; } });
// Server Wallet (Backend / Bot SDK)
var OxGasServerWallet_1 = require("./OxGasServerWallet");
Object.defineProperty(exports, "OxGasServerWallet", { enumerable: true, get: function () { return OxGasServerWallet_1.OxGasServerWallet; } });
var server_wallet_errors_1 = require("./server-wallet-errors");
Object.defineProperty(exports, "WalletNotFoundError", { enumerable: true, get: function () { return server_wallet_errors_1.WalletNotFoundError; } });
Object.defineProperty(exports, "PolicyViolationError", { enumerable: true, get: function () { return server_wallet_errors_1.PolicyViolationError; } });
Object.defineProperty(exports, "ServerSigningError", { enumerable: true, get: function () { return server_wallet_errors_1.ServerSigningError; } });
Object.defineProperty(exports, "NetworkError", { enumerable: true, get: function () { return server_wallet_errors_1.NetworkError; } });
//# sourceMappingURL=index.js.map