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

// [FUNGSI BARU] Mengambil daftar nama Versi
exports.getVersions = async (req, res) => {
  try {
    // Tarik semua data dari tabel Version yang baru kita buat
    const versions = await prisma.version.findMany({
      orderBy: { id: "asc" },
    });
    
    // Ubah formatnya jadi array string biasa biar Kotlin gampang bacanya
    // Hasil: ["Kisari Mohan Ganguli", "Versi B"]
    const data = versions.map(v => v.name);
    
    res.json({ data: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// [UPDATE FUNGSI LAMA] Tarik kategori Parwa berdasarkan Versi
exports.getParwaCategories = async (req, res) => {
  try {
    const { version } = req.query; // Tangkap param dari URL (?version=Kisari...)

    let filter = {}; // Default: tanpa filter

    // Kalau ada klik versi dari HP Android
    if (version) {
      // Cari dulu ID versinya di tabel Version
      const versionData = await prisma.version.findUnique({
        where: { name: version }
      });
      
      // Kalau ketemu, pasang filter ID-nya
      if (versionData) {
        filter = { versionId: versionData.id };
      }
    }

    const categories = await prisma.parwa.findMany({
      where: filter,
      distinct: ["book"], 
      select: { book: true },
      orderBy: { id: "asc" }, 
    });

    res.json({
      message: "Kategori Parwa berhasil diambil",
      data: categories,
    });
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

exports.getSectionsByBook = async (req, res) => {
  try {
    const { bookName } = req.params;

    const sections = await prisma.parwa.findMany({
      where: {
        book: bookName, // Filter buku (misal: Adi Parva)
      },
      distinct: ["section"], // KUNCI: Hanya ambil nama section yang unik
      select: {
        section: true,
        sub_parva: true, // Kita ambil juga sub_parva buat info tambahan
        // id: true <-- Jangan ambil ID, karena 1 section punya banyak ID ayat
      },
      orderBy: {
        id: "asc", // Urutkan sesuai urutan cerita
      },
    });

    res.json({
      message: `Daftar Section untuk ${bookName} berhasil diambil`,
      total: sections.length,
      data: sections,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getContentBySection = async (req, res) => {
  try {
    const { bookName, sectionName } = req.params;

    const items = await prisma.parwa.findMany({
      where: {
        book: bookName,
        section: sectionName
      },
      select: {
        id: true,
        judul: true, // "Adi Parva - Section I"
        isi: true,   // Teks ceritanya
        isi_id: true,
        url: true
      },
      orderBy: {
        id: 'asc' // Urutkan biar alurnya benar
      }
    });

    if (items.length === 0) {
        return res.status(404).json({ message: "Data tidak ditemukan" });
    }

    res.json({
      message: "Isi berhasil diambil",
      data: items
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
