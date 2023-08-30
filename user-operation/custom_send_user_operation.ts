import { Abi, parseUnits } from "viem";
import { viemPublicClient, walletClient } from "./clients";
import { sender, toAddress } from "./config";
import abi from "./abi.json";

async function main() {
  try {
    const eth = 0.0000001;
    const wei = parseUnits(eth.toString(), 18);

    const { request } = await viemPublicClient.simulateContract({
      address: sender as `0x${string}`,
      abi: abi as Abi,
      functionName: "executeCall",
      args: [toAddress, wei, "0x"],
      account: walletClient.account,
    });

    await walletClient?.writeContract(request);
  } catch (err) {
    console.log(err);
  }
}

main();
