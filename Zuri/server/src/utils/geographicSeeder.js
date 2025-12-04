const isProduction = process.env.NODE_ENV === 'production';

let db;
if (!isProduction) {
  // SQLite for development
  const { db: sqliteDb } = require('../config/database');
  db = sqliteDb;
} else {
  // PostgreSQL for production
  const { pool } = require('../config/database');
  db = pool;
}

// Seed geographic data for user management system
const seedGeographicData = async () => {
  try {
    console.log('[GEO_SEED] Starting geographic data seeding...');

    // Check if countries table is empty
    let countriesCount;
    if (!isProduction) {
      countriesCount = await new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM countries', (err, row) => {
          if (err) reject(err);
          else resolve(row.count);
        });
      });
    } else {
      const result = await db.query('SELECT COUNT(*) as count FROM countries');
      countriesCount = result.rows[0].count;
    }

    if (countriesCount > 0) {
      console.log('[GEO_SEED] Countries already seeded, skipping...');
      return;
    }

    // SADC countries (prioritized as per roadmap)
    const sadcCountries = [
      { name: 'South Africa', code: 'ZA', is_sadc: 1 },
      { name: 'Botswana', code: 'BW', is_sadc: 1 },
      { name: 'Namibia', code: 'NA', is_sadc: 1 },
      { name: 'Zimbabwe', code: 'ZW', is_sadc: 1 },
      { name: 'Mozambique', code: 'MZ', is_sadc: 1 },
      { name: 'Angola', code: 'AO', is_sadc: 1 },
      { name: 'Malawi', code: 'MW', is_sadc: 1 },
      { name: 'Zambia', code: 'ZM', is_sadc: 1 },
      { name: 'Tanzania', code: 'TZ', is_sadc: 1 },
      { name: 'Swaziland', code: 'SZ', is_sadc: 1 },
      { name: 'Lesotho', code: 'LS', is_sadc: 1 },
      { name: 'Madagascar', code: 'MG', is_sadc: 1 },
      { name: 'Mauritius', code: 'MU', is_sadc: 1 },
      { name: 'Seychelles', code: 'SC', is_sadc: 1 },
      { name: 'Democratic Republic of Congo', code: 'CD', is_sadc: 1 },
      { name: 'Comoros', code: 'KM', is_sadc: 1 }
    ];

    // Additional African countries
    const otherAfricanCountries = [
      { name: 'Kenya', code: 'KE', is_sadc: 0 },
      { name: 'Uganda', code: 'UG', is_sadc: 0 },
      { name: 'Rwanda', code: 'RW', is_sadc: 0 },
      { name: 'Burundi', code: 'BI', is_sadc: 0 },
      { name: 'Ethiopia', code: 'ET', is_sadc: 0 },
      { name: 'Somalia', code: 'SO', is_sadc: 0 },
      { name: 'Djibouti', code: 'DJ', is_sadc: 0 },
      { name: 'Eritrea', code: 'ER', is_sadc: 0 },
      { name: 'Sudan', code: 'SD', is_sadc: 0 },
      { name: 'South Sudan', code: 'SS', is_sadc: 0 },
      { name: 'Egypt', code: 'EG', is_sadc: 0 },
      { name: 'Libya', code: 'LY', is_sadc: 0 },
      { name: 'Tunisia', code: 'TN', is_sadc: 0 },
      { name: 'Algeria', code: 'DZ', is_sadc: 0 },
      { name: 'Morocco', code: 'MA', is_sadc: 0 },
      { name: 'Western Sahara', code: 'EH', is_sadc: 0 },
      { name: 'Mauritania', code: 'MR', is_sadc: 0 },
      { name: 'Mali', code: 'ML', is_sadc: 0 },
      { name: 'Niger', code: 'NE', is_sadc: 0 },
      { name: 'Chad', code: 'TD', is_sadc: 0 },
      { name: 'Central African Republic', code: 'CF', is_sadc: 0 },
      { name: 'Cameroon', code: 'CM', is_sadc: 0 },
      { name: 'Equatorial Guinea', code: 'GQ', is_sadc: 0 },
      { name: 'Gabon', code: 'GA', is_sadc: 0 },
      { name: 'Republic of Congo', code: 'CG', is_sadc: 0 },
      { name: 'Nigeria', code: 'NG', is_sadc: 0 },
      { name: 'Benin', code: 'BJ', is_sadc: 0 },
      { name: 'Togo', code: 'TG', is_sadc: 0 },
      { name: 'Ghana', code: 'GH', is_sadc: 0 },
      { name: 'Côte d\'Ivoire', code: 'CI', is_sadc: 0 },
      { name: 'Liberia', code: 'LR', is_sadc: 0 },
      { name: 'Sierra Leone', code: 'SL', is_sadc: 0 },
      { name: 'Guinea', code: 'GN', is_sadc: 0 },
      { name: 'Guinea-Bissau', code: 'GW', is_sadc: 0 },
      { name: 'Gambia', code: 'GM', is_sadc: 0 },
      { name: 'Senegal', code: 'SN', is_sadc: 0 },
      { name: 'Cape Verde', code: 'CV', is_sadc: 0 },
      { name: 'Burkina Faso', code: 'BF', is_sadc: 0 },
      { name: 'Somaliland', code: 'XX', is_sadc: 0 }
    ];

    const allCountries = [...sadcCountries, ...otherAfricanCountries];

    // Seed countries
    if (!isProduction) {
      // SQLite
      for (const country of allCountries) {
        await new Promise((resolve, reject) => {
          db.run(
            'INSERT OR IGNORE INTO countries (name, code, is_sadc) VALUES (?, ?, ?)',
            [country.name, country.code, country.is_sadc],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }
    } else {
      // PostgreSQL
      for (const country of allCountries) {
        await db.query(
          'INSERT INTO countries (name, code, is_sadc) VALUES ($1, $2, $3) ON CONFLICT (code) DO NOTHING',
          [country.name, country.code, country.is_sadc]
        );
      }
    }

    console.log(`[GEO_SEED] Seeded ${allCountries.length} countries (${sadcCountries.length} SADC countries prioritized)`);

    // Seed provinces for South Africa (as primary example)
    const southAfricanProvinces = [
      { name: 'Western Cape', code: 'WC', country_code: 'ZA' },
      { name: 'Eastern Cape', code: 'EC', country_code: 'ZA' },
      { name: 'Northern Cape', code: 'NC', country_code: 'ZA' },
      { name: 'Free State', code: 'FS', country_code: 'ZA' },
      { name: 'KwaZulu-Natal', code: 'KZN', country_code: 'ZA' },
      { name: 'North West', code: 'NW', country_code: 'ZA' },
      { name: 'Gauteng', code: 'GP', country_code: 'ZA' },
      { name: 'Mpumalanga', code: 'MP', country_code: 'ZA' },
      { name: 'Limpopo', code: 'LP', country_code: 'ZA' }
    ];

    // Get South Africa country ID
    let zaCountryId;
    if (!isProduction) {
      zaCountryId = await new Promise((resolve, reject) => {
        db.get('SELECT id FROM countries WHERE code = ?', ['ZA'], (err, row) => {
          if (err) reject(err);
          else resolve(row ? row.id : null);
        });
      });
    } else {
      const result = await db.query('SELECT id FROM countries WHERE code = $1', ['ZA']);
      zaCountryId = result.rows[0]?.id;
    }

    if (zaCountryId) {
      if (!isProduction) {
        // SQLite
        for (const province of southAfricanProvinces) {
          await new Promise((resolve, reject) => {
            db.run(
              'INSERT OR IGNORE INTO provinces (name, code, country_id) VALUES (?, ?, ?)',
              [province.name, province.code, zaCountryId],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          });
        }
      } else {
        // PostgreSQL
        for (const province of southAfricanProvinces) {
          await db.query(
            'INSERT INTO provinces (name, code, country_id) VALUES ($1, $2, $3) ON CONFLICT (name, country_id) DO NOTHING',
            [province.name, province.code, zaCountryId]
          );
        }
      }

      console.log(`[GEO_SEED] Seeded ${southAfricanProvinces.length} South African provinces`);
    }

    console.log('[GEO_SEED] Geographic data seeding completed successfully');

  } catch (err) {
    console.error('[GEO_SEED] Error seeding geographic data:', err);
    throw err;
  }
};

module.exports = {
  seedGeographicData
};