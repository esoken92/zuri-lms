const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'zuri',
  password: process.env.PGPASSWORD,
  port: Number(process.env.PGPORT) || 54321,
});

(async () => {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name='tyres' 
      ORDER BY ordinal_position
    `);
    
    console.log('Current tyres table columns:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
