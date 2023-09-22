import { hexToNumber, formatEther, hexToString, hexToBigInt } from "viem";
import { ethers } from "ethers";

const data =
  "0x8b7ac980000000000000000000000000000000000000000000000000000000000010c58200000000000000000000000000000000000000000000000000283c89c8ef90ea00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ffffffffffff000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000";

const methodId = data.substring(0, 10);
const encodedData = data.substring(10);

const decodedData = ethers.utils.defaultAbiCoder.decode(
  ["string"],
  "0x" + encodedData
);

console.log("Revert reason:", decodedData[0]);

// const preGasCost = hexToBigInt("0x407f964c8");
// const inEth1 = formatEther(preGasCost);

// console.log({
//   cumulativeGasCost: preGasCost,
//   inEth1,
// });

// const gasUsed = hexToBigInt("0x19c45");
// const inEth2 = formatEther(gasUsed);

// console.log({
//   gasUsed,
//   inEth2,
// });

// const effectiveGasPrice = hexToBigInt("0x721");
// const inEth3 = formatEther(effectiveGasPrice);

// console.log({
//   effectiveGasPrice,
//   inEth3,
// });

// const actualGasUsed = hexToBigInt("0x19610");
// const actualGasCost = hexToBigInt("0xc6f7770");

// console.log({ actualGasUsed, actualGasCost });
