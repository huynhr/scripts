import { toHex } from "viem";
import dotenv from "dotenv";
dotenv.config();
import { Client, UserOperationBuilder } from "userop";
import { rpcUrl, entryPoint, sender, nonce, toAddress } from "./config";
import { genCallDataTransferEth } from "./gen_callData";
import { fetchGasPrice } from "./get-gas-price";

const signature =
  "0x87d4c911de6925b45d827bdd682400096dd1e06c72b2e5c0609c54b6f81575cb559f794757e945492dfed3529587795e80efeaa3a35721b9f59fbdc2bd0f72271c";

async function main() {
  try {
    // create userOp client
    const client = await Client.init(rpcUrl, { entryPoint });

    // generate callData to transfer 0.001 eth
    const callData = await genCallDataTransferEth(toAddress, 0.001);

    // build userOp
    const nonceHex = toHex(nonce);
    const builder = new UserOperationBuilder()
      .useDefaults({
        sender,
        nonce: nonceHex,
        signature,
        callData,
      })
      .useMiddleware(fetchGasPrice);

    const userOp = await client.buildUserOperation(builder);

    console.log({ userOp: JSON.stringify(userOp) });

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
