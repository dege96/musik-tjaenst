import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

process.env.TEST_DATABASE_URL = 'postgres://testuser:testpass@localhost:5432/testdb';

// Stäng av console.log under tester
global.console.log = jest.fn(); 