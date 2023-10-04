const entryPoint = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
const bundlerHost = "http:localhost:3000";
export const config = {
  goerli: {
    rpcUrl: "",
    entryPoint,
    sender: "",
    toAddress: "",
    bundlerHost,
    signerPrivateKey: "",
    bundlerRpcUrl: `${bundlerHost}/5`,
  },
};
