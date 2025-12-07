const { pool } = require('./src/config/database');
const bcrypt = require('bcrypt');

/**
 * Seeds the database with development/test data
 * Run with: npm run seed:dev
 */
async function seedDevelopmentData() {
  try {
    console.log('🌱 Seeding development data...');

    // Create test users
    const testUsers = [
      {
        username: 'admin',
        password: 'admin123',
        role: 'Administrator',
        email: 'admin@zuri.com',
        first_name: 'System',
        last_name: 'Administrator'
      },
      {
        username: 'inspector',
        password: 'inspect123',
        role: 'Inspector',
        email: 'inspector@zuri.com',
        first_name: 'John',
        last_name: 'Inspector'
      },
      {
        username: 'manager',
        password: 'manage123',
        role: 'Group Manager',
        email: 'manager@zuri.com',
        first_name: 'Jane',
        last_name: 'Manager'
      }
    ];

    for (const user of testUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 10);

      await pool.query(`
        INSERT INTO users (
          username, password_hash, role, email, first_name, last_name,
          is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        ON CONFLICT (username) DO NOTHING
      `, [
        user.username,
        hashedPassword,
        user.role,
        user.email,
        user.first_name,
        user.last_name,
        true
      ]);

      console.log(`✅ Created user: ${user.username} (${user.role})`);
    }

    // Create sample companies
    const companies = [
      { name: 'ABC Logistics', phone: '+27 21 123 4567', email: 'info@abclogistics.co.za' },
      { name: 'TireCorp SA', phone: '+27 11 987 6543', email: 'contact@tirecorp.co.za' },
      { name: 'FleetMasters', phone: '+27 31 555 0123', email: 'support@fleetmasters.co.za' }
    ];

    for (const company of companies) {
      await pool.query(`
        INSERT INTO companies (name, phone, email, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        ON CONFLICT (name) DO NOTHING
      `, [company.name, company.phone, company.email]);

      console.log(`✅ Created company: ${company.name}`);
    }

    // Create sample depots
    const depots = [
      { location: 'Cape Town Depot', company_name: 'ABC Logistics' },
      { location: 'Johannesburg Hub', company_name: 'TireCorp SA' },
      { location: 'Durban Warehouse', company_name: 'FleetMasters' }
    ];

    for (const depot of depots) {
      await pool.query(`
        INSERT INTO depots (location, company_id, created_at, updated_at)
        SELECT $1, id, NOW(), NOW() FROM companies WHERE name = $2
        ON CONFLICT (location) DO NOTHING
      `, [depot.location, depot.company_name]);

      console.log(`✅ Created depot: ${depot.location}`);
    }

    console.log('🎉 Development data seeded successfully!');
    console.log('\n📋 Test Accounts:');
    testUsers.forEach(user => {
      console.log(`   ${user.username}: ${user.password} (${user.role})`);
    });

  } catch (error) {
    console.error('❌ Error seeding development data:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  seedDevelopmentData();
}

module.exports = { seedDevelopmentData };