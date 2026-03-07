"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OxGasAuthSigner = void 0;
const viem_1 = require("viem");
/**
 * Adapter that wraps OxGasAuth into a SmartAccountSigner interface.
 * Handles EIP-191 prefix hashing before sending to KMS.
 *
 * @internal Used by OxGasClient to wire auth into the smart account.
 */
class OxGasAuthSigner {
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
            prefixedHash = (0, viem_1.hashMessage)(message);
        }
        else if (message.raw instanceof Uint8Array) {
            prefixedHash = (0, viem_1.hashMessage)({ raw: message.raw });
        }
        else if (typeof message.raw === "string") {
            prefixedHash = (0, viem_1.hashMessage)({ raw: message.raw });
        }
        else {
            throw new Error("Invalid message format");
        }
        const result = await this.inner.signMessage(prefixedHash);
        return result.signature;
    };
    signTypedData = async (typedData) => {
        const typedHash = (0, viem_1.hashTypedData)(typedData);
        const result = await this.inner.signMessage(typedHash);
        return result.signature;
    };
}
exports.OxGasAuthSigner = OxGasAuthSigner;
//# sourceMappingURL=signer-adapter.js.map