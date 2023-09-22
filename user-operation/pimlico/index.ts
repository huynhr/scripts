import dotenv from "dotenv";
dotenv.config();
import { ethers } from "ethers";
import { parseUnits, toBytes, toHex } from "viem";
import { genCallDataTransferEth } from "../gen_callData";
import { sender, toAddress } from "../config";
import axios from "axios";
import { BUNDLER_METHODS } from "../bundler-methods";
import { entryPointContract, walletClient } from "../clients";

const pimlicoApiKey = process.env.PIMLICO_API_KEY || "";
const chain = "ethereum"; // find the list of supported chains at https://docs.pimlico.io/reference/bundler
const pimlicoEndpoint = `https://api.pimlico.io/v1/${chain}/rpc?apikey=${pimlicoApiKey}`;

const userOperation = {};
const entryPoint = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

const pimlicoProvider = new ethers.providers.StaticJsonRpcProvider(
  pimlicoEndpoint
);

async function fetchGasEstimation(userOperation: any) {
  try {
    const data = await pimlicoProvider.send(BUNDLER_METHODS.estimateGas, [
      userOperation,
      entryPoint,
    ]);

    return data;
  } catch (err) {
    console.error(err);

    throw new Error(JSON.stringify(err));
  }
}

async function fetchGasPrice() {
  const data = await pimlicoProvider.send(BUNDLER_METHODS.getGasPrice, []);

  console.log({ data });

  return data;
}

async function main() {
  // first let's fetch nonce and gas prices

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

  const userOperation: any = {
    sender,
    nonce: toHex(nonce.toBigInt()),
    initCode: "0x",
    callData,
    maxFeePerGas: gasPrice.standard.maxFeePerGas,
    maxPriorityFeePerGas: gasPrice.standard.maxPriorityFeePerGas,
    // paymasterAndData: "0x",
    paymasterAndData:
      "0x67F21bE69A16c314a0b7Da537309b2f3ADdDE03100000000000000000000000000000000000000000000000000000101010101010000000000000000000000000000000000000000000000000000000000000000cd91f19f0f19ce862d7bec7b7d9b95457145afc6f639c28fd0360f488937bfa41e6eedcd3a46054fd95fcd0e3ef6b0bc0a615c4d975eef55c8a3517257904d5b1c",
    signature: "0x",
  };

  const estimatedGasForOp = await fetchGasEstimation(userOperation);

  console.log({ estimatedGasForOp });
  // prettier-ignore
  userOperation.preVerificationGas = estimatedGasForOp.preVerificationGas;
  // prettier-ignore
  userOperation.verificationGasLimit = estimatedGasForOp.verificationGasLimit;
  // prettier-ignore
  userOperation.callGasLimit = estimatedGasForOp.callGasLimit;

  const userOperationHash = await entryPointContract.getUserOpHash(
    userOperation
  );

  const address = await walletClient.getAddresses();

  const signature = await walletClient.signMessage({
    account: address[0],
    message: { raw: toBytes(userOperationHash) },
  });

  console.log({ signature });

  userOperation.signature = signature;

  const response = await pimlicoProvider.send("eth_sendUserOperation", [
    userOperation,
    entryPoint,
  ]);

  console.log({ response });
}

main();
