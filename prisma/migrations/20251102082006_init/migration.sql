-- CreateTable
CREATE TABLE `Parwa` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `book` VARCHAR(191) NOT NULL,
    `sub_parva` VARCHAR(191) NULL,
    `section` VARCHAR(191) NULL,
    `judul` VARCHAR(191) NULL,
    `url` VARCHAR(191) NULL,
    `isi` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
