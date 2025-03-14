const { ethers } = require("ethers");
const xlsx = require("xlsx");

const provider = new ethers.providers.JsonRpcProvider("https://testnet-rpc.monad.xyz");// Thay RPC ở đây Thay RPC ở đây

// Số lượng ví chạy song song
const batchSize = 10; // Đổi thành 2, 4 hoặc 5 tùy ý
const batchLimit = 100; // Sau mỗi 100 batch sẽ lưu ra file mới

async function sendTransactionRow(row) {
    const privkey = row[0]; // Cột A: private key
    const contractAddress = row[2]; // Cột C: smart contract address
    const hexData = row[3]; // Cột D: hex data

    const wallet = new ethers.Wallet(privkey, provider);

    const tx = {
        to: contractAddress,
        value: ethers.utils.parseEther("0.1"),
        data: hexData,
        gasLimit: 230000,// Sửa gas trước khi min Sửa gas trước khi min Sửa gas trước khi min Sửa gas trước khi min Sửa gas trước khi min
        maxPriorityFeePerGas: ethers.utils.parseUnits("62", "gwei"),// Sửa giá phí tối thiểu trước khi mint Sửa giá phí tối thiểu trước khi mint
        maxFeePerGas: ethers.utils.parseUnits("72", "gwei"),// Sửa giá phí tối thiểu trước khi mint Sửa giá phí tối thiểu trước khi mint
    };

    try {
        const txResponse = await wallet.sendTransaction(tx);
        console.log(`Transaction Hash for wallet ${wallet.address}:`, txResponse.hash);
        return txResponse.hash;
    } catch (error) {
        console.error(`Error sending transaction for wallet ${wallet.address}:`, error);
        return "Error";
    }
}

async function sendTransaction() {
    const workbook = xlsx.readFile("data.xlsx");
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    const rows = data.slice(1); // Bỏ dòng tiêu đề

    let results = [data[0].concat(["Transaction Hash"])]; // Thêm cột E
    let fileIndex = 1;
    let batchCount = 0;

    for (let i = 0; i < rows.length; i += batchSize) {
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1} with ${batchSize} wallets`);

        const batch = rows.slice(i, i + batchSize).map(sendTransactionRow);
        const txHashes = await Promise.all(batch);

        for (let j = 0; j < txHashes.length; j++) {
            results.push(rows[i + j].concat([txHashes[j]]));
        }

        batchCount++;

        // Sau mỗi 100 batch thì lưu file và reset bộ nhớ
        if (batchCount >= batchLimit || i + batchSize >= rows.length) {
            const fileName = `results${fileIndex}.xlsx`;
            const newSheet = xlsx.utils.aoa_to_sheet(results);
            const newWorkbook = xlsx.utils.book_new();
            xlsx.utils.book_append_sheet(newWorkbook, newSheet, "Results");
            xlsx.writeFile(newWorkbook, fileName);

            console.log(`Saved ${fileName}`);

            // Reset biến và tăng file index
            results = [data[0].concat(["Transaction Hash"])];
            batchCount = 0;
            fileIndex++;
        }
    }

    console.log("All transactions processed!");
}

sendTransaction();
