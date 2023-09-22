import { ethers } from "ethers";

const data =
  // "0x8b7ac980000000000000000000000000000000000000000000000000000000000010c582000000000000000000000000000000000000000000000000002f02c3c817bcf800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ffffffffffff000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000"; // Your full error data
  "0x220266b600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000001741413231206469646e2774207061792070726566756e64000000000000000000";
const methodId = data.substring(0, 10); // First 4 bytes contain the function selector
const encodedData = data.substring(10); // The rest is the encoded data

if (methodId === "0x8b7ac980") {
  const decodedData = ethers.utils.defaultAbiCoder.decode(
    ["uint256", "uint256", "uint48", "uint48", "bool", "bytes"],
    "0x" + encodedData
  );
  console.log("Decoded error data:", {
    preOpsGas: BigInt(decodedData[0]),
    paid: BigInt(decodedData[1]),
    validAfter: decodedData[2],
    validUntil: decodedData[3],
    targetSuccess: decodedData[4],
    targetResult: decodedData[5],
  });
}

if (methodId === "0x220266b6") {
  const decodedData = ethers.utils.defaultAbiCoder.decode(
    // ["uint256", "uint256", "uint48", "uint48", "bool", "bytes"],
    ["uint256", "string"],
    "0x" + encodedData
  );
  console.log({ decodedData });
}