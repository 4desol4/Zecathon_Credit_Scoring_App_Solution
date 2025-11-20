const { PrismaClient } = require("@prisma/client");
const ScoringEngine = require("../services/scoringEngine");

const prisma = new PrismaClient();

class CreditScoreController {
  static async calculateScore(req, res) {
    try {
      const { userId } = req.params;

  
      if (!/^[a-fA-F0-9]{24}$/.test(userId)) {
        return res.status(400).json({ error: "Invalid userId format" });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { transactions: { orderBy: { date: "asc" } } },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (!user.transactions || user.transactions.length < 10) {
        return res.status(400).json({
          error: "Insufficient transaction history",
          message: "Minimum 10 transactions required for scoring",
        });
      }

      // --- Calculate score ---
      const scoreData = ScoringEngine.calculateScore(user, user.transactions);

      const creditScore = await prisma.creditScore.create({
        data: {
          userId: user.id,
          score: scoreData.score,
          grade: scoreData.grade,
          riskLevel: scoreData.riskLevel,
          transactionScore: scoreData.breakdown.transaction,
          cashFlowScore: scoreData.breakdown.cashFlow,
          stabilityScore: scoreData.breakdown.stability,
          behaviorScore: scoreData.breakdown.behavior,
          recommendations: scoreData.recommendations,
          version: "v1.0",
        },
      });

      res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          accountNumber: user.accountNumber,
          businessType: user.businessType,
        },
        creditScore: {
          score: creditScore.score,
          grade: creditScore.grade,
          riskLevel: creditScore.riskLevel,
          calculatedAt: creditScore.calculatedAt,
        },
        breakdown: {
          transaction: creditScore.transactionScore,
          cashFlow: creditScore.cashFlowScore,
          stability: creditScore.stabilityScore,
          behavior: creditScore.behaviorScore,
        },
        recommendations: creditScore.recommendations,
      });
    } catch (error) {
      console.error("Score calculation error:", error);
      res.status(500).json({ error: "Failed to calculate credit score" });
    }
  }

  // Get user's credit score history
  static async getScoreHistory(req, res) {
    try {
      const { userId } = req.params;

      const scores = await prisma.creditScore.findMany({
        where: { userId },
        orderBy: { calculatedAt: "desc" },
        take: 10,
      });

      res.json({
        success: true,
        userId,
        history: scores,
      });
    } catch (error) {
      console.error("Error fetching score history:", error);
      res.status(500).json({ error: "Failed to fetch score history" });
    }
  }

  // Get all eligible users for loans
  static async getEligibleUsers(req, res) {
    try {
      const minScore = parseInt(req.query.minScore) || 550;

      const eligibleScores = await prisma.creditScore.findMany({
        where: {
          score: { gte: minScore },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              accountNumber: true,
              businessType: true,
            },
          },
        },
        orderBy: { score: "desc" },
      });

      // Group by user (get latest score per user)
      const uniqueUsers = {};
      eligibleScores.forEach((score) => {
        if (
          !uniqueUsers[score.userId] ||
          new Date(score.calculatedAt) >
            new Date(uniqueUsers[score.userId].calculatedAt)
        ) {
          uniqueUsers[score.userId] = score;
        }
      });

      res.json({
        success: true,
        count: Object.keys(uniqueUsers).length,
        minScore,
        eligibleUsers: Object.values(uniqueUsers).map((score) => ({
          user: score.user,
          score: score.score,
          grade: score.grade,
          maxLoanAmount: score.maxLoanAmount,
          interestRate: score.interestRate,
          lastCalculated: score.calculatedAt,
        })),
      });
    } catch (error) {
      console.error("Error fetching eligible users:", error);
      res.status(500).json({ error: "Failed to fetch eligible users" });
    }
  }
}

module.exports = CreditScoreController;
