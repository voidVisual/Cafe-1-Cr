const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://cafe_user:cafe_password@localhost:5432/cafe_db'
});

const menuData = [
  { name: "Cappuccino", description: "A classic cappuccino made with 25ml of rich espresso and 85ml of perfectly steamed milk, topped with chocolate shavings.", price: 320, category: "Beverages", image_url: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80", prep_time_estimate: 5 },
  { name: "Café Latte", description: "A smooth, creamy latte made with oat milk for a naturally sweet finish. Perfect for your morning.", price: 310, category: "Beverages", image_url: "https://images.unsplash.com/photo-1485808191679-5f86510bd9d4?w=600&q=80", prep_time_estimate: 5 },
  { name: "Machiato", description: "Espresso marked with a dollop of foam, drizzled with house-made caramel. Bold yet sweet.", price: 360, category: "Beverages", image_url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&q=80", prep_time_estimate: 5 },
  { name: "Almond Croissant", description: "Flaky, buttery croissant filled with almond cream and topped with toasted flaked almonds. Baked fresh daily.", price: 200, category: "Snacks", image_url: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80", prep_time_estimate: 2 }
];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log("Seeding menu items...");
    for (const item of menuData) {
      await client.query(`
        INSERT INTO menu_items (name, description, price, category, image_url, prep_time_estimate)
        SELECT $1, $2, $3, $4, $5, $6
        WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = $1)
      `, [item.name, item.description, item.price, item.category, item.image_url, item.prep_time_estimate]);
    }
    
    console.log("Seeding tables...");
    for (let i = 1; i <= 5; i++) {
      const qr_token = crypto.randomBytes(8).toString('hex');
      await client.query(`
        INSERT INTO cafe_tables (table_number, qr_token)
        SELECT $1, $2
        WHERE NOT EXISTS (SELECT 1 FROM cafe_tables WHERE table_number = $1)
      `, [i, qr_token]);
    }
    
    console.log("Seeding admin user...");
    // Just a dummy hash for "admin" password
    const pwdHash = "dummy_bcrypt_hash_for_admin"; 
    await client.query(`
      INSERT INTO users (email, password_hash, role)
      SELECT 'admin@cafe.com', $1, 'admin'
      WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@cafe.com')
    `, [pwdHash]);

    console.log("Seeding settings...");
    const defaultSettings = [
      { key: 'tax_rate', value: JSON.stringify({ rate: 0.18 }) },
      { key: 'currency', value: JSON.stringify({ code: 'INR', symbol: '₹' }) },
      { key: 'cafe_info', value: JSON.stringify({ name: 'Cafe-1-Cr', hours: '08:00 - 22:00' }) }
    ];
    for (const s of defaultSettings) {
      await client.query(`
        INSERT INTO cafe_settings (key, value)
        SELECT $1, $2
        WHERE NOT EXISTS (SELECT 1 FROM cafe_settings WHERE key = $1)
      `, [s.key, s.value]);
    }

    await client.query('COMMIT');
    console.log("Seed complete.");
  } catch (e) {
    await client.query('ROLLBACK');
    console.error("Seeding failed: ", e);
  } finally {
    client.release();
    pool.end();
  }
}

seed();
