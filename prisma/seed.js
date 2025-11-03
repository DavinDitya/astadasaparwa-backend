const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@astadasa.com";

  // cek apakah admin sudah ada
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("admin123", 10);

    await prisma.user.create({
      data: {
        name: "Administrator",
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
      },
    });

    console.log("✅ Admin berhasil dibuat:");
    console.log("Email: admin@astadasa.com");
    console.log("Password: admin123");
  } else {
    console.log("⚠️ Admin sudah ada, tidak perlu membuat baru.");
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
