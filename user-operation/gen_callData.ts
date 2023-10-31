import { encodeFunctionData, parseUnits } from "viem";
import abi from "./abi.json";
import { erc1155Abi, erc721Abi } from "../abi";

export async function genCallDataTransferEth(
  toAddress: string,
  amount: number
) {
  console.log("starting to generate callData...");

  const amountInWei = parseUnits(amount.toString(), 18);
  console.log(`Converting ${amount} eth to ${amountInWei} wei...`);

  const data = "0x";

  return encodeFunctionData({
    abi,
    functionName: "executeCall",
    args: [toAddress, 0, data],
  });
}

export async function genCallDataTransferNFT(
  sender: string,
  recipientAddress: string,
  tokenContract: string,
  tokenId: number,
  tokenType: "ERC1155" | "ERC721"
) {
  console.log("starting nft transfer calldata...");

  const is1155: boolean = tokenType === "ERC1155";

  // Configure required args based on token type
  const transferArgs: unknown[] = is1155
    ? [
        // ERC1155: safeTransferFrom(address,address,uint256,uint256,bytes)
        sender,
        recipientAddress,
        tokenId,
        1,
        "0x",
      ]
    : [
        // ERC721: safeTransferFrom(address,address,uint256)
        sender,
        recipientAddress,
        tokenId,
      ];

  const transferCallData = encodeFunctionData({
    abi: is1155 ? erc1155Abi : erc721Abi,
    functionName: "safeTransferFrom",
    args: transferArgs,
  });

  return encodeFunctionData({
    abi,
    functionName: "executeCall",
    args: [tokenContract, 0, transferCallData],
  });
}
