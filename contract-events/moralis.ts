import dotenv from "dotenv";
dotenv.config();
import { registryABI } from "./../abi/index";
import Moralis from "moralis";
import { TB_REGISTRY_CONTRACT } from "../constants";

const accountCreatedTopic =
  "0x07fba7bba1191da7ee1155dcfa0030701c9c9a9cc34a93b991fc6fd0c9268d8f";

async function main() {
  try {
    await Moralis.start({
      apiKey: process.env.MORALIS_API_KEY,
    });

    const response = await Moralis.EvmApi.events.getContractEvents({
      chain: "0x1",
      topic: accountCreatedTopic,
      address: TB_REGISTRY_CONTRACT,
      offset: 100,
      abi: {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: "address",
            name: "account",
            type: "address",
          },
          {
            indexed: false,
            internalType: "address",
            name: "implementation",
            type: "address",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "chainId",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "address",
            name: "tokenContract",
            type: "address",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "salt",
            type: "uint256",
          },
        ],
        name: "AccountCreated",
        type: "event",
      },
    });

    console.log(JSON.stringify(response.raw));
  } catch (e) {
    console.error(e);
  }
}

main();
