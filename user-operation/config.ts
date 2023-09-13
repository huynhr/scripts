import dotenv from "dotenv";
dotenv.config();

export const rpcUrl = process.env.RPC_URL || "";
export const entryPoint = process.env.ENTRY_POINT || "";
export const sender = "0xECBc16D27d1CE53D1846618C23505FAa641C826f";
export const nonce = 1;
export const signature = process.env.SIGNATURE || "";
export const toAddress = "0xF897f6250Ea36e3D9b87Bc9728d6e6Bf3136B079";
export const bundlerHost = process.env.BUNDLER_HOST || "";
export const signerPrivateKey = (process.env.SIGNER_PRIVATE_KEYS ||
  "") as `0x${string}`;

// urls
export const bundlerRpcUrl = `${bundlerHost}/rpc`;

export const nftData = {
  contractAddress: "0xe7134A029Cd2Fd55f678D6809E64D0B6A0CaDDcB",
  tokenId: 340,
};
