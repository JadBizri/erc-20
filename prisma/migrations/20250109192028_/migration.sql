-- CreateTable
CREATE TABLE "Transfer" (
    "transactionHash" TEXT NOT NULL,
    "blockNumber" INTEGER,
    "fromAddress" TEXT,
    "toAddress" TEXT,
    "amount" TEXT,
    "tokenAddress" TEXT,

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("transactionHash")
);

-- CreateTable
CREATE TABLE "Sync_Data" (
    "key" TEXT NOT NULL,
    "number" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Transfer_transactionHash_key" ON "Transfer"("transactionHash");

-- CreateIndex
CREATE UNIQUE INDEX "Sync_Data_key_key" ON "Sync_Data"("key");
