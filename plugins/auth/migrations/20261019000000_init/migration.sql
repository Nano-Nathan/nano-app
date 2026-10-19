-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "nano_auth";

-- CreateTable
CREATE TABLE "nano_auth"."api_key" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "isMaster" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_key_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "api_key_hash_key" ON "nano_auth"."api_key"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "api_key_isMaster_key" ON "nano_auth"."api_key"("isMaster");

