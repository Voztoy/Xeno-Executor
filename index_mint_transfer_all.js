const { ethers } = require("ethers");
const xlsx = require("xlsx");
require("dotenv").config();

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const nftContractAddress = process.env.NFT_CONTRACT;
const toAddress = process.env.TO_ADDRESS;
const batchSize = 5; // Số lượng xử lý song song

const nftAbi = [
  "function safeTransferFrom(address from, address to, uint256 tokenId) external"
];


// Chức năng mint, hoặc gửi tx
async function sendTransaction(row) {
  const privkey = row[0];
  const contractAddress = row[2];
  const hexData = row[3];

  const wallet = new ethers.Wallet(privkey, provider);

  const tx = {
    to: contractAddress,
    value: ethers.utils.parseEther("0.2"),
    data: hexData,
    gasLimit: 250000,
    maxPriorityFeePerGas: ethers.utils.parseUnits("52", "gwei"),
    maxFeePerGas: ethers.utils.parseUnits("55", "gwei"),
  };

  try {
    const txResponse = await wallet.sendTransaction(tx);
    console.log(`Mint TX Hash: ${txResponse.hash}`);
    return { privateKey: privkey, txHash: txResponse.hash, wallet };
  } catch (error) {
    console.error(`Error sending transaction:`, error);
    return null;
  }
}

async function getTokenIdFromTx(txHash) {
  try {
    const tx = await provider.getTransactionReceipt(txHash);
    if (!tx || !tx.logs.length) return null;

    for (const log of tx.logs) {
      if (log.address.toLowerCase() === nftContractAddress.toLowerCase()) {
        return ethers.BigNumber.from(log.topics[3]).toString();
      }
    }
  } catch (error) {
    console.log(`Error getting token ID from TX ${txHash}:`, error);
  }
  return null;
}



// Chức năng gom NFT sau khi mint xong

async function transferNFT(wallet, txHash) {
  try {
    const signer = new ethers.Wallet(wallet.privateKey, provider);
    const contract = new ethers.Contract(nftContractAddress, nftAbi, signer);
    const tokenId = await getTokenIdFromTx(txHash);

    if (!tokenId) {
      console.log(`Token ID not found for TX ${txHash}`);
      return null;
    }

    console.log(`Transferring NFT: ${tokenId}`);
    const tx = await contract.safeTransferFrom(signer.address, toAddress, tokenId, {
      gasLimit: 150000,
      maxPriorityFeePerGas: ethers.utils.parseUnits("52", "gwei"),
      maxFeePerGas: ethers.utils.parseUnits("55", "gwei"),
    });
    console.log(`NFT ${tokenId} transferred. TX Hash: ${tx.hash}`);
  } catch (error) {
    console.error(`Error transferring NFT:`, error);
  }
}

async function processBatches(rows) {
  for (let i = 0; i < rows.length; i += batchSize) {
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}`);
    const batch = rows.slice(i, i + batchSize);
    const mintResults = await Promise.all(batch.map(sendTransaction));
    
    for (const result of mintResults.filter(Boolean)) {
      await transferNFT(result.wallet, result.txHash);
    }
  }
  console.log("All transactions processed!");
}

(async function main() {
  const workbook = xlsx.readFile("data.xlsx");
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  const rows = data.slice(1);

  await processBatches(rows);
})();
