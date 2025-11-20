class ScoringEngine {
  // Score weights (total = 100%)
  static WEIGHTS = {
    transaction: 0.3, // 30%
    cashFlow: 0.35, // 35%
    stability: 0.2, // 20%
    behavior: 0.15, // 15%
  };

  static calculateScore(user, transactions) {
    const last6Months = this.filterLast6Months(transactions);

    const scores = {
      transaction: this.scoreTransactions(last6Months),
      cashFlow: this.scoreCashFlow(last6Months),
      stability: this.scoreStability(user, last6Months),
      behavior: this.scoreBehavior(last6Months),
    };

    // Weighted total on 0-100 scale
    const rawScore =
      scores.transaction * this.WEIGHTS.transaction +
      scores.cashFlow * this.WEIGHTS.cashFlow +
      scores.stability * this.WEIGHTS.stability +
      scores.behavior * this.WEIGHTS.behavior;

    // Map to 300-850 (FICO-like)
    const finalScore = Math.round(300 + (rawScore / 100) * 550);
    const grade = this.calculateGrade(finalScore);

    // Simple risk classification 
    let riskLevel = "High";
    if (finalScore >= 700) riskLevel = "Low";
    else if (finalScore >= 600) riskLevel = "Medium";
    else riskLevel = "High";

    const recommendations = this.generateRecommendations(
      scores,
      user,
      last6Months
    );

    return {
      score: finalScore,
      grade,
      riskLevel,
      breakdown: scores,
      recommendations,
    };
  }



  static scoreTransactions(transactions) {
    let score = 0;
    const avgPerMonth = transactions.length / 6;
    if (avgPerMonth >= 50) score += 40;
    else if (avgPerMonth >= 30) score += 30;
    else if (avgPerMonth >= 15) score += 20;
    else if (avgPerMonth >= 5) score += 10;

    const volumeGrowth = this.calculateVolumeGrowth(transactions);
    if (volumeGrowth > 0.2) score += 30;
    else if (volumeGrowth > 0.1) score += 20;
    else if (volumeGrowth > 0) score += 10;

    const categories = new Set(transactions.map((t) => t.category)).size;
    if (categories >= 5) score += 30;
    else if (categories >= 3) score += 20;
    else if (categories >= 2) score += 10;

    return Math.min(score, 100);
  }

  static scoreCashFlow(transactions) {
    let score = 0;
    const credits = transactions.filter((t) => t.type === "credit");
    const debits = transactions.filter((t) => t.type === "debit");

    const totalIncome = credits.reduce((s, t) => s + t.amount, 0);
    const totalExpenses = debits.reduce((s, t) => s + t.amount, 0);

   
    const ratio = totalIncome / Math.max(totalExpenses, 1);
    if (ratio >= 1.5) score += 50;
    else if (ratio >= 1.3) score += 40;
    else if (ratio >= 1.15) score += 30;
    else if (ratio >= 1.0) score += 20;

    const negativeBalanceMonths = this.countNegativeBalanceMonths(transactions);
    if (negativeBalanceMonths === 0) score += 30;
    else if (negativeBalanceMonths <= 1) score += 15;

    const avgMonthlyIncome = totalIncome / 6;
    if (avgMonthlyIncome >= 500000) score += 20;
    else if (avgMonthlyIncome >= 200000) score += 15;
    else if (avgMonthlyIncome >= 100000) score += 10;
    else if (avgMonthlyIncome >= 50000) score += 5;

    return Math.min(score, 100);
  }

  static scoreStability(user, transactions) {
    let score = 0;

    if ((user.accountAge || 0) >= 24) score += 40;
    else if ((user.accountAge || 0) >= 12) score += 30;
    else if ((user.accountAge || 0) >= 6) score += 20;
    else if ((user.accountAge || 0) >= 3) score += 10;

    const monthlyTransactions = this.groupByMonth(transactions);
    const consistency = this.calculateConsistency(monthlyTransactions);

    if (consistency >= 0.8) score += 60;
    else if (consistency >= 0.6) score += 40;
    else if (consistency >= 0.4) score += 20;

    return Math.min(score, 100);
  }

  static scoreBehavior(transactions) {
    let score = 100;

    const overdrafts = transactions.filter((t) => t.balance < 0).length;
    if (overdrafts > 5) score -= 30;
    else if (overdrafts > 2) score -= 15;
    else if (overdrafts > 0) score -= 5;

    const latePayments = transactions.filter(
      (t) => t.category === "loan_repayment" && this.isLatePayment(t)
    ).length;
    if (latePayments > 3) score -= 40;
    else if (latePayments > 1) score -= 20;
    else if (latePayments > 0) score -= 10;

    const savingsTransactions = transactions.filter(
      (t) => t.category === "savings" || t.category === "investment"
    );
    if (savingsTransactions.length >= 10) score += 30;
    else if (savingsTransactions.length >= 5) score += 15;

    return Math.max(0, Math.min(score, 100));
  }

  static filterLast6Months(transactions) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return transactions.filter((t) => new Date(t.date) >= sixMonthsAgo);
  }

  static calculateVolumeGrowth(transactions) {
    const half = Math.floor(transactions.length / 2) || 1;
    const first = transactions.slice(0, half);
    const last = transactions.slice(half);

    const vol1 = first.reduce((s, t) => s + t.amount, 0);
    const vol2 = last.reduce((s, t) => s + t.amount, 0);

    return (vol2 - vol1) / Math.max(vol1, 1);
  }

  static countNegativeBalanceMonths(transactions) {
    const monthlyBalances = this.groupByMonth(transactions);
    return Object.values(monthlyBalances).filter((monthData) =>
      monthData.some((t) => t.balance < 0)
    ).length;
  }

  static groupByMonth(transactions) {
    return transactions.reduce((acc, t) => {
      const month = new Date(t.date).toISOString().slice(0, 7);
      if (!acc[month]) acc[month] = [];
      acc[month].push(t);
      return acc;
    }, {});
  }

  static calculateConsistency(monthlyData) {
    const counts = Object.values(monthlyData).map((arr) => arr.length);
    if (counts.length === 0) return 0;
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
    const variance =
      counts.reduce((sum, c) => sum + Math.pow(c - avg, 2), 0) / counts.length;
    return 1 - Math.sqrt(variance) / (avg || 1);
  }

  static isLatePayment(transaction) {
    // Placeholder – implement when you have dueDate fields.
    return false;
  }

  static calculateGrade(score) {
    if (score >= 800) return "A+";
    if (score >= 750) return "A";
    if (score >= 700) return "B+";
    if (score >= 650) return "B";
    if (score >= 600) return "C+";
    if (score >= 550) return "C";
    return "D";
  }

  static generateRecommendations(scores, user, transactions) {
    const tips = [];

    if (scores.transaction < 70) {
      tips.push(
        "Increase transaction frequency - aim for 30+ transactions monthly"
      );
      tips.push("Diversify income sources across different categories");
    }

    if (scores.cashFlow < 70) {
      tips.push("Improve profit margins - aim for 30%+ income over expenses");
      tips.push("Maintain positive account balance consistently");
    }

    if (scores.stability < 70) {
      tips.push(
        "Build longer account history - consistency over 12+ months helps"
      );
      tips.push("Maintain regular monthly transaction patterns");
    }

    if (scores.behavior < 70) {
      tips.push("Avoid overdrafts and negative balances");
      tips.push("Start saving 10-15% of monthly income");
    }

    if ((user.accountAge || 0) < 12) {
      tips.push(
        "Continue building account history - scores improve after 12 months"
      );
    }

    return tips.slice(0, 5);
  }
}

module.exports = ScoringEngine;
