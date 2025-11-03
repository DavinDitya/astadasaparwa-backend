const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/verifyToken");
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  createUser,
} = require("../controllers/userAdminController");

// Middleware cek admin
function verifyAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Akses ditolak: hanya admin yang diperbolehkan" });
  }
  next();
}

// 🔹 Semua route di bawah ini hanya bisa diakses admin
router.use(verifyToken, verifyAdmin);
router.post("/", createUser);
router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

module.exports = router;
