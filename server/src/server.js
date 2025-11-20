require("dotenv").config();
const express = require("express");
const creditRoutes = require("./routes/creditRoutes");
const { connectDB, disconnectDB } = require("./config/database");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

//cors origin
app.use(
  cors({
    origin: "http://localhost:5173", 
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/credit", creditRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

//shutdown
process.on("SIGINT", async () => {
  console.log("\n Shutting down the server...");
  await disconnectDB();
  process.exit(0);
});

startServer().catch(console.error);