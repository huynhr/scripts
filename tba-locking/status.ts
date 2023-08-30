import { accountAbi } from "../abi";
import { client } from "../clients";
const tokenboundAccount = "0x9939b16B5863A9Bfa1E1Ca8ac78Deb9BD7Fec133";

async function main() {
  try {
    // using viem client, I want to call a read method called isLocked and lockedUntil
    const isLocked = await client.readContract({
      address: tokenboundAccount,
      abi: accountAbi,
      functionName: "isLocked",
    });

    console.log({ isLocked });

    const lockedUntil = await client.readContract({
      address: tokenboundAccount,
      abi: accountAbi,
      functionName: "lockedUntil",
    });

    console.log({
      lockedUntil: BigInt(lockedUntil as any).toString(),
      date: new Date(BigInt(lockedUntil as number).toString()).toISOString(),
    });
  } catch (err) {
    console.error(err);
  }
}

main();
