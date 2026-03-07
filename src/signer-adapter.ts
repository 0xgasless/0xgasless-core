import type { Hex, SignableMessage, TypedData, TypedDataDefinition } from "viem";
import { hashTypedData, hashMessage } from "viem";
import type { OxGasAuth } from "./OxGasAuth";

/**
 * Adapter that wraps OxGasAuth into a SmartAccountSigner interface.
 * Handles EIP-191 prefix hashing before sending to KMS.
 *
 * @internal Used by OxGasClient to wire auth into the smart account.
 */
export class OxGasAuthSigner {
    signerType: string;
    inner: OxGasAuth;

    constructor(client: OxGasAuth) {
        this.inner = client;
        this.signerType = "oxgas-auth";
    }

    getAddress = async (): Promise<`0x${string}`> => {
        return Promise.resolve(this.inner.getAddress());
    };

    readonly signMessage = async (message: SignableMessage): Promise<`0x${string}`> => {
        // Smart contract's validateUserOp uses:
        //   ECDSA.recover(userOpHash.toEthSignedMessageHash(), signature)
        //
        // KMS signs the raw hash directly, so we apply the
        // EIP-191 prefix BEFORE sending to KMS.

        let prefixedHash: string;
        if (typeof message === "string") {
            prefixedHash = hashMessage(message);
        } else if (message.raw instanceof Uint8Array) {
            prefixedHash = hashMessage({ raw: message.raw });
        } else if (typeof message.raw === "string") {
            prefixedHash = hashMessage({ raw: message.raw as Hex });
        } else {
            throw new Error("Invalid message format");
        }

        const result = await this.inner.signMessage(prefixedHash);
        return result.signature;
    };

    readonly signTypedData = async <
        const TTypedData extends TypedData | { [key: string]: unknown },
        TPrimaryType extends string = string
    >(
        typedData: TypedDataDefinition<TTypedData, TPrimaryType>
    ): Promise<Hex> => {
        const typedHash = hashTypedData(typedData);
        const result = await this.inner.signMessage(typedHash);
        return result.signature;
    };
}
