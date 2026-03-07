// Core
export { OxGasAuth } from "./OxGasAuth";

// Types
export type {
    OxGasAuthConfig,
    OxGasAuthEvents,
    AuthState,
    WalletInfo,
    SignTxParams,
    SignTxResult,
    SignMessageResult,
} from "./types";

// Errors
export {
    OxGasError,
    NotConnectedError,
    SigningRejectedError,
    SigningTimeoutError,
    WidgetError,
} from "./errors";

// Utilities
export { NETWORK_NAMES, VERSION } from "./constants";

// Smart Account (One-Stop Client)
export { OxGasClient } from "./OxGasClient";
export { PaymasterMode } from "@0xgasless/smart-account";
export type {
    OxGasClientConfig,
    TransactionParams,
    TokenTransferParams
} from "./OxGasClient";
