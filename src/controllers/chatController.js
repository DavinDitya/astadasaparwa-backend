const axios = require("axios");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://127.0.0.1:8000/ask";

// 1. AMBIL LIST SIDEBAR (Judul Percakapan)
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' }, // Yang terbaru paling atas
      select: { id: true, title: true }
    });
    res.json({ data: conversations });
  } catch (error) {
    res.status(500).json({ message: "Gagal memuat sidebar" });
  }
};

// 2. AMBIL ISI CHAT (Berdasarkan ID Percakapan)
exports.getChatMessages = async (req, res) => {
  try {
    const conversationId = parseInt(req.params.conversationId);
    const chats = await prisma.chat.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, message: true, role: true, createdAt: true }
    });
    res.json({ data: chats });
  } catch (error) {
    res.status(500).json({ message: "Gagal memuat pesan" });
  }
};

// 3. KIRIM PESAN (Bisa Baru atau Lanjut)
exports.askChatbot = async (req, res) => {
  try {
    // conversationId bisa NULL (kalau chat baru)
    let { question, history, conversationId } = req.body;
    const userId = req.user.id;

    if (!question) return res.status(400).json({ message: "Pertanyaan kosong" });

    // A. JIKA CHAT BARU -> Buat Sesi Dulu
    if (!conversationId) {
      // Buat judul otomatis dari 30 karakter pertama pertanyaan
      const title = question.substring(0, 30) + (question.length > 30 ? "..." : "");
      
      const newConv = await prisma.conversation.create({
        data: { userId, title }
      });
      conversationId = newConv.id;
    }

    // B. Simpan Pertanyaan User
    await prisma.chat.create({
      data: { conversationId, message: question, role: "user" }
    });
    
    // Update waktu percakapan agar naik ke atas di sidebar
    await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() }
    });

    // C. Kirim ke Python
    const response = await axios.post(PYTHON_API_URL, {
      question, history: history || [], top_k: 10
    });
    const botAnswer = response.data.answer;

    // D. Simpan Jawaban Bot
    await prisma.chat.create({
      data: { conversationId, message: botAnswer, role: "bot" }
    });

    res.json({
      message: "Sukses",
      conversationId: conversationId, // Kirim balik ID agar Android tau ini sesi mana
      data: response.data
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};