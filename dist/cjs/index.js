"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymasterMode = exports.OxGasClient = exports.VERSION = exports.NETWORK_NAMES = exports.WidgetError = exports.SigningTimeoutError = exports.SigningRejectedError = exports.NotConnectedError = exports.OxGasError = exports.OxGasAuth = void 0;
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
//# sourceMappingURL=index.js.map