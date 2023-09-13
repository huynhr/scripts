import { formatEther, parseUnits, toBytes, toHex } from "viem";
import { UserOperationStruct } from "@account-abstraction/contracts";
import axios from "axios";

import { entryPointContract, viemPublicClient, walletClient } from "./clients";
import {
  bundlerRpcUrl,
  entryPoint,
  nftData,
  sender,
  toAddress,
} from "./config";
import { genCallDataTransferEth, genCallDataTransferNFT } from "./gen_callData";
import { BUNDLER_METHODS } from "./bundler-methods";

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
  try {
    console.log({ bundlerRpcUrl });
    const { data } = await axios({
      method: "POST",
      url: bundlerRpcUrl,
      timeout: 100000,
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        id: 2,
        jsonrpc: "2.0",
        method: BUNDLER_METHODS.estimateGas,
        params: [userOperation, entryPoint],
      },
    });

    if (data.error) {
      throw new Error(JSON.stringify(data.error));
    }

    if (data.result) {
      console.log({ gasPrices: data.result });
      console.log({
        preVerificationGas: BigInt(data.result.preVerificationGas),
        verificationGas: BigInt(data.result.verificationGas),
        verificationGasLimit: BigInt(data.result.verificationGasLimit),
        callGasLimit: BigInt(data.result.callGasLimit),
      });
      return data.result;
    }

    return {};
  } catch (err) {
    console.error(err);

    throw new Error(JSON.stringify(err));
  }
}

async function fetchGasPrice() {
  const { data } = await axios({
    method: "POST",
    url: bundlerRpcUrl,
    data: {
      id: 1,
      jsonrpc: "2.0",
      method: BUNDLER_METHODS.getGasPrice,
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
      // genCallDataTransferNFT(
      //   sender,
      //   toAddress,
      //   nftData.contractAddress,
      //   nftData.tokenId,
      //   "ERC721"
      // ),
      fetchGasPrice(),
      await entryPointContract.getNonce(sender, 0),
    ]);

    console.log({ nonce, gasPrice });

    const userOperation: any = {
      sender,
      nonce: toHex(nonce.toBigInt()),
      initCode: "0x",
      callData,
      maxFeePerGas: gasPrice.standard.maxFeePerGas,
      maxPriorityFeePerGas: gasPrice.standard.maxPriorityFeePerGas,
      paymasterAndData: "0x",
      signature: "0x",
    };

    const estimatedGasForOp = await fetchGasEstimation(userOperation);
    // prettier-ignore
    // userOperation.preVerificationGas = toHex(BigInt(Math.floor(Number(BigInt(estimatedGasForOp.preVerificationGas)) / 2)));
    userOperation.preVerificationGas = estimatedGasForOp.preVerificationGas;
    // prettier-ignore
    // userOperation.verificationGasLimit = toHex(BigInt(Math.floor(Number(BigInt(estimatedGasForOp.verificationGasLimit)) / 2)));
    userOperation.verificationGasLimit = estimatedGasForOp.verificationGasLimit;
    // prettier-ignore
    // userOperation.callGasLimit = toHex(BigInt(Math.floor(Number(BigInt(estimatedGasForOp.callGasLimit)) / 2)));
    userOperation.callGasLimit = estimatedGasForOp.callGasLimit;

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
