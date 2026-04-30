const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const { verifyToken } = require("../middleware/verifyToken");

// ROUTE CHAT
router.get("/conversations", verifyToken, chatController.getConversations); // Sidebar
router.get("/messages/:conversationId", verifyToken, chatController.getChatMessages); // Isi Chat
router.post("/ask", verifyToken, chatController.askChatbot); // Tanya
router.put("/conversations/:id", verifyToken, chatController.updateConversationTitle);
router.delete("/conversations/:id", verifyToken, chatController.deleteConversation);

module.exports = router;
