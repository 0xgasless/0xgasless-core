"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NETWORK_NAMES = exports.VERSION = exports.DEFAULT_Z_INDEX = exports.IFRAME_ID = exports.IFRAME_READY_DELAY = exports.DEFAULT_SIGN_TIMEOUT = exports.DEFAULT_LOGIN_TIMEOUT = exports.DEFAULT_WIDGET_URL = void 0;
/** Default widget URL hosted on CloudFront */
exports.DEFAULT_WIDGET_URL = "https://d1p4mbm3uswucw.cloudfront.net";
/** Default timeout for login (ms) */
exports.DEFAULT_LOGIN_TIMEOUT = 300_000; // 5 minutes
/** Default timeout for signing operations (ms) */
exports.DEFAULT_SIGN_TIMEOUT = 120_000; // 2 minutes
/** Delay before posting to iframe after making it visible (ms) */
exports.IFRAME_READY_DELAY = 300;
/** Widget iframe element ID */
exports.IFRAME_ID = "oxgas-auth-iframe";
/** z-index for the widget overlay */
exports.DEFAULT_Z_INDEX = 99999;
/** Package version */
exports.VERSION = "1.0.0";
/**
 * Common EVM network names for display in the widget.
 * Keys are chain IDs, values are human-readable names.
 */
exports.NETWORK_NAMES = {
    1: "Ethereum",
    5: "Goerli",
    10: "Optimism",
    56: "BNB Chain",
    100: "Gnosis",
    137: "Polygon",
    250: "Fantom",
    324: "zkSync Era",
    1088: "Metis",
    1284: "Moonbeam",
    8453: "Base",
    42161: "Arbitrum One",
    42170: "Arbitrum Nova",
    43114: "Avalanche",
    59144: "Linea",
    534352: "Scroll",
    11155111: "Sepolia",
    80001: "Mumbai",
    84531: "Base Goerli",
    421613: "Arbitrum Goerli",
};
//# sourceMappingURL=constants.js.map