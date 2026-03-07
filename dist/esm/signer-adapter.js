import { hashTypedData, hashMessage } from "viem";
/**
 * Adapter that wraps OxGasAuth into a SmartAccountSigner interface.
 * Handles EIP-191 prefix hashing before sending to KMS.
 *
 * @internal Used by OxGasClient to wire auth into the smart account.
 */
export class OxGasAuthSigner {
    signerType;
    inner;
    constructor(client) {
        this.inner = client;
        this.signerType = "oxgas-auth";
    }
    getAddress = async () => {
        return Promise.resolve(this.inner.getAddress());
    };
    signMessage = async (message) => {
        // Smart contract's validateUserOp uses:
        //   ECDSA.recover(userOpHash.toEthSignedMessageHash(), signature)
        //
        // KMS signs the raw hash directly, so we apply the
        // EIP-191 prefix BEFORE sending to KMS.
        let prefixedHash;
        if (typeof message === "string") {
            prefixedHash = hashMessage(message);
        }
        else if (message.raw instanceof Uint8Array) {
            prefixedHash = hashMessage({ raw: message.raw });
        }
        else if (typeof message.raw === "string") {
            prefixedHash = hashMessage({ raw: message.raw });
        }
        else {
            throw new Error("Invalid message format");
        }
        const result = await this.inner.signMessage(prefixedHash);
        return result.signature;
    };
    signTypedData = async (typedData) => {
        const typedHash = hashTypedData(typedData);
        const result = await this.inner.signMessage(typedHash);
        return result.signature;
    };
}
//# sourceMappingURL=signer-adapter.js.map