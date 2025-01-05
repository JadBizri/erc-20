-- CreateTable
CREATE TABLE "Token" (
    "blockNum" TEXT NOT NULL,
    "uniqueId" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "value" INTEGER,
    "tokenId" TEXT NOT NULL,
    "asset" TEXT,
    "rawContract" JSONB NOT NULL,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("uniqueId")
);
