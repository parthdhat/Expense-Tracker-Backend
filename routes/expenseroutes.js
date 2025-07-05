const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { addExpense, getExpenses, deleteExpense,updateExpense,getExpenseSummary } = require("../controllers/expensecontroller");

router.post("/", auth, addExpense);
router.get("/", auth, getExpenses);
router.delete("/:id", auth, deleteExpense);
router.put("/:id", auth, updateExpense);
router.get("/summary", auth, getExpenseSummary);


module.exports = router;

