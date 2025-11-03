import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Path ke folder data
const dataFolder = path.join(process.cwd(), "src", "data");

async function importParwa() {
  try {
    const files = fs
      .readdirSync(dataFolder)
      .filter((file) => file.endsWith(".json"));

    console.log(`📚 Ditemukan ${files.length} file JSON, memulai import...\n`);

    for (const file of files) {
      const filePath = path.join(dataFolder, file);
      const rawData = fs.readFileSync(filePath, "utf-8");
      const jsonData = JSON.parse(rawData);

      // Pastikan jsonData bisa berupa array atau single object
      const entries = Array.isArray(jsonData) ? jsonData : [jsonData];

      for (const entry of entries) {
        await prisma.parwa.create({
          data: {
            book: entry.book || "Tidak diketahui",
            sub_parva: entry.sub_parva || null,
            section: entry.section || null,
            judul: entry.judul || null,
            url: entry.url || null,
            isi: entry.isi || "",
          },
        });
      }

      console.log(`✅ Berhasil import: ${file}`);
    }

    console.log("\n🎉 Semua data Parwa berhasil diimport ke database!");
  } catch (error) {
    console.error("❌ Terjadi kesalahan saat import:", error);
  } finally {
    await prisma.$disconnect();
  }
}

importParwa();
