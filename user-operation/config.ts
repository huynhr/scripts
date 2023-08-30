import dotenv from "dotenv";
dotenv.config();

export const rpcUrl = process.env.RPC_URL || "";
export const entryPoint = process.env.ENTRY_POINT || "";
export const sender = "0x4EbAD030B02fbb255c293275e9095a07f34B9e3D";
export const nonce = 2;
export const signature = process.env.SIGNATURE || "";
export const toAddress = "0xF897f6250Ea36e3D9b87Bc9728d6e6Bf3136B079";
export const bundlerHost = process.env.BUNDLER_HOST || "";
export const signerPrivateKey = (process.env.SIGNER_PRIVATE_KEYS ||
  "") as `0x${string}`;
