import dotenv from "dotenv";
dotenv.config();

import { createPublicClient, http } from "viem";
import { mainnet, goerli } from "viem/chains";

// if chain is === 1 then set it to mainnet else goerli from process.env
const chain = goerli;
// const chain = process.env.CHAIN === "1" ? mainnet : goerli;

console.log({ chain: chain.network });

export const client = createPublicClient({
  chain,
  transport: http(),
});
