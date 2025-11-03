const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const parwaRoutes = require("./routes/parwaRoute");
const authRoutes = require("./routes/authRoute");
const userRoutes = require("./routes/userRoute");
const userAdminRoutes = require("./routes/userAdminRoute");

require("dotenv").config();
const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) =>
  res.json({ status: "ok", service: "asta-dasa-backend" })
);

app.use("/api/parwa", parwaRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin/users", userAdminRoutes);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
