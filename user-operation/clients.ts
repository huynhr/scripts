import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { goerli } from "viem/chains";
import { signerPrivateKey } from "./config";

const account = privateKeyToAccount(signerPrivateKey);
const chain = goerli;

export const walletClient = createWalletClient({
  account,
  chain: chain,
  transport: http(),
});

export const viemPublicClient = createPublicClient({
  chain: chain,
  transport: http(),
});
