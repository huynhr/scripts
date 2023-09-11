import dotenv from "dotenv";
dotenv.config();

export const rpcUrl = process.env.RPC_URL || "";
export const entryPoint = process.env.ENTRY_POINT || "";
export const sender = "0x446CF1fF4580523A7661b5a4208d522B4D799dE2";
export const nonce = 1;
export const signature = process.env.SIGNATURE || "";
export const toAddress = "0xF897f6250Ea36e3D9b87Bc9728d6e6Bf3136B079";
export const bundlerHost = "http://0.0.0.0:14337";
export const signerPrivateKey = (process.env.SIGNER_PRIVATE_KEYS ||
  "") as `0x${string}`;

// urls
export const bundlerRpcUrl = `${bundlerHost}/5`;

export const BUNDLER_METHODS = {
  estimateGas: "skandha_getGasPrice",
  estimateUserOperationGas: "eth_estimateUserOperationGas",
  sendUserOperation: "eth_sendUserOperation",
  getUserOperationHash: "eth_getUserOperationByHash",
};
