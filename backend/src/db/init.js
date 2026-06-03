const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Read database parameters from environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'billing_system',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  multipleStatements: true
};

// Create a pool to export
const db = mysql.createPool(dbConfig);

const initDB = async () => {
  try {
    // 1. First connect to MySQL without a specific database to ensure it exists
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      port: dbConfig.port
    });

    console.log('Connecting to MySQL host to ensure database exists...');
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
    await connection.end();

    // 2. Read schema.sql and execute
    const schemaPath = path.resolve(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('Initializing MySQL schema...');
    await db.query(schema);

    // 3. Initialize default template if none exists
    const [checkTemplate] = await db.query('SELECT COUNT(*) as count FROM templates');
    if (checkTemplate[0].count === 0) {
      console.log('Inserting default business template...');
      await db.query(`
        INSERT INTO templates (business_name, business_address, business_contact, footer_notes, tax_rate, currency)
        VALUES (?, ?, ?, ?, ?, ?)
      `, ['My Business', '123 Main St, City', 'contact@mybusiness.com', 'Thank you for your business!', 0, '₹']);
    }

    console.log('Database initialization completed successfully.');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

module.exports = { db, initDB };
