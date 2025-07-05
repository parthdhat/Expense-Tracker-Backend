const Expense = require("../models/expense");
const mongoose = require("mongoose");

const addExpense = async (req, res) => {
  try {
    const { title, amount, category, date } = req.body;

    const expense = new Expense({
      title,
      amount,
      category,
      date,
      user: req.user._id  // ✅ Attach user ID from token
    });

    await expense.save();
    res.status(201).json(expense);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const getExpenses = async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate, minAmount, maxAmount } = req.query;

    // Build filter
    const filter = { user: userId };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = Number(minAmount);
      if (maxAmount) filter.amount.$lte = Number(maxAmount);
    }
    if (req.query.keyword) {
  filter.title = { $regex: req.query.keyword, $options: "i" };
}

    const expenses = await Expense.find(filter);

    // Compute total amount
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    res.status(200).json({
      expenses,
      totalAmount,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};



const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id, // ✅ important to match the authenticated user
    });

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.status(200).json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// Update an expense
const updateExpense = async (req, res) => {
  try {
    const expenseId = req.params.id;
    const userId = req.user._id;

    console.log("Trying to update:", expenseId);
    console.log("Requested by user:", userId);

    // Debug: Check if expense exists
    const found = await Expense.findById(expenseId);
    if (!found) {
      return res.status(404).json({ message: "Expense not found" });
    }

  

    // Only allow update if user owns the expense
    if (found.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Now update it
    const updatedExpense = await Expense.findByIdAndUpdate(
      expenseId,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedExpense);
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getExpenseSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const expenses = await Expense.find({ user: userId });

    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const dates = expenses.map((e) => new Date(e.date));
    const amounts = expenses.map((e) => e.amount);

    const daysSet = new Set(dates.map(d => d.toDateString()));
    const avgPerDay = total / daysSet.size;

    const monthsSet = new Set(dates.map(d => `${d.getFullYear()}-${d.getMonth()}`));
    const avgPerMonth = total / monthsSet.size;

    const highest = Math.max(...amounts);
    const lowest = Math.min(...amounts);

    res.status(200).json({ total, avgPerDay, avgPerMonth, highest, lowest });
  } catch (err) {
    res.status(500).json({ message: "Summary failed", error: err.message });
  }
};


module.exports = { addExpense, getExpenses, deleteExpense,updateExpense,getExpenseSummary };
