import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { EntryPoint__factory } from "@account-abstraction/contracts";
import { StaticJsonRpcProvider } from "@ethersproject/providers";
import { goerli, mainnet } from "viem/chains";
import {
  signerPrivateKey,
  entryPoint,
  rpcUrl,
  chainId,
  pimlicoAPIKey,
} from "./config";

const account = privateKeyToAccount(signerPrivateKey);

export const alchemyProvider = new StaticJsonRpcProvider(rpcUrl);

const activeChain = chainId;

export const chainIdToChain: { [key: number]: any } = {
  1: mainnet,
  5: goerli,
};

export const walletClient = createWalletClient({
  account,
  chain: chainIdToChain[activeChain],
  transport: http(),
});

export const viemPublicClient = createPublicClient({
  chain: chainIdToChain[activeChain],
  transport: http(),
});

export const entryPointContract = EntryPoint__factory.connect(
  entryPoint,
  alchemyProvider
);

export const chainIdToChainName: { [key: number]: any } = {
  1: "ethereum",
  5: "goerli",
};

const pimlicoEndpoint = `https://api.pimlico.io/v1/${chainIdToChainName[activeChain]}/rpc?apikey=${pimlicoAPIKey}`;

export const pimlicoProvider = new StaticJsonRpcProvider(pimlicoEndpoint);
