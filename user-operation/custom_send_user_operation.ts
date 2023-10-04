import { formatEther, parseUnits, toBytes, toHex } from "viem";
import { UserOperationStruct } from "@account-abstraction/contracts";
import axios from "axios";

import {
  entryPointContract,
  pimlicoProvider,
  viemPublicClient,
  walletClient,
} from "./clients";
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
  const requestObj = {
    method: "POST",
    url: bundlerRpcUrl,
    data: {
      id: 1,
      jsonrpc: "2.0",
      method: BUNDLER_METHODS.sendUserOperation,
      params: [userOperation, entryPoint],
    },
  };

  console.log({ requestObj });
  const { data } = await axios(requestObj);

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
      console.log({ ERROR_ESTIMATING_GAS: JSON.stringify(data.error) });
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
    console.log({ axiosError: err });

    throw new Error(JSON.stringify(err));
  }
}

async function getPaymasterAndData(userOperation: any) {
  const url =
    "https://api.stackup.sh/v1/paymaster/bfcde50857cc5af93822d5f310ece91cf0791e05e023d574826c6a68b0f47138";

  /**
   * const userOperation: any = {
      sender,
      nonce: toHex(nonce.toBigInt()),
      initCode: "0x",
      callData,
      maxFeePerGas: gasPrice.standard.maxFeePerGas,
      maxPriorityFeePerGas: gasPrice.standard.maxPriorityFeePerGas,
      // paymasterAndData:
      //   "0x67f21be69a16c314a0b7da537309b2f3addde03100000000000000000000000000000000000000000000000000000101010101010000000000000000000000000000000000000000000000000000000000000000cd91f19f0f19ce862d7bec7b7d9b95457145afc6f639c28fd0360f488937bfa41e6eedcd3a46054fd95fcd0e3ef6b0bc0a615c4d975eef55c8a3517257904d5b1c",
      paymasterAndData: "0x",
      signature: "0x",
      callGasLimit: toHex(100_000), // hardcode it for now at a high value
      verificationGasLimit: toHex(400_000), // hardcode it for now at a high value
      preVerificationGas: toHex(50_000), // hardcode it for now at a high value
    };
   */
  const userOperationToSend = {
    sender: userOperation.sender,
    nonce: Number(BigInt(userOperation.nonce)),
    initCode: Array.from(toBytes(userOperation.initCode)),
    callData: Array.from(toBytes(userOperation.callData)),
    callGasLimit: Number(BigInt(userOperation.callGasLimit)),
    verificationGasLimit: Number(BigInt(userOperation.verificationGasLimit)),
    preVerificationGas: Number(BigInt(userOperation.preVerificationGas)),
    maxFeePerGas: Number(BigInt(userOperation.maxFeePerGas)),
    maxPriorityFeePerGas: Number(BigInt(userOperation.maxPriorityFeePerGas)),
    paymasterAndData: Array.from(toBytes(userOperation.paymasterAndData)),
    signature: userOperation.signature,
  };
  const { data } = await axios({
    method: "POST",
    url,
    data: {
      id: 1,
      jsonrpc: "2.0",
      method: BUNDLER_METHODS.getPaymasterAndData,
      params: [
        userOperationToSend,
        entryPoint,
        {
          type: "payg",
        },
      ],
    },
  });

  return data?.result;
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
      // callGasLimit: toHex(100_000), // hardcode it for now at a high value
      // verificationGasLimit: toHex(400_000), // hardcode it for now at a high value
      // preVerificationGas: toHex(50_000), // hardcode it for now at a high value
      maxFeePerGas: gasPrice.standard.maxFeePerGas,
      maxPriorityFeePerGas: gasPrice.standard.maxPriorityFeePerGas,
      // paymasterAndData:
      //   "0x67f21be69a16c314a0b7da537309b2f3addde03100000000000000000000000000000000000000000000000000000101010101010000000000000000000000000000000000000000000000000000000000000000cd91f19f0f19ce862d7bec7b7d9b95457145afc6f639c28fd0360f488937bfa41e6eedcd3a46054fd95fcd0e3ef6b0bc0a615c4d975eef55c8a3517257904d5b1c",
      paymasterAndData: "0x",
      signature: "0x",
    };

    // const sponsorUserOperationResult = await pimlicoProvider.send(
    //   "pm_sponsorUserOperation",
    //   [
    //     userOperation,
    //     {
    //       entryPoint: entryPoint,
    //     },
    //   ]
    // );

    // console.log({ sponsorUserOperationResult });

    // const sponsorUserOperationResult = await getPaymasterAndData(userOperation);
    // userOperation.paymasterAndData =
    //   sponsorUserOperationResult.paymasterAndData;

    const estimatedGasForOp = await fetchGasEstimation(userOperation);
    // // prettier-ignore
    userOperation.preVerificationGas = estimatedGasForOp.preVerificationGas;
    // prettier-ignore
    userOperation.verificationGasLimit = estimatedGasForOp.verificationGasLimit;
    // prettier-ignore
    userOperation.callGasLimit = estimatedGasForOp.callGasLimit;
    // userOperation.paymasterAndData = "0x";

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

    console.log({ walletClient });

    const address = walletClient.account.address;

    console.log({ address });

    const signature = await walletClient.signMessage({
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
