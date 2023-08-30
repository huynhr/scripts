import { encodeFunctionData, parseUnits } from "viem";
import abi from "./abi.json";

export async function genCallDataTransferEth(
  toAddress: string,
  amount: number
) {
  console.log("starting to generate callData...");

  const amountInWei = parseUnits(amount.toString(), 18);
  console.log(`Converting ${amount} eth to ${amountInWei} wei...`);

  const data = "0x";

  return encodeFunctionData({
    abi,
    functionName: "executeCall",
    args: [toAddress, amountInWei, data],
  });
}
