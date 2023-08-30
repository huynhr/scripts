import dotenv from "dotenv";
dotenv.config();

export const rpcUrl = process.env.ALTO_RPC_URL || "";
export const entryPoint = process.env.ALTO_ENTRY_POINT || "";
export const sender = "0x4EbAD030B02fbb255c293275e9095a07f34B9e3D";
export const nonce = 1;
export const signature = process.env.ALTO_SIGNATURE || "";
export const toAddress = "0xF897f6250Ea36e3D9b87Bc9728d6e6Bf3136B079";
