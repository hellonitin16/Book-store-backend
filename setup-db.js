/**
 * setup-db.js — One-time script to create MS Access database and tables
 * Run: node setup-db.js
 */

const ADODB = require('node-adodb');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
require('dotenv').config();

const dbPath = path.resolve(__dirname, process.env.DB_PATH || './bookstore.accdb');

async function createDatabaseFile() {
  if (fs.existsSync(dbPath)) {
    console.log(`Database file already exists: ${dbPath}`);
    return;
  }

  console.log('Creating MS Access database file...');

  // Use VBScript with ADOX to create .accdb file
  const vbsContent = `
Set cat = CreateObject("ADOX.Catalog")
cat.Create "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${dbPath.replace(/\\/g, '\\\\')};"
Set cat = Nothing
WScript.Echo "Database created successfully."
`;

  const vbsPath = path.join(__dirname, '_create_db.vbs');
  fs.writeFileSync(vbsPath, vbsContent.trim(), 'utf8');

  try {
    execSync(`cscript //nologo "${vbsPath}"`, { stdio: 'inherit' });
  } finally {
    // Cleanup temp VBScript
    if (fs.existsSync(vbsPath)) fs.unlinkSync(vbsPath);
  }

  console.log(`Database file created: ${dbPath}`);
}

async function createTables() {
  const connectionString = `Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${dbPath};`;
  const connection = ADODB.open(connectionString, true);

  console.log('\nCreating tables...\n');

  // ─── USERS TABLE ───
  try {
    await connection.execute(`
      CREATE TABLE users (
        id AUTOINCREMENT PRIMARY KEY,
        [name] TEXT(255),
        email TEXT(255),
        [password] TEXT(255),
        [role] TEXT(50)
      )
    `);
    console.log('  ✅ users table created');
  } catch (err) {
    if (err.message && err.message.includes('already exists')) {
      console.log('  ⚠️  users table already exists — skipping');
    } else {
      console.error('  ❌ users table error:', err.message);
    }
  }

  // ─── BOOKS TABLE ───
  try {
    await connection.execute(`
      CREATE TABLE books (
        id AUTOINCREMENT PRIMARY KEY,
        book_name TEXT(255),
        price CURRENCY,
        author_id LONG,
        photo_url MEMO,
        tags MEMO,
        number_of_pages LONG,
        age_group TEXT(100),
        [language] TEXT(100),
        isbn TEXT(50),
        created_at DATETIME DEFAULT NOW()
      )
    `);
    console.log('  ✅ books table created');
  } catch (err) {
    if (err.message && err.message.includes('already exists')) {
      console.log('  ⚠️  books table already exists — skipping');
    } else {
      console.error('  ❌ books table error:', err.message);
    }
  }

  // ─── REVIEWS TABLE ───
  try {
    await connection.execute(`
      CREATE TABLE reviews (
        id AUTOINCREMENT PRIMARY KEY,
        book_id LONG,
        user_id LONG,
        rating LONG,
        review_text MEMO,
        created_at DATETIME DEFAULT NOW()
      )
    `);
    console.log('  ✅ reviews table created');
  } catch (err) {
    if (err.message && err.message.includes('already exists')) {
      console.log('  ⚠️  reviews table already exists — skipping');
    } else {
      console.error('  ❌ reviews table error:', err.message);
    }
  }

  // ─── PURCHASES TABLE ───
  try {
    await connection.execute(`
      CREATE TABLE purchases (
        id AUTOINCREMENT PRIMARY KEY,
        user_id LONG,
        book_id LONG,
        quantity LONG,
        total_price CURRENCY,
        purchased_at DATETIME DEFAULT NOW()
      )
    `);
    console.log('  ✅ purchases table created');
  } catch (err) {
    if (err.message && err.message.includes('already exists')) {
      console.log('  ⚠️  purchases table already exists — skipping');
    } else {
      console.error('  ❌ purchases table error:', err.message);
    }
  }

  console.log('\n🎉 Database setup complete!');
  console.log(`   File: ${dbPath}`);
}

// ─── RUN ───
(async () => {
  try {
    await createDatabaseFile();
    await createTables();
  } catch (err) {
    console.error('\n❌ Setup failed:', err.message);
    process.exit(1);
  }
})();
