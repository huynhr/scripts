import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { goerli } from "viem/chains";
import { client } from "../clients";
import { accountAbi } from "../abi";

const tokenboundAccount = "0x9939b16B5863A9Bfa1E1Ca8ac78Deb9BD7Fec133";
const eoa = privateKeyToAccount(
  "0x2d15abe36fdf3166584a34d4884d5fd3503188ff6b2e31c874c9690c43ef111d"
);

console.log({ eoa: eoa.address });

const walletClient = createWalletClient({
  account: eoa,
  chain: goerli,
  transport: http(),
});

async function main() {
  try {
    const [account] = await walletClient.getAddresses();
    const lockTime = new Date(Date.now() + 5 * 60 * 1000);

    const { request } = await client.simulateContract({
      address: tokenboundAccount,
      abi: accountAbi,
      functionName: "lock",
      args: [+lockTime],
      account,
    });
    await walletClient.writeContract(request);
  } catch (err) {
    console.log(err);
  }
}

main();
