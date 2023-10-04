import {
  createPublicClient,
  createWalletClient,
  formatEther,
  http,
  parseUnits,
  toBytes,
  toHex,
} from "viem";
import { UserOperationStruct } from "@account-abstraction/contracts";
import axios from "axios";
import { goerli, mainnet } from "viem/chains";

import { genCallDataTransferEth } from "../gen_callData";

import { config } from "./config";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { BUNDLER_METHODS } from "./methods";
import { privateKeyToAccount } from "viem/accounts";
import { entryPointABI } from "../../abi";

// Set up yargs
const argv = yargs(hideBin(process.argv))
  .demandCommand(1, "You need to specify a network!")
  .command(
    "$0 <network>",
    "Get the configuration for the specified network",
    (yargs) => {
      yargs.positional("network", {
        describe: "Network to retrieve the config for",
        type: "string",
        choices: ["goerli", "mainnet"], // Restrict to these choices
      });
    }
  )
  .help().argv;

// @ts-ignore
const network = argv.network as string;
console.log("Using network: ", network);

// Get the configuration for the desired network
// @ts-ignore
const networkConfig = config[network];

// const alchemyProvider = new StaticJsonRpcProvider(networkConfig.rpcUrl);

const account = privateKeyToAccount(networkConfig.signerPrivateKey);

export const chainIdToChain: { [key: number]: any } = {
  1: mainnet,
  5: goerli,
};

const viemPublicClient = createPublicClient({
  transport: http(networkConfig.rpcUrl),
});

const walletClient = createWalletClient({
  account,
  transport: http(networkConfig.rpcUrl),
});

const { bundlerRpcUrl, entryPoint, sender, toAddress } = networkConfig;

console.log({ bundlerRpcUrl, entryPoint, sender, toAddress });

async function sendUserOperation(userOperation: UserOperationStruct) {
  const { data } = await axios({
    method: "POST",
    url: bundlerRpcUrl,
    data: {
      id: 1,
      jsonrpc: "2.0",
      method: BUNDLER_METHODS.sendUserOperation,
      params: [userOperation, entryPoint],
    },
  });

  return data;
}

async function fetchGasEstimation(userOperation: any) {
  console.log(
    `User Operation for Gas Estimation: ${JSON.stringify(userOperation)}`
  );

  const { data } = await axios({
    method: "POST",
    url: bundlerRpcUrl,
    data: {
      id: 1,
      jsonrpc: "2.0",
      method: BUNDLER_METHODS.estimateUserOperationGas,
      params: [userOperation, entryPoint],
    },
  });

  if (data.error) {
    throw new Error(JSON.stringify(data.error));
  }

  if (data.result) {
    console.log(`gas prices: ${JSON.stringify(data.result)}`);
    return data.result;
  }

  return {};
}

async function fetchGasPrice() {
  const { data } = await axios({
    method: "POST",
    url: bundlerRpcUrl,
    data: {
      id: 1,
      jsonrpc: "2.0",
      method: BUNDLER_METHODS.estimateGas,
      params: [],
    },
  });

  return data.result;
}

interface CalculateTotalGasCost {
  preVerificationGasLimit: bigint;
  verificationGasLimit: bigint;
  callGasLimit: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
}

function calculateTotalGasCost({
  preVerificationGasLimit,
  verificationGasLimit,
  callGasLimit,
  maxFeePerGas,
  maxPriorityFeePerGas,
}: CalculateTotalGasCost) {
  // total gasUsage = preVerificationGasLimit + verificationGasLimit + callGasLimit
  // total gasFee = min(maxFeesPerGas, maxPriorityFeePerGas + gasPrice)
  // total gas cost in wei = gasCost * gasFee

  const totalGasUsage =
    preVerificationGasLimit + verificationGasLimit + callGasLimit;
  const bigIntMin = (...args: bigint[]) =>
    args.reduce((m, e) => (e < m ? e : m));
  const totalGasFee = bigIntMin(
    maxFeePerGas,
    maxPriorityFeePerGas + maxFeePerGas
  );

  return totalGasUsage * totalGasFee;
}

async function main() {
  try {
    const amount = 0.00001;
    const wei = parseUnits(amount.toString(), 18);

    console.log(`Wei to send: ${wei.toString()}`);

    const [callData, gasPrice, nonce] = await Promise.all([
      genCallDataTransferEth(toAddress, amount),
      fetchGasPrice(),
      viemPublicClient
        .simulateContract({
          address: networkConfig.entryPoint,
          abi: entryPointABI,
          functionName: "getNonce",
          args: [sender, 0],
          account,
        })
        .then((data) => data.result),
    ]);

    const userOperation: any = {
      sender,
      nonce: toHex(nonce as bigint),
      initCode: "0x",
      callData,
      maxFeePerGas: BigInt(gasPrice.maxFeePerGas).toString(),
      maxPriorityFeePerGas: BigInt(gasPrice.maxPriorityFeePerGas).toString(),
      preVerificationGas: "0",
      verificationGasLimit: "0",
      callGasLimit: "0",
      paymasterAndData: "0x",
      signature: "0x",
    };

    const estimatedGasForOp = await fetchGasEstimation(userOperation);

    userOperation.preVerificationGas = BigInt(
      estimatedGasForOp.preVerificationGas
    ).toString();
    userOperation.verificationGasLimit = BigInt(
      estimatedGasForOp.verificationGasLimit
    ).toString();
    userOperation.callGasLimit = BigInt(
      estimatedGasForOp.callGasLimit
    ).toString();

    const estimatedGasCostWei = calculateTotalGasCost({
      preVerificationGasLimit: BigInt(userOperation.preVerificationGas),
      verificationGasLimit: BigInt(userOperation.verificationGasLimit),
      callGasLimit: BigInt(userOperation.callGasLimit),
      maxFeePerGas: BigInt(userOperation.maxFeePerGas),
      maxPriorityFeePerGas: BigInt(userOperation.maxPriorityFeePerGas),
    });

    console.log(
      `Gas cost in Wei: ${estimatedGasCostWei},\n eth: ${formatEther(
        estimatedGasCostWei
      )} }`
    );

    // then get the user operation hash
    const userOperationHash = await viemPublicClient
      .simulateContract({
        address: entryPoint,
        abi: entryPointABI,
        functionName: "getUserOpHash",
        args: [userOperation],
        account,
      })
      .then((data) => data.result as string);

    console.log(`hash: ${userOperationHash}`);

    const address = await walletClient.getAddresses();

    const signature = await walletClient.signMessage({
      account: address[0],
      message: { raw: toBytes(userOperationHash) },
    });

    console.log(`signature: ${signature}`);

    userOperation.signature = signature;

    const response = await sendUserOperation(userOperation);

    console.log({ response });
  } catch (err) {
    console.log(err);
  } finally {
    console.log("finished...");
  }
}

main();
