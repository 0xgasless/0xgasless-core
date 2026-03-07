import type { Hex, SignableMessage, TypedData, TypedDataDefinition } from "viem";
import type { OxGasAuth } from "./OxGasAuth";
/**
 * Adapter that wraps OxGasAuth into a SmartAccountSigner interface.
 * Handles EIP-191 prefix hashing before sending to KMS.
 *
 * @internal Used by OxGasClient to wire auth into the smart account.
 */
export declare class OxGasAuthSigner {
    signerType: string;
    inner: OxGasAuth;
    constructor(client: OxGasAuth);
    getAddress: () => Promise<`0x${string}`>;
    readonly signMessage: (message: SignableMessage) => Promise<`0x${string}`>;
    readonly signTypedData: <const TTypedData extends TypedData | {
        [key: string]: unknown;
    }, TPrimaryType extends string = string>(typedData: TypedDataDefinition<TTypedData, TPrimaryType>) => Promise<Hex>;
}
//# sourceMappingURL=signer-adapter.d.ts.map