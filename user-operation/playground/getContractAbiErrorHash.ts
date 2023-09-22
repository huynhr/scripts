import { entryPointABI as abi } from "../../abi";
import { ethers } from "ethers";

function findMatchingSignature(targetHash: string) {
  for (const item of abi) {
    if (item.type === "function" || item.type === "error") {
      const signature = `${item.name}(${(item.inputs || [])
        .map((input: any) => input.type)
        .join(",")})`;
      const hash = ethers.utils.id(signature);
      const selector = hash.substring(0, 10);
      console.log("comparing signature: \n", { targetHash, selector });
      if (selector === targetHash) {
        console.log(
          `Found matching signature: ${signature}, type: ${item.type}, name: ${item.name}`
        );
        return signature;
      }
    }
  }
  console.log("No matching signature found");
  return null;
}

const error =
  "0x220266b600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000001741413231206469646e2774207061792070726566756e64000000000000000000";
const errorString = error.substring(0, 10);
findMatchingSignature(errorString);
