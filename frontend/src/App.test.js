import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

const mockExpense = {
  _id: '1',
  description: 'Coffee',
  amount: 50,
  category: 'Food',
  date: '2024-01-01T00:00:00.000Z',
};

// Helper to mock fetch responses based on URL and method
function mockFetchImplementation({ expenses = [mockExpense], summary = { total: 50, byCategory: { Food: 50 } } } = {}) {
  global.fetch = jest.fn((url, options) => {
    const method = options?.method || 'GET';

    if (url.includes('/expenses/summary')) {
      return Promise.resolve({ json: () => Promise.resolve(summary) });
    }
    if (url.match(/\/expenses\/[^/]+$/) && method === 'DELETE') {
      return Promise.resolve({ json: () => Promise.resolve({}) });
    }
    if (url.endsWith('/expenses') && method === 'POST') {
      return Promise.resolve({ json: () => Promise.resolve({}) });
    }
    if (url.endsWith('/expenses') && method === 'GET') {
      return Promise.resolve({ json: () => Promise.resolve(expenses) });
    }
    return Promise.resolve({ json: () => Promise.resolve({}) });
  });
}

beforeEach(() => {
  mockFetchImplementation();
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('renders the app title', async () => {
  render(<App />);
  expect(screen.getByText('Expense Tracker')).toBeInTheDocument();
});

test('shows loading state initially, then displays fetched expenses', async () => {
  render(<App />);

  expect(screen.getByText('Loading...')).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getByText('Coffee')).toBeInTheDocument();
  });

  expect(screen.getByText('$50.00')).toBeInTheDocument();
});

test('displays the correct total from summary', async () => {
  render(<App />);

  await waitFor(() => {
    expect(screen.getByText('Total spent: $50.00')).toBeInTheDocument();
  });
});

test('shows "No expenses yet." when list is empty', async () => {
  mockFetchImplementation({ expenses: [], summary: { total: 0, byCategory: {} } });
  render(<App />);

  await waitFor(() => {
    expect(screen.getByText('No expenses yet.')).toBeInTheDocument();
  });
});

test('submits a new expense and refetches data', async () => {
  render(<App />);
  await waitFor(() => expect(screen.getByText('Coffee')).toBeInTheDocument());

  const user = userEvent.setup();
  await user.type(screen.getByPlaceholderText('Description'), 'Lunch');
  await user.type(screen.getByPlaceholderText('Amount'), '25');
  await user.click(screen.getByText('Add'));

  await waitFor(() => {
    // Confirms a POST request was fired with correct body
    const postCall = global.fetch.mock.calls.find(
      (call) => call[1]?.method === 'POST'
    );
    expect(postCall).toBeTruthy();
    const body = JSON.parse(postCall[1].body);
    expect(body.description).toBe('Lunch');
    expect(body.amount).toBe(25);
  });
});

test('does not submit when description or amount is empty', async () => {
  render(<App />);
  await waitFor(() => expect(screen.getByText('Coffee')).toBeInTheDocument());

  const initialCallCount = global.fetch.mock.calls.length;

  fireEvent.click(screen.getByText('Add'));

  // No new fetch call should be made since fields are empty
  expect(global.fetch.mock.calls.length).toBe(initialCallCount);
});

test('deletes an expense when the delete button is clicked', async () => {
  render(<App />);
  await waitFor(() => expect(screen.getByText('Coffee')).toBeInTheDocument());

  const user = userEvent.setup();
  await user.click(screen.getByText('✕'));

  await waitFor(() => {
    const deleteCall = global.fetch.mock.calls.find(
      (call) => call[1]?.method === 'DELETE'
    );
    expect(deleteCall).toBeTruthy();
    expect(deleteCall[0]).toContain('/expenses/1');
  });
});