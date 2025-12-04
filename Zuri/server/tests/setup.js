// Test setup file
const { pool } = require('../src/config/database');

// Setup before all tests
beforeAll(async () => {
  // Ensure database connection
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    console.error('Database connection failed in tests:', err);
    throw err;
  }
});

// Cleanup after all tests
afterAll(async () => {
  await pool.end();
});

// Setup before each test
beforeEach(async () => {
  // Clean up test data if needed
  // This can be expanded based on test requirements
});

// Global test utilities
global.testUtils = {
  createTestUser: async (overrides = {}) => {
    const defaultUser = {
      username: `testuser_${Date.now()}`,
      password_hash: '$2b$10$test.hash.for.testing.purposes',
      role: 'User'
    };

    const user = { ...defaultUser, ...overrides };
    const result = await pool.query(
      'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING *',
      [user.username, user.password_hash, user.role]
    );
    return result.rows[0];
  },

  cleanupTestUser: async (userId) => {
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
  }
};