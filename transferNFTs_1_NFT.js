require("dotenv").config();
const { ethers } = require("ethers");
const xlsx = require("xlsx");

const rpcUrl = process.env.RPC_URL;
const nftContractAddress = process.env.NFT_CONTRACT;
const toAddress = process.env.TO_ADDRESS;
const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

const nftAbi = [
  "function safeTransferFrom(address from, address to, uint256 tokenId) external"
];

async function readExcel(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  const wallets = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] && data[i][4]) {
      wallets.push({
        privateKey: data[i][0],
        txHash: data[i][4]
      });
    } else {
      console.log(`⚠️ Bỏ qua dòng ${i + 1} vì thiếu dữ liệu.`);
    }
  }
  return wallets;
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
    console.log(`Lỗi khi lấy token ID từ TX ${txHash}:`, error);
  }
  return null;
}

async function transferNFT(wallet) {
  try {
    const signer = new ethers.Wallet(wallet.privateKey, provider);
    const contract = new ethers.Contract(nftContractAddress, nftAbi, signer);
    const tokenId = await getTokenIdFromTx(wallet.txHash);

    if (!tokenId) {
      console.log(`Không tìm thấy token ID từ TX ${wallet.txHash}`);
      return null;
    }

    console.log(`📌 Đang gửi NFT: ${tokenId}`);

    try {
      const tx = await contract.safeTransferFrom(signer.address, toAddress, tokenId, {
        gasLimit: 150000,
        maxPriorityFeePerGas: ethers.utils.parseUnits("55", "gwei"),
        maxFeePerGas: ethers.utils.parseUnits("65", "gwei")
      });

      console.log(`✅ Gửi NFT ${tokenId} từ ${signer.address} - Tx Hash: ${tx.hash}`);
      await tx.wait();
      return [wallet.privateKey, signer.address, tx.hash, tokenId];
    } catch (error) {
      console.log(`❌ Lỗi khi gửi NFT ${tokenId} từ ${signer.address}:`, error);
    }
  } catch (error) {
    console.log(`❌ Lỗi khi xử lý ví ${wallet.privateKey}:`, error);
  }
  return null;
}

function saveResults(data) {
  const workbook = xlsx.utils.book_new();
  const worksheet = xlsx.utils.aoa_to_sheet([
    ["Private Key", "Address", "Transaction Hash", "NFT ID"],
    ...data
  ]);
  xlsx.utils.book_append_sheet(workbook, worksheet, "Results");
  xlsx.writeFile(workbook, "gom.xlsx");
  console.log("✅ Kết quả đã được lưu vào gom.xlsx");
}

async function processInBatches(wallets, batchSize) {
  let results = [];
  for (let i = 0; i < wallets.length; i += batchSize) {
    const batch = wallets.slice(i, i + batchSize);
    console.log(`🚀 Xử lý batch: ${i / batchSize + 1}`);
    const batchResults = await Promise.all(batch.map(transferNFT));
    results.push(...batchResults.filter(Boolean));
  }
  return results;
}

async function main() {
  const wallets = await readExcel("results.xlsx");
  const batchSize = 10; // Ấn định batch 10
  const results = await processInBatches(wallets, batchSize);
  saveResults(results);
}

main();