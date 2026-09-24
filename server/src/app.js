const express = require("express");
const cors = require("cors");
const chestRoutes = require("./routes/chest.routes");
const authRoutes = require("./routes/auth.routes");
const homeRoutes = require("./routes/home.routes");
const adminRoutes = require("./routes/admin.routes");
const coupleRoutes = require("./routes/couple.routes");
const profileRoutes = require("./routes/profile.routes");
const mediaRoutes = require("./routes/media.routes");
const { notFound, errorHandler } = require("./middlewares/error.middleware");
const app = express();
// 1. Global middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
// 2. Routes
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/chests", chestRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/home", homeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/couple", coupleRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/media", mediaRoutes);
// 3. Error handling — must be LAST
app.use(notFound);
app.use(errorHandler);
module.exports = app;
