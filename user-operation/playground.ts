import { hexToNumber, formatEther, hexToString, hexToBigInt } from "viem";

// const preVerificationGasCost = hexToNumber("0x5208");
// const calcPreVerificationGasInEth = formatEther(BigInt(preVerificationGasCost));

const preVerificationGasLimit = hexToBigInt("0xabe8");
const calcPreVerificationGasLimitInEth = formatEther(preVerificationGasLimit);

// const callGasLimit = hexToNumber("0x88b8");
// const callGasLimitInEther = formatEther(BigInt(callGasLimit));

console.log({
  // preVerificationGasCost,
  // calcPreVerificationGasInEth,
  preVerificationGasLimit,
  calcPreVerificationGasLimitInEth,
  // callGasLimit,
  // callGasLimitInEther,
});

/**
 * current EOA balance: 1.027022317793096539
 */
