import { toHex } from "viem";
import dotenv from "dotenv";
dotenv.config();
import { Client, UserOperationBuilder } from "userop";
import { rpcUrl, entryPoint, sender, nonce, toAddress } from "./config";
import { genCallDataTransferEth } from "./gen_callData";

const signature =
  "0xb5a96d113a30346c0a9fd501c19b87e0777f69ffdf25b2ccf4b9c4716e39e9a4534378ea1fedf8ff6ce8b7313676d61f1ec1f061e98685277a24e8c6e0aea7411b";

async function main() {
  try {
    // create userOp client
    const client = await Client.init(rpcUrl, { entryPoint });

    // generate callData to transfer 0.001 eth
    const callData = await genCallDataTransferEth(toAddress, 0.001);

    // build userOp
    const nonceHex = toHex(nonce);
    const builder = new UserOperationBuilder().useDefaults({
      sender,
      nonce: nonceHex,
      signature,
      callData,
    });
    const userOp = await client.buildUserOperation(builder);

    // generate output for pilmico bundler
    const output = {
      jsonrpc: "2.0",
      id: 5,
      method: "eth_sendUserOperation",
      params: [userOp, "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"],
    };

    console.log({ output: JSON.stringify(output) });
  } catch (err) {
    console.log(err);
  }
}

main();
