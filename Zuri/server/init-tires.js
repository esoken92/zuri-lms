const { Pool } = require('pg');

console.log('Starting tire database initialization...');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'zuri',
  password: '1234',
  port: 54321,
});

pool.on('error', (err) => {
  console.error('Pool error:', err);
  process.exit(1);
});

(async () => {
  try {
    console.log('[1/4] Dropping old tyres table...');
    await pool.query('DROP TABLE IF EXISTS tyres CASCADE');
    console.log('✅ Old table dropped');
    
    console.log('[2/4] Creating new tyres table...');
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS "tyres" (
        id SERIAL PRIMARY KEY,
        brand VARCHAR(100) NOT NULL,
        pattern VARCHAR(100) NOT NULL,
        "Ply Rating" VARCHAR(50),
        "Original Tread Depth" VARCHAR(50),
        "Load Rating" VARCHAR(50),
        "Load Rating Duals" VARCHAR(50),
        "Load Rating Singles" VARCHAR(50),
        "Speed Rating Duals" VARCHAR(10),
        "Speed Rating Singles" VARCHAR(10),
        "Tube Rating" VARCHAR(10),
        "Nominal Section Width" VARCHAR(50),
        "Aspect Ratio" VARCHAR(50),
        "Rim Size" VARCHAR(50),
        "Product Code" VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(brand, pattern, "Nominal Section Width", "Aspect Ratio", "Rim Size")
      );
    `;
    await pool.query(createTableSql);
    console.log('✅ New table created');
    
    console.log('[3/4] Inserting CSV data...');
    const insertQuery = `
      INSERT INTO tyres (brand, pattern, "Ply Rating", "Original Tread Depth", "Load Rating", "Load Rating Duals", "Load Rating Singles", "Speed Rating Duals", "Speed Rating Singles", "Tube Rating", "Nominal Section Width", "Aspect Ratio", "Rim Size", "Product Code")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `;
    
    const tires = [
      ['Michelin', 'X Multi HDD', '18PR', '22.5', '156/150', '156', '150', 'K', 'L', 'TL', '315', '65', '22.5', 'PC001'],
      ['Bridgestone', 'M840', '16PR', '16.5', '150/145', '150', '145', 'J', 'K', 'TL', '295', '80', '22.5', 'PC002'],
      ['Continental', 'HS3', '20PR', '15.5', '160/150', '160', '150', 'L', 'M', 'TL', '315', '70', '22.5', 'PC003'],
      ['Sumitomo', 'ST909', '18PR', '17', '154/150', '154', '150', 'K', 'L', 'TL', '315', '80', '22.5', 'PC004'],
      ['Goodyear', 'KMAX S', '16PR', '17', '148/145', '148', '145', 'J', 'K', 'TL', '295', '75', '22.5', 'PC005']
    ];
    
    for (let i = 0; i < tires.length; i++) {
      const tire = tires[i];
      await pool.query(insertQuery, tire);
      console.log(`  ✅ [${i+1}/5] Inserted: ${tire[0]} ${tire[1]}`);
    }
    
    console.log('[4/4] Verifying data...');
    const verifyResult = await pool.query('SELECT id, brand, pattern, "Product Code" FROM tyres ORDER BY id');
    console.log(`✅ Database contains ${verifyResult.rows.length} tire records:`);
    verifyResult.rows.forEach(row => {
      console.log(`  [${row.id}] ${row.brand} ${row.pattern} (${row['Product Code']})`);
    });
    
    console.log('\n✅✅✅ SUCCESS! All tires imported successfully! ✅✅✅');
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ ERROR:', err.message);
    if (err.detail) console.error('Detail:', err.detail);
    await pool.end();
    process.exit(1);
  }
})();
