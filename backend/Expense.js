const mongoose = require('mongoose');

// Notice: no separate init.sql needed like with Postgres — Mongoose defines
// the shape of the document in code, and MongoDB creates the collection
// automatically the first time a document is inserted.
const expenseSchema = new mongoose.Schema({
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  category: {
    type: String,
    required: true,
    enum: ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Other'],
    default: 'Other',
  },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Expense', expenseSchema);
