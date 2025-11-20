const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  log: ["query", "error", "warn"],
});

// Test database connection
async function connectDB() {
  try {
    await prisma.$connect();
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

async function disconnectDB() {
  await prisma.$disconnect();
  console.log("Database disconnected");
}

module.exports = { prisma, connectDB, disconnectDB };
