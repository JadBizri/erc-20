-- CreateTable
CREATE TABLE "Token" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "name" TEXT,
    "symbol" TEXT,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transfer" (
    "transactionHash" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "toAddress" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "tokenAddress" TEXT NOT NULL,

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("transactionHash")
);

-- CreateIndex
CREATE UNIQUE INDEX "Token_address_key" ON "Token"("address");

-- CreateIndex
CREATE UNIQUE INDEX "Transfer_transactionHash_key" ON "Transfer"("transactionHash");

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "Token"("address") ON DELETE RESTRICT ON UPDATE CASCADE;
