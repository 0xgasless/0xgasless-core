// Core
export { OxGasAuth } from "./OxGasAuth.js";

// Types
export type {
    OxGasAuthConfig,
    OxGasAuthEvents,
    AuthState,
    WalletInfo,
    SignTxParams,
    SignTxResult,
    SignMessageResult,
} from "./types.js";

// Errors
export {
    OxGasError,
    NotConnectedError,
    SigningRejectedError,
    SigningTimeoutError,
    WidgetError,
} from "./errors.js";

// Utilities
export { NETWORK_NAMES, VERSION } from "./constants.js";

// Smart Account (One-Stop Client)
export { OxGasClient } from "./OxGasClient.js";
export { PaymasterMode } from "@0xgasless/smart-account-sdk";
export type {
    OxGasClientConfig,
    TransactionParams,
    TokenTransferParams
} from "./OxGasClient.js";

// Server Wallet (Backend / Bot SDK)
export { OxGasServerWallet } from "./OxGasServerWallet.js";
export {
    WalletNotFoundError,
    PolicyViolationError,
    ServerSigningError,
    NetworkError,
} from "./server-wallet-errors.js";
export type {
    ServerWalletOptions,
    ServerWalletInfo,
    CreateWalletOptions,
    SignTransactionParams,
    SignTransactionResult,
    ListWalletsResponse,
    BroadcastResult,
} from "./server-wallet-types.js";
