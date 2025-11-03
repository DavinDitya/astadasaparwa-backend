const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

// ✅ CREATE user (hanya admin)
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Nama, email, dan password wajib diisi" });
    }

    // cek apakah email sudah digunakan
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email sudah digunakan" });
    }

    // hash password sebelum disimpan
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "user", // default user
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(201).json({ message: "User berhasil dibuat", data: newUser });
  } catch (error) {
    console.error("❌ Error createUser:", error);
    res.status(500).json({ message: "Gagal membuat user" });
  }
};

// ✅ GET semua user
exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ total: users.length, users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

// ✅ GET user by ID
exports.getUserById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) return res.status(404).json({ message: "User tidak ditemukan" });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

// ✅ UPDATE user
exports.updateUser = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, email, role } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { name, email, role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    res.json({ message: "User berhasil diperbarui", data: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal memperbarui user" });
  }
};

// ✅ DELETE user
exports.deleteUser = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    await prisma.user.delete({ where: { id } });

    res.json({ message: "User berhasil dihapus" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal menghapus user" });
  }
};
