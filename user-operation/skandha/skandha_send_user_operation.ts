import { formatEther, parseUnits, toBytes, toHex } from "viem";
import { UserOperationStruct } from "@account-abstraction/contracts";
import axios from "axios";

import { entryPointContract, viemPublicClient, walletClient } from "../clients";
import { genCallDataTransferEth } from "../gen_callData";
import {
  BUNDLER_METHODS,
  bundlerRpcUrl,
  entryPoint,
  sender,
  toAddress,
} from "./config";

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
  console.log({ userOperationForEstimation: userOperation });

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
    console.log({ gasPrices: data.result });
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
      await entryPointContract.getNonce(sender, 0),
    ]);

    console.log({ nonce, gasPrice });

    const userOperation: any = {
      sender,
      nonce: nonce.toBigInt().toString(),
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

    console.log({ estimatedGasCostWei, eth: formatEther(estimatedGasCostWei) });

    // then get the user operation hash
    const userOperationHash = await entryPointContract.getUserOpHash(
      userOperation
    );

    console.log({ userOperationHash });

    const address = await walletClient.getAddresses();

    const signature = await walletClient.signMessage({
      account: address[0],
      message: { raw: toBytes(userOperationHash) },
    });

    console.log({ signature });

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
