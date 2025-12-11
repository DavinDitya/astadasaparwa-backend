const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const { verifyToken } = require("../middleware/verifyToken");

// POST /api/chat/ask
// Kita pasang 'verifyToken' agar hanya user yang sudah login bisa chat
router.post("/ask", verifyToken, chatController.askChatbot);

module.exports = router;
