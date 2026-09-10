const express = require('express');
const cors = require('cors');
const Expense = require('./Expense');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// GET all expenses, newest first
app.get('/api/expenses', async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// GET total + breakdown by category
app.get('/api/expenses/summary', async (req, res) => {
  try {
    const expenses = await Expense.find();
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const byCategory = {};
    expenses.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    });
    res.json({ total, byCategory });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to compute summary' });
  }
});

// POST a new expense
app.post('/api/expenses', async (req, res) => {
  const { description, amount, category } = req.body;
  if (!description || !amount) {
    return res.status(400).json({ error: 'Description and amount are required' });
  }
  try {
    const expense = await Expense.create({ description, amount, category });
    res.status(201).json(expense);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// DELETE an expense
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

module.exports = app;