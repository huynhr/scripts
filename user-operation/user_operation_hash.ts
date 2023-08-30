import { toHex } from "viem";
import fs from "fs";
import path from "path";
import {
  Client,
  UserOperationBuilder,
  UserOperationMiddlewareCtx,
} from "userop";

import { sender, entryPoint, rpcUrl, nonce, toAddress } from "./config";
import { genCallDataTransferEth } from "./gen_callData";

async function main() {
  try {
    console.log("starting to get userOps hash...");
    // generate client
    const client = await Client.init(rpcUrl, { entryPoint });

    // get callData for eth transfer
    const callData = await genCallDataTransferEth(toAddress, 0.001);

    // build userOp
    const nonceHex = toHex(nonce);
    const builder = new UserOperationBuilder().useDefaults({
      sender,
      nonce: nonceHex,
      callData,
    });
    const userOp = await client.buildUserOperation(builder);

    // get userOpHash
    const middleware = new UserOperationMiddlewareCtx(
      userOp,
      entryPoint,
      client.chainId
    );
    const userOpHash = middleware.getUserOpHash();
    console.log({ userOpHash });

    // write the userOpHash into a json file
    const pathToFile = path.join(__dirname, "userOpHash.json");
    fs.writeFileSync(pathToFile, JSON.stringify({ userOpHash }));
  } catch (err) {
    console.log(err);
  } finally {
    console.log("finished...");
  }
}

main();
