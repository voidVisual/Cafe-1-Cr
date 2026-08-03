const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env'), override: true });

async function cleanDatabase() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'cafe_user',
    password: process.env.DB_PASSWORD || 'cafe_password',
    database: process.env.DB_NAME || 'cafe_db',
  });

  try {
    await client.connect();
    console.log('Connected to database successfully.');
    
    // Wipe only orders (leaves menu intact)
    await client.query('TRUNCATE TABLE orders CASCADE;');
    
    console.log('✅ All test orders have been completely wiped!');
    console.log('✅ Menu items were preserved.');
    console.log('✅ The database is clean and ready for production!');
  } catch (err) {
    console.error('Error cleaning database:', err.message);
  } finally {
    await client.end();
  }
}

cleanDatabase();
