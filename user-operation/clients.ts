import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { EntryPoint__factory } from "@account-abstraction/contracts";
import { StaticJsonRpcProvider } from "@ethersproject/providers";
import { goerli } from "viem/chains";
import { signerPrivateKey, entryPoint, rpcUrl } from "./config";

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

export const alchemyProvider = new StaticJsonRpcProvider(rpcUrl);

export const entryPointContract = EntryPoint__factory.connect(
  entryPoint,
  alchemyProvider
);
