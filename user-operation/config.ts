import dotenv from "dotenv";
dotenv.config();

export const rpcUrl = process.env.RPC_URL || "";
export const entryPoint = process.env.ENTRY_POINT || "";
export const sender = process.env.SENDER || "";
export const nonce = 1;
export const signature = process.env.SIGNATURE || "";
export const toAddress = "0xF897f6250Ea36e3D9b87Bc9728d6e6Bf3136B079";
export const bundlerHost = process.env.BUNDLER_HOST || "";
export const signerPrivateKey = (process.env.SIGNER_PRIVATE_KEYS ||
  "") as `0x${string}`;
export const chainId = Number(process.env.CHAIN_ID) || "5";
export const pimlicoAPIKey = process.env.PIMLICO_API_KEY || "";

// urls
export const bundlerRpcUrl = `${bundlerHost}/rpc`;

export const nftData = {
  contractAddress: "0x4Ba9E93337235a5A3E85aBb77a7Ef2898cfF0608",
  tokenId: 615,
};
