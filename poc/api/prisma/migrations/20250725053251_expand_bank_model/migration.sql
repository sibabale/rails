/*
  Warnings:

  - You are about to drop the column `code` on the `banks` table. All the data in the column will be lost.
  - You are about to drop the column `connected` on the `banks` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `banks` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[bank_code]` on the table `banks` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[primary_api_key]` on the table `banks` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[secondary_api_key]` on the table `banks` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `admin_email` to the `banks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `admin_first_name` to the `banks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `admin_last_name` to the `banks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bank_code` to the `banks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bank_name` to the `banks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contact_email` to the `banks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `primary_api_key` to the `banks` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "banks_code_key";

-- DropIndex
DROP INDEX "banks_name_key";

-- AlterTable
ALTER TABLE "banks" DROP COLUMN "code",
DROP COLUMN "connected",
DROP COLUMN "name",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "admin_email" TEXT NOT NULL,
ADD COLUMN     "admin_first_name" TEXT NOT NULL,
ADD COLUMN     "admin_last_name" TEXT NOT NULL,
ADD COLUMN     "admin_position" TEXT,
ADD COLUMN     "bank_code" TEXT NOT NULL,
ADD COLUMN     "bank_name" TEXT NOT NULL,
ADD COLUMN     "business_reg_no" TEXT,
ADD COLUMN     "business_type" TEXT,
ADD COLUMN     "contact_email" TEXT NOT NULL,
ADD COLUMN     "contact_phone" TEXT,
ADD COLUMN     "last_login" TIMESTAMP(3),
ADD COLUMN     "primary_api_key" TEXT NOT NULL,
ADD COLUMN     "secondary_api_key" TEXT,
ADD COLUMN     "settings" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending_approval',
ADD COLUMN     "tax_id" TEXT,
ADD COLUMN     "total_clients" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_transactions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_volume" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "banks_bank_code_key" ON "banks"("bank_code");

-- CreateIndex
CREATE UNIQUE INDEX "banks_primary_api_key_key" ON "banks"("primary_api_key");

-- CreateIndex
CREATE UNIQUE INDEX "banks_secondary_api_key_key" ON "banks"("secondary_api_key");
