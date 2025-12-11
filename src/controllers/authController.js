const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();

// REGISTER USER
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "Semua field wajib diisi" });

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return res.status(400).json({ message: "Email sudah terdaftar" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    res.status(201).json({ message: "Registrasi berhasil", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

// LOGIN USER
exports.login = async (req, res) => {
  console.log("➡️ [1] Masuk ke fungsi Login Controller");
  try {
    const { email, password } = req.body;
    console.log(`➡️ [2] Data diterima: ${email}`);

    // --- CHECKPOINT 1: DATABASE ---
    console.log("➡️ [3] Sedang mencari user di Database (Prisma)...");
    const user = await prisma.user.findUnique({ where: { email } });
    console.log(
      "✅ [4] Selesai cari user via Prisma. Hasil:",
      user ? "Ketemu" : "NULL"
    );

    if (!user) {
      console.log("❌ [User Tidak Ditemukan]");
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    // --- CHECKPOINT 2: PASSWORD ---
    console.log("➡️ [5] Sedang membandingkan password (Bcrypt)...");
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log("✅ [6] Hasil cek password:", isPasswordValid);

    if (!isPasswordValid) {
      console.log("❌ [Password Salah]");
      return res.status(401).json({ message: "Password salah" });
    }

    // --- CHECKPOINT 3: TOKEN ---
    console.log("➡️ [7] Sedang membuat JWT Token...");
    // Cek apakah JWT_SECRET ada
    if (!process.env.JWT_SECRET) {
      throw new Error("FATAL: process.env.JWT_SECRET belum diset di .env!");
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    console.log("✅ [8] Token berhasil dibuat");

    console.log("🚀 [9] Mengirim respon ke Client");
    res.json({
      message: "Login berhasil",
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("❌ [ERROR DI LOGIN]:", error);
    res
      .status(500)
      .json({ message: "Terjadi kesalahan server", error: error.message });
  }
};
