import React, { useEffect, useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Other'];

function App() {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({ total: 0, byCategory: {} });
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Other');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [expensesRes, summaryRes] = await Promise.all([
        fetch(`${API_URL}/expenses`),
        fetch(`${API_URL}/expenses/summary`),
      ]);
      setExpenses(await expensesRes.json());
      setSummary(await summaryRes.json());
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addExpense = async (e) => {
    e.preventDefault();
    if (!description.trim() || !amount) return;
    await fetch(`${API_URL}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, amount: parseFloat(amount), category }),
    });
    setDescription('');
    setAmount('');
    setCategory('Other');
    fetchData();
  };

  const deleteExpense = async (id) => {
    await fetch(`${API_URL}/expenses/${id}`, { method: 'DELETE' });
    fetchData();
  };

  return (
    <div style={{ maxWidth: 560, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>Expense Tracker</h1>

      <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, marginBottom: 24 }}>
        <strong>Total spent: ${summary.total?.toFixed(2) || '0.00'}</strong>
        <div style={{ marginTop: 8, fontSize: 14, color: '#555' }}>
          {Object.entries(summary.byCategory || {}).map(([cat, amt]) => (
            <div key={cat}>
              {cat}: ${amt.toFixed(2)}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={addExpense} style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          style={{ flex: 2, padding: 8, minWidth: 140 }}
        />
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          type="number"
          step="0.01"
          style={{ flex: 1, padding: 8, minWidth: 90 }}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: 8 }}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button type="submit" style={{ padding: '8px 16px' }}>Add</button>
      </form>

      {loading ? (
        <p>Loading...</p>
      ) : expenses.length === 0 ? (
        <p>No expenses yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {expenses.map((exp) => (
            <li
              key={exp._id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 0',
                borderBottom: '1px solid #eee',
              }}
            >
              <div>
                <div>{exp.description}</div>
                <div style={{ fontSize: 12, color: '#888' }}>
                  {exp.category} · {new Date(exp.date).toLocaleDateString()}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span>${exp.amount.toFixed(2)}</span>
                <button onClick={() => deleteExpense(exp._id)}>✕</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
