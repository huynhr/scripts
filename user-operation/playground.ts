import { hexToNumber, formatEther } from "viem";

const preVerificationGasCost = hexToNumber("0x5208");
const calcPreVerificationGasInEth = formatEther(BigInt(preVerificationGasCost));

const preVerificationGasLimit = hexToNumber("0x11170");
const calcPreVerificationGasLimitInEth = formatEther(
  BigInt(preVerificationGasLimit)
);

const callGasLimit = hexToNumber("0x88b8");
const callGasLimitInEther = formatEther(BigInt(callGasLimit));

console.log({
  preVerificationGasCost,
  calcPreVerificationGasInEth,
  preVerificationGasLimit,
  calcPreVerificationGasLimitInEth,
  callGasLimit,
  callGasLimitInEther,
});
