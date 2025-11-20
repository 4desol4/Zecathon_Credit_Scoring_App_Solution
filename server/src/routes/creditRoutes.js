const express = require("express");
const CreditScoreController = require("../controllers/creditScoreController");

const router = express.Router();

// Calculate credit score for a specific user
router.post("/score/:userId", CreditScoreController.calculateScore);

// Get credit score history for a user
router.get("/score/:userId/history", CreditScoreController.getScoreHistory);

// Get all loan-eligible users
router.get("/eligible-users", CreditScoreController.getEligibleUsers);

module.exports = router;
