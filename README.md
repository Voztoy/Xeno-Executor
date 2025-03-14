# Chơi mint hàng loạt các nft/nfts

- Chức năng chính:
  + Áp dụng dễ dàng với những lệnh mint có hexdata đơn giản
  + Gom NFT về 1 ví


## Cài Node js

- [Node.js](https://nodejs.org/) (v14 or higher)
- npm (Node Package Manager)

## Installation

### 1. Clone the repository:

   ```bash
   git clone https://github.com/voztoy/auto_mint_batch_collect.git
   cd auto_mint_batch_collect
   ```

### 2. Install the necessary packages:

   ```bash
   npm install
   npm install ethers@5
   npm install xlsx
   npm install dotenv
   
   ```
### 3.  Tham số data.xlsx
- Privatekey từ ô A2 trở xuống, có 0x
- Địa chỉ ví ở ô B2 trở xuống
- Contract mint ở ô C2 trở xuống
- Hexdata ở ô B2 trở xuống


## Cách chạy

Trước khi chạy node cần lưu ý set node

- Set RPC

- Set gaslimit và gasprice trước khi mint

- Set số lượng batch (chạy song song) tuỳ thuộc độ khoẻ của RPC)

- Set contract

- Set ví nhận

- Cấu trúc .env
   ```bash
   RPC_URL=
   NFT_CONTRACT=
   TO_ADDRESS=
   ```

### 1. Sử dụng index_hash_results_batch.js để mint

- Sau khi mint đẻ ra file results.xlxs chứa hash

- Gom NFT về một ví sử dụng 2 loại node sau:
   +  transferNFTs_1_NFT.js nếu hash chứa 1 nft
   +  transferNFTs_2_NFT.js nếu hash chứa 2 nft

   => Cả 2 node đều lấy dữ liệu privkey và hash từ results.xlxs và sử dụng rpc, contract, ví nhận ở .evn

   => Áp dụng cho cả 2 ERC721 và ERC1155,

- Gom NFTs về 1 ví sử dụng node Gom_ERC1155.js

   => Chỉ áp dụng cho RC1155, node chỉ cần sử dụng privateky ở data.xlsx (rpc, contract, ví nhận cần thay trong node)


### 2.  Sử dụng index_mint_transfer_all.js để mint

Node này mint xong gửi nft/nfts ngay sau khi mint về ví nhận, với điều kiện rpc khoẻ


## Donations

0xADE4FBED97eF37F3BfbaF36B575a1B114DA92155

