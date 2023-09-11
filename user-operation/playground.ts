import { hexToNumber, formatEther, hexToString, hexToBigInt } from "viem";

const cumulativeGasCost = hexToBigInt("0x244b23");
const inEth1 = formatEther(cumulativeGasCost);

console.log({
  cumulativeGasCost,
  inEth1,
});

const gasUsed = hexToBigInt("0x19c45");
const inEth2 = formatEther(gasUsed);

console.log({
  gasUsed,
  inEth2,
});

const effectiveGasPrice = hexToBigInt("0x721");
const inEth3 = formatEther(effectiveGasPrice);

console.log({
  effectiveGasPrice,
  inEth3,
});

const actualGasUsed = hexToBigInt("0x19610");
const actualGasCost = hexToBigInt("0xc6f7770");

console.log({ actualGasUsed, actualGasCost });
