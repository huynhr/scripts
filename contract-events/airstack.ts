import { request } from "graphql-request";
import getTbaSchema from "./getTbaSchema";

async function main() {
  try {
    const response = await request({
      url: "https://api.airstack.xyz/gql",
      document: getTbaSchema,
      variables: {
        tokenAddress: "0x26727ed4f5ba61d3772d1575bca011ae3aef5d36",
        tokenId: "108",
      },
    });

    console.log({ response: JSON.stringify(response) });
  } catch (err) {
    console.log(err);
  }
}

main();
