const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ✅ GET all Parwa (dengan pagination)
exports.getAllParwa = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      prisma.parwa.count(),
      prisma.parwa.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          book: true,
          sub_parva: true,
          section: true,
          judul: true,
          url: true,
          isi: true,
          createdAt: true,
        },
      }),
    ]);

    res.json({ total, page, limit, items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ GET detail Parwa by ID
exports.getParwaById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const parwa = await prisma.parwa.findUnique({ where: { id } });

    if (!parwa) return res.status(404).json({ message: "Parwa not found" });
    res.json(parwa);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ SEARCH Parwa
exports.searchParwa = async (req, res) => {
  try {
    const q = req.query.q || "";
    if (!q)
      return res.status(400).json({ message: "Query parameter q is required" });

    const items = await prisma.parwa.findMany({
      where: {
        OR: [
          { judul: { contains: q, mode: "insensitive" } },
          { book: { contains: q, mode: "insensitive" } },
          { isi: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    res.json({ total: items.length, items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ CREATE Parwa (Admin only)
exports.createParwa = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Akses ditolak: hanya admin" });
    }

    const { book, sub_parva, section, judul, url, isi } = req.body;

    const newParwa = await prisma.parwa.create({
      data: { book, sub_parva, section, judul, url, isi },
    });

    res.status(201).json({
      message: "Parwa berhasil ditambahkan",
      data: newParwa,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ UPDATE Parwa (Admin only)
exports.updateParwa = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Akses ditolak: hanya admin" });
    }

    const id = parseInt(req.params.id);
    const { book, sub_parva, section, judul, url, isi } = req.body;

    const parwa = await prisma.parwa.findUnique({ where: { id } });
    if (!parwa)
      return res.status(404).json({ message: "Parwa tidak ditemukan" });

    const updated = await prisma.parwa.update({
      where: { id },
      data: { book, sub_parva, section, judul, url, isi },
    });

    res.json({
      message: "Parwa berhasil diperbarui",
      data: updated,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ DELETE Parwa (Admin only)
exports.deleteParwa = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Akses ditolak: hanya admin" });
    }

    const id = parseInt(req.params.id);
    const parwa = await prisma.parwa.findUnique({ where: { id } });
    if (!parwa)
      return res.status(404).json({ message: "Parwa tidak ditemukan" });

    await prisma.parwa.delete({ where: { id } });

    res.json({ message: "Parwa berhasil dihapus" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
