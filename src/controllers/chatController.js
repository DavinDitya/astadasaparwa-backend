//chatController.js
const axios = require("axios");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://127.0.0.1:8000/ask";

exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' }, 
      select: { id: true, title: true }
    });
    res.json({ data: conversations });
  } catch (error) {
    res.status(500).json({ message: "Gagal memuat sidebar" });
  }
};

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

exports.askChatbot = async (req, res) => {
  try {
    // --- [PERBAIKAN 1] Tangkap 'mode' dari Android ---
    let { question, history, conversationId, mode } = req.body;
    const userId = req.user.id;

    if (!question) return res.status(400).json({ message: "Pertanyaan kosong" });

    if (!conversationId) {
      const title = question.substring(0, 30) + (question.length > 30 ? "..." : "");
      const newConv = await prisma.conversation.create({
        data: { userId, title }
      });
      conversationId = newConv.id;
    }

    await prisma.chat.create({
      data: { conversationId, message: question, role: "user" }
    });
    
    await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() }
    });

    // --- [PERBAIKAN 2] Kirim 'mode' ke Python Railway ---
    const response = await axios.post(PYTHON_API_URL, {
      question, 
      history: history || [], 
      top_k: 10,
      mode: mode || "detail" // Tambahkan ini!
    });
    const botAnswer = response.data.answer;

    await prisma.chat.create({
      data: { conversationId, message: botAnswer, role: "bot" }
    });

    res.json({
      message: "Sukses",
      conversationId: conversationId, 
      data: response.data
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateConversationTitle = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    
    if (!title || title.trim() === "") {
      return res.status(400).json({ message: "Judul tidak boleh kosong" });
    }

    await prisma.conversation.update({
      where: { id: parseInt(id) },
      data: { title }
    });
    res.json({ message: "Judul percakapan berhasil diperbarui" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal memperbarui judul" });
  }
};

exports.deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Hapus semua chat di dalam conversation ini terlebih dahulu (agar tidak error relasi database)
    await prisma.chat.deleteMany({
      where: { conversationId: parseInt(id) }
    });
    
    // Baru hapus conversation utamanya
    await prisma.conversation.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ message: "Percakapan berhasil dihapus" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal menghapus percakapan" });
  }
};