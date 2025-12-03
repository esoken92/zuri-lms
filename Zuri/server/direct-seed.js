const { Pool } = require('pg');

const dbConfig = {
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'zuri',
  password: process.env.PGPASSWORD || '1234',
  port: Number(process.env.PGPORT) || 54321,
};

const pool = new Pool(dbConfig);

(async () => {
  try {
    console.log('Connecting to database...');
    
    // Clear existing tyres
    console.log('Clearing existing tyres...');
    await pool.query('DELETE FROM tyres');
    
    // Insert CSV data
    console.log('Inserting CSV data...');
    const insertQuery = `
      INSERT INTO tyres (brand, pattern, "Ply Rating", "Original Tread Depth", "Load Rating", "Load Rating Duals", "Load Rating Singles", "Speed Rating Duals", "Speed Rating Singles", "Tube Rating", "Nominal Section Width", "Aspect Ratio", "Rim Size", "Product Code")
      VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `;
    
    const tires = [
      ['Michelin', 'X Multi HDD', '18PR', '22.5', '156/150', '156', '150', 'K', 'L', 'TL', '315', '65', '22.5', 'PC001'],
      ['Bridgestone', 'M840', '16PR', '16.5', '150/145', '150', '145', 'J', 'K', 'TL', '295', '80', '22.5', 'PC002'],
      ['Continental', 'HS3', '20PR', '15.5', '160/150', '160', '150', 'L', 'M', 'TL', '315', '70', '22.5', 'PC003'],
      ['Sumitomo', 'ST909', '18PR', '17', '154/150', '154', '150', 'K', 'L', 'TL', '315', '80', '22.5', 'PC004'],
      ['Goodyear', 'KMAX S', '16PR', '17', '148/145', '148', '145', 'J', 'K', 'TL', '295', '75', '22.5', 'PC005']
    ];
    
    for (const tire of tires) {
      const result = await pool.query(insertQuery, tire);
      console.log(`✅ Inserted: ${tire[0]} ${tire[1]}`);
    }
    
    console.log('✅ All tires successfully inserted!');
    
    // Verify
    console.log('\nVerifying data...');
    const verifyResult = await pool.query('SELECT id, brand, pattern, "Product Code" FROM tyres ORDER BY id');
    console.log('Database now contains:');
    verifyResult.rows.forEach(row => {
      console.log(`  [${row.id}] ${row.brand} ${row.pattern} (${row['Product Code']})`);
    });
    
    await pool.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
    process.exit(1);
  }
})();
