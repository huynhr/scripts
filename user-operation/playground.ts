import { hexToNumber, formatEther, hexToString, hexToBigInt } from "viem";

const preGasCost = hexToBigInt("0xff2b6");
const inEth1 = formatEther(preGasCost);

console.log({
  cumulativeGasCost: preGasCost,
  inEth1,
});

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
