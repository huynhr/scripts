import axios from "axios";
import { IUserOperationMiddlewareCtx } from "userop";
import { bundlerHost, entryPoint } from "./config";
import { BUNDLER_METHODS } from "./bundler-methods";
import { hexToBigInt, hexToNumber, parseEther } from "viem";

export const fetchGasPrice = async (ctx: IUserOperationMiddlewareCtx) => {
  console.log({ ctx: JSON.stringify(ctx) });

  try {
    console.log("fetching gas price estimate...");
    const { op } = ctx;
    const callGasLimit = Number(op.callGasLimit);
    const verificationGasLimit = Number(op.verificationGasLimit);
    const preVerificationGas = Number(op.preVerificationGas);
    const maxFeePerGas =
      callGasLimit + verificationGasLimit + preVerificationGas;

    console.log({ callGasLimit, preVerificationGas, verificationGasLimit });

    const userOperation = {
      ...op,
      nonce: Number(op.nonce),
      callGasLimit,
      verificationGasLimit,
      preVerificationGas,
      maxFeePerGas,
      maxPriorityFeePerGas: Number(op.maxPriorityFeePerGas),
    };

    const { data } = await axios({
      method: "post",
      url: `${bundlerHost}/rpc`,
      data: {
        id: 1,
        jsonrpc: "2.0",
        method: BUNDLER_METHODS.estimateGas,
        params: [userOperation, entryPoint],
      },
    });

    console.log("gas price estimate fetched");

    if (data.error) {
      throw new Error(JSON.stringify(data.error));
    }

    console.log({ data });

    if (data.result) {
      op.callGasLimit = hexToBigInt(data.result.callGasLimit);
      op.preVerificationGas = hexToBigInt(data.result.preVerificationGas);
      op.verificationGasLimit = hexToBigInt(data.result.verificationGasLimit);
    }

    console.log({
      opCallGasLimit: op.callGasLimit,
      opPreVerificationGas: op.preVerificationGas,
      opVerificationGasLimit: op.verificationGasLimit,
    });

    /**
     * with change in gas
     * 0x16492b3b5f5fa91b5a15e5ade05c52fe0acb73addc26e9fce1f612bad2adcd56
     *
     */
  } catch (err) {
    console.log("fetchGasPrice: ", err);
  }
};
