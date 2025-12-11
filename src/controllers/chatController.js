const axios = require("axios");

// URL Server Python (FastAPI)
// Karena Node.js dan Python jalan di laptop yang sama, kita pakai localhost
// Pastikan portnya 8000 (sesuai settingan Python Anda tadi)
const PYTHON_API_URL = "http://127.0.0.1:8000/ask";

exports.askChatbot = async (req, res) => {
  try {
    const { question } = req.body;

    // 1. Validasi input dari Android
    if (!question) {
      return res.status(400).json({ message: "Pertanyaan tidak boleh kosong" });
    }

    console.log(`🤖 Mengirim pertanyaan ke Python: "${question}"`);

    // 2. Oper pertanyaan ke Python (Microservice)
    const response = await axios.post(PYTHON_API_URL, {
      question: question,
      top_k: 4, // Opsional: jumlah referensi yang mau diambil
    });

    // 3. Ambil jawaban dari Python
    const pythonData = response.data;

    // 4. Kirim balik ke Android
    // pythonData isinya biasanya: { "answer": "...", "retrieved": [...] }
    res.json({
      message: "Sukses",
      data: pythonData,
    });
  } catch (error) {
    console.error("❌ Error menghubungkan ke Python Chatbot:", error.message);

    // Cek apakah errornya karena Python mati?
    if (error.code === "ECONNREFUSED") {
      return res.status(503).json({
        message: "Layanan Chatbot sedang tidak aktif (Python server mati).",
      });
    }

    res.status(500).json({ message: "Terjadi kesalahan pada server chatbot" });
  }
};
