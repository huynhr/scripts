import { encodeFunctionData } from "viem";

const initData = encodeFunctionData({
  abi: [
    {
      inputs: [],
      name: "initialize",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
  ],
  functionName: "initialize",
});

console.log({ initData });
