-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "nano_test";

-- CreateTable
CREATE TABLE "nano_test"."Item" (
    "id" INTEGER NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);
