/** Default widget URL hosted on CloudFront */
export const DEFAULT_WIDGET_URL = "https://d1p4mbm3uswucw.cloudfront.net";

/** Default timeout for login (ms) */
export const DEFAULT_LOGIN_TIMEOUT = 300_000; // 5 minutes

/** Default timeout for signing operations (ms) */
export const DEFAULT_SIGN_TIMEOUT = 120_000; // 2 minutes

/** Delay before posting to iframe after making it visible (ms) */
export const IFRAME_READY_DELAY = 300;

/** Widget iframe element ID */
export const IFRAME_ID = "oxgas-auth-iframe";

/** z-index for the widget overlay */
export const DEFAULT_Z_INDEX = 99999;

/** Package version */
export const VERSION = "1.1.1";

/**
 * Common EVM network names for display in the widget.
 * Keys are chain IDs, values are human-readable names.
 */
export const NETWORK_NAMES: Record<number, string> = {
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
    43113: "Avalanche Fuji",
    59144: "Linea",
    534352: "Scroll",
    11155111: "Sepolia",
    80001: "Mumbai",
    84531: "Base Goerli",
    421613: "Arbitrum Goerli",
};

/** 0xGasless smart account contracts on Avalanche Fuji (the SDK defaults are mainnet addresses). */
export const AVALANCHE_FUJI = {
    chainId: 43113,
    factory: "0xF0b3f5146c2725e36d78F5029bc560eDfc67ADe0",
    implementation: "0x8aF33bE7af021A6075aeB19b076fC75Bfbd2c5c3",
    fallbackHandler: "0xdA62055b0730d1d0621aD0A446DcD6057a6d951E",
    ecdsaModule: "0xcfb0BA514aa398085D63eC70cfEa6EC7f1094E8F",
} as const;
