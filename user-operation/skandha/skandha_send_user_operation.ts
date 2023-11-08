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

import {
  genCallDataTransferEth,
  genCallDataTransferEthV3,
  genCallDataTransferNFT,
} from "../gen_callData";

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
        choices: ["goerli", "mainnet", "optimism", "polygon"], // Restrict to these choices
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

const { bundlerRpcUrl, entryPoint, sender, toAddress, nftData } = networkConfig;

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
    const gasPricesInEth = {
      preVerificationGas: formatEther(BigInt(data.result.preVerificationGas)),
      verificationGasLimit: formatEther(
        BigInt(data.result.verificationGasLimit)
      ),
      callGasLimit: formatEther(BigInt(data.result.callGasLimit)),
    };
    console.log({ gasPricesInEth });
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

async function getUserOperationByHash(
  txHash: `0x${string}`,
  id: number
): Promise<`0x${string}` | null> {
  const { data } = await axios.post(bundlerRpcUrl, {
    id,
    jsonrpc: "2.0",
    method: BUNDLER_METHODS.getUserOperationHash,
    params: [txHash],
  });

  if (data.error) {
    throw new Error(
      `Failed to get userOperation by hash id: ${id}, message: ${data.error.message} `
    );
  }

  if (data.result === undefined) {
    throw new Error(`Failed to get userOperation by hash id: ${id}`);
  }

  if (data.result === null) {
    return null;
  }

  return data.result.transactionHash as `0x${string}`;
}

async function main() {
  try {
    const amount = 0.00001;
    const wei = parseUnits(amount.toString(), 18);

    console.log(`Wei to send: ${wei.toString()}`);

    const [callData, gasPrice, nonce] = await Promise.all([
      genCallDataTransferEthV3(toAddress, amount),
      // genCallDataTransferEth(toAddress, amount),
      // genCallDataTransferNFT(
      //   sender,
      //   toAddress,
      //   nftData.contractAddress,
      //   nftData.tokenId,
      //   "ERC721"
      // ),
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

    console.log({ nonce });

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

    let txReceipt = null;
    let tries = 0;

    // Get tx hash from bundler
    while (txReceipt === null) {
      console.log("tries: ", tries);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const userOperationReceipt = await getUserOperationByHash(
        response.result,
        1
      );

      if (userOperationReceipt === null) {
        tries += 1;
      }

      if (tries > 10) {
        throw new Error(
          `Failed to get userOperation receipt; tried 10, tx id: ${1}`
        );
      }

      txReceipt = userOperationReceipt;
    }

    if (txReceipt === null) {
      throw new Error(`Failed to get userOperation receipt, tx id: ${1}`);
    }

    console.log({ txReceipt });
  } catch (err) {
    console.log(err);
  } finally {
    console.log("finished...");
  }
}

main();
