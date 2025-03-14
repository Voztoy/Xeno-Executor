const { ethers } = require("ethers");
const xlsx = require("xlsx");

// Cài đặt thông số
const provider = new ethers.providers.JsonRpcProvider("https://testnet-rpc.monad.xyz");
const contractAddress = "0x002C8FD766605b609D31Cc9764E27289DAf033e9"; // Hợp đồng ERC-1155
const recipient = "0xA43926be4Ccb032FF89e9565634075Af6618e704"; // Ví nhận
const tokenId = 0; // Điền đúng token ID có thể là 0 1 2 3 4 5...
const amount = 1; // Số lượng NFT
const batchSize = 10; // Số giao dịch song song mỗi lần
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Hàm kiểm tra Private Key có hợp lệ không
const isValidPrivateKey = (key) => typeof key === 'string' && key.startsWith('0x') && key.length === 66;

// Đọc dữ liệu từ tệp Excel
const workbook = xlsx.readFile('data.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

// ABI tối giản cho chuẩn ERC-1155
const erc1155Abi = [
    "function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data) external"
];

// Hàm gửi giao dịch
async function sendTransaction() {
    for (let i = 1; i < data.length; i += batchSize) {
        const batchPromises = [];

        for (let j = 0; j < batchSize && i + j < data.length; j++) {
            const index = i + j;
            const privKey = data[index][0];

            // Kiểm tra private key hợp lệ
            if (!isValidPrivateKey(privKey)) {
                console.error(`#${index} | Lỗi: Private key không hợp lệ -`, privKey);
                continue; // Bỏ qua key không hợp lệ
            }

            const wallet = new ethers.Wallet(privKey, provider);
            const contract = new ethers.Contract(contractAddress, erc1155Abi, wallet);

            const sendTx = async () => {
                try {
                    console.log(`#${index} | Đang gửi giao dịch từ: ${wallet.address}`);
                    const tx = await contract.safeTransferFrom(wallet.address, recipient, tokenId, amount, "0x");
                    console.log(`#${index} | Tx Hash: ${tx.hash}`);
                    await tx.wait();
                    console.log(`#${index} | ✅ Giao dịch thành công!`);
                } catch (error) {
                    console.error(`#${index} | ❌ Lỗi giao dịch:`, error.message);
                }
            };

            batchPromises.push(sendTx());
        }

        await Promise.all(batchPromises);
        console.log(`🕒 Chờ 0.5 giây trước batch tiếp theo...`);
        await delay(500); // Dừng 0.5 giây trước khi gửi batch tiếp theo
    }
}

sendTransaction();
