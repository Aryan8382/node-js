const express = require("express");
const cors = require("cors");
require("dotenv").config();
const qualityRoutes = require("./routes/QualityRoute");
const scriptApiRoutes = require("./routes/ScriptRoutes");
const inboundRoutes = require("./routes/inboundRoutes");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const userGroupRoutes = require("./routes/UserGroup");

const app = express();

// No automatic table creation needed – ingroups table already exists
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/quality", qualityRoutes);
app.use("/api/scripts", scriptApiRoutes);
app.use("/api/user-groups", userGroupRoutes);
app.use("/api/inbounds", inboundRoutes);
app.get("/test", (req, res) => {
  res.send("Server Working");
});
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server Running on Port ${PORT}`);
});