const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const Expense = require('../Expense');

let mongoServer;

// Spin up a fresh, temporary, in-memory MongoDB before any tests run
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

// Clean up the expenses collection before each test for isolation
beforeEach(async () => {
  await Expense.deleteMany({});
});

// Tear down completely after all tests finish
afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe('GET /api/health', () => {
  it('returns status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('POST /api/expenses', () => {
  it('creates a new expense with valid data', async () => {
    const res = await request(app).post('/api/expenses').send({
      description: 'Coffee',
      amount: 150,
      category: 'Food',
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.description).toBe('Coffee');
    expect(res.body.amount).toBe(150);
    expect(res.body.category).toBe('Food');
  });

  it('rejects a request missing required fields', async () => {
    const res = await request(app).post('/api/expenses').send({
      category: 'Food',
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Description and amount are required');
  });

  it('defaults category to "Other" when not provided', async () => {
    const res = await request(app).post('/api/expenses').send({
      description: 'Misc item',
      amount: 20,
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.category).toBe('Other');
  });
});

describe('GET /api/expenses', () => {
  it('returns expenses sorted newest first', async () => {
    await Expense.create({ description: 'Old', amount: 100, date: new Date('2024-01-01') });
    await Expense.create({ description: 'New', amount: 200, date: new Date('2024-06-01') });

    const res = await request(app).get('/api/expenses');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].description).toBe('New'); // newest first
  });

  it('returns an empty array when no expenses exist', async () => {
    const res = await request(app).get('/api/expenses');

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('GET /api/expenses/summary', () => {
  it('calculates total and per-category breakdown correctly', async () => {
    await Expense.create({ description: 'Lunch', amount: 100, category: 'Food' });
    await Expense.create({ description: 'Bus', amount: 50, category: 'Transport' });
    await Expense.create({ description: 'Snacks', amount: 30, category: 'Food' });

    const res = await request(app).get('/api/expenses/summary');

    expect(res.statusCode).toBe(200);
    expect(res.body.total).toBe(180);
    expect(res.body.byCategory).toEqual({ Food: 130, Transport: 50 });
  });

  it('returns zero total when no expenses exist', async () => {
    const res = await request(app).get('/api/expenses/summary');

    expect(res.statusCode).toBe(200);
    expect(res.body.total).toBe(0);
    expect(res.body.byCategory).toEqual({});
  });
});

describe('DELETE /api/expenses/:id', () => {
  it('deletes an existing expense', async () => {
    const expense = await Expense.create({ description: 'Temp', amount: 10, category: 'Other' });

    const res = await request(app).delete(`/api/expenses/${expense._id}`);

    expect(res.statusCode).toBe(204);
    const found = await Expense.findById(expense._id);
    expect(found).toBeNull();
  });
});