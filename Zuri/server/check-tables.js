const { db } = require('./src/config/database');

const checkTables = async () => {
  try {
    // Check if tables exist
    const tables = await new Promise((resolve, reject) => {
      db.all(`
        SELECT name FROM sqlite_master
        WHERE type='table'
        AND (name LIKE '%countries%' OR name LIKE '%provinces%' OR name LIKE '%regions%' OR name LIKE '%stores%' OR name LIKE '%users_extended%')
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log('New user management tables found:', tables.map(t => t.name));

    // Check if countries table has data
    const countriesCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM countries', (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    console.log('Countries seeded:', countriesCount.count);

    // Check if provinces table has data
    const provincesCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM provinces', (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    console.log('Provinces seeded:', provincesCount.count);

  } catch (err) {
    console.error('Error checking database:', err.message);
  }
};

checkTables();