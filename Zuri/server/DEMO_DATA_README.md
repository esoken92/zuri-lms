# Demo Data Seeding Instructions

This document provides instructions for running the demo data seeding script to populate the Zuri LMS database with sample data for client demonstrations.

## Prerequisites

1. **Supabase Account:** You must have a Supabase project set up for the Zuri LMS.
2. **Database Setup:** The base database schema must be installed (run `supabase-migration.sql` first).
3. **Supabase CLI (Optional):** If using the command-line method, install the Supabase CLI.

## Method 1: Supabase SQL Editor (Recommended)

This is the simplest method and requires no additional tools.

### Steps:

1. **Log in to Supabase Dashboard**
   - Navigate to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Sign in to your account
   - Select your Zuri LMS project

2. **Open SQL Editor**
   - In the left sidebar, click on "SQL Editor"
   - Click "New Query" to open a new query window

3. **Load the Script**
   - Open the `demo-data-seeding.sql` file from the `Zuri/server/` directory
   - Copy the entire contents of the file
   - Paste it into the SQL Editor window

4. **Run the Script**
   - Click the "Run" button (or press `Ctrl+Enter` / `Cmd+Enter`)
   - Wait for the script to complete execution
   - You should see a success message with the number of rows affected

5. **Verify the Data**
   - Check the "Table Editor" in Supabase to verify that the data has been inserted
   - Refer to `demo-credentials.md` for login credentials to test the demo accounts

## Method 2: Supabase CLI

If you prefer using the command line, you can use the Supabase CLI.

### Steps:

1. **Install Supabase CLI** (if not already installed)
   ```bash
   npm install -g supabase
   ```

2. **Link to Your Project**
   ```bash
   supabase link
   ```
   Follow the prompts to connect to your Supabase project.

3. **Run the Script**
   ```bash
   supabase db execute --file demo-data-seeding.sql
   ```

4. **Verify the Data**
   - Use the Supabase Dashboard or query the database directly to verify the data

## Method 3: psql Command Line

If you have direct database access via psql:

### Steps:

1. **Get Database Connection String**
   - From Supabase Dashboard: Project Settings > Database > Connection String
   - Copy the connection string (URI format)

2. **Run the Script**
   ```bash
   psql "postgresql://[user]:[password]@[host]:[port]/[database]" -f demo-data-seeding.sql
   ```

3. **Verify the Data**
   ```bash
   psql "postgresql://[user]:[password]@[host]:[port]/[database]" -c "SELECT COUNT(*) FROM users;"
   ```

## Troubleshooting

### Issue: "Relation does not exist" Error
**Cause:** The base database schema has not been installed.
**Solution:** Run the `supabase-migration.sql` script first to create the required tables.

### Issue: "Duplicate key value violates unique constraint"
**Cause:** The demo data has already been inserted.
**Solution:** The script uses `ON CONFLICT DO NOTHING` to handle duplicates, so this should not occur. If it does, you may need to manually clean up existing demo data.

### Issue: Permission Denied
**Cause:** Insufficient database permissions.
**Solution:** Ensure you are running the script as a database user with sufficient privileges (typically the project owner or a role with CREATE/INSERT permissions).

### Issue: Password Hash Mismatch
**Cause:** The bcrypt password hashes in the script may not match your authentication system.
**Solution:** The password hashes are generated using bcrypt (cost factor 10). If your system uses a different hashing algorithm, you will need to update the hashes accordingly.

## Cleaning Up Demo Data

To remove all demo data from the database, you can run the following SQL commands:

```sql
-- Delete in order of dependencies to avoid foreign key violations
DELETE FROM user_suggestions WHERE username LIKE 'demo%';
DELETE FROM activity_logs WHERE username LIKE 'demo%';
DELETE FROM scraps WHERE user_name LIKE 'demo%';
DELETE FROM inspections WHERE user_name LIKE 'demo%';
DELETE FROM users_extended WHERE email LIKE 'demo%@lms.com';
DELETE FROM users WHERE username LIKE 'demo%';
DELETE FROM stores WHERE code LIKE 'JHB%' OR code LIKE 'CPT%' OR code LIKE 'DBN%' OR code LIKE 'PTA%' OR code LIKE 'PE%' OR code LIKE 'EL%' OR code LIKE 'MTT%' OR code LIKE 'POL%' OR code LIKE 'MOK%' OR code LIKE 'NLP%' OR code LIKE 'WIT%' OR code LIKE 'SEC%' OR code LIKE 'STD%' OR code LIKE 'ERM%' OR code LIKE 'RUS%' OR code LIKE 'KLR%' OR code LIKE 'MAH%' OR code LIKE 'POT%' OR code LIKE 'BRT%' OR code LIKE 'BLM%' OR code LIKE 'BTH%' OR code LIKE 'WEL%' OR code LIKE 'KRO%' OR code LIKE 'SAS%' OR code LIKE 'KIM%' OR code LIKE 'UPN%' OR code LIKE 'KUR%' OR code LIKE 'SPB%' OR code LIKE 'DEA%';
DELETE FROM regions WHERE province_id IN (SELECT id FROM provinces WHERE country_id = (SELECT id FROM countries WHERE code = 'ZA'));
DELETE FROM provinces WHERE country_id = (SELECT id FROM countries WHERE code = 'ZA');
DELETE FROM depots WHERE company_id IN (SELECT id FROM companies WHERE name IN ('TransLogistics SA', 'FleetWise Solutions', 'HeavyHaul Transport', 'RoadMaster Logistics', 'QuickMove Freight'));
DELETE FROM companies WHERE name IN ('TransLogistics SA', 'FleetWise Solutions', 'HeavyHaul Transport', 'RoadMaster Logistics', 'QuickMove Freight');
DELETE FROM vehicle_configurations WHERE code IN ('6X4-TRUCK', '4X2-TRUCK', '8X4-TRUCK', 'TRAILER-2AXLE', 'TRAILER-3AXLE');
-- Note: Tyres are not deleted as they may be used by other data
```

## Verification

After running the script, verify the data by checking the following counts:

```sql
-- Verify user accounts
SELECT COUNT(*) FROM users WHERE username LIKE 'demo%';
-- Expected: 4

-- Verify geographic data
SELECT COUNT(*) FROM countries WHERE code = 'ZA';
-- Expected: 1

SELECT COUNT(*) FROM provinces WHERE country_id = (SELECT id FROM countries WHERE code = 'ZA');
-- Expected: 9

SELECT COUNT(*) FROM regions WHERE province_id IN (SELECT id FROM provinces WHERE country_id = (SELECT id FROM countries WHERE code = 'ZA'));
-- Expected: 45

SELECT COUNT(*) FROM stores;
-- Expected: 30 (including any existing stores)

-- Verify business data
SELECT COUNT(*) FROM companies WHERE name IN ('TransLogistics SA', 'FleetWise Solutions', 'HeavyHaul Transport', 'RoadMaster Logistics', 'QuickMove Freight');
-- Expected: 5

SELECT COUNT(*) FROM depots;
-- Expected: 15 (including any existing depots)

SELECT COUNT(*) FROM tyres;
-- Expected: 20 (including any existing tyres)

SELECT COUNT(*) FROM vehicle_configurations WHERE code IN ('6X4-TRUCK', '4X2-TRUCK', '8X4-TRUCK', 'TRAILER-2AXLE', 'TRAILER-3AXLE');
-- Expected: 5

-- Verify activity data
SELECT COUNT(*) FROM inspections WHERE user_name LIKE 'demo%';
-- Expected: 20

SELECT COUNT(*) FROM scraps WHERE user_name LIKE 'demo%';
-- Expected: 15

SELECT COUNT(*) FROM activity_logs WHERE username LIKE 'demo%';
-- Expected: 30

SELECT COUNT(*) FROM user_suggestions WHERE username LIKE 'demo%';
-- Expected: 10
```

## Next Steps

1. **Test the Demo Accounts:** Use the credentials in `demo-credentials.md` to log in and verify each account works correctly.
2. **Explore the Data:** Navigate through the application to ensure all demo data is accessible and displays correctly.
3. **Customize as Needed:** Modify the demo data to better match your client's industry or use case.
4. **Document Changes:** If you make any modifications to the demo data, update this documentation accordingly.

## Support

For issues or questions regarding the demo data seeding process, please refer to the main project documentation or contact the development team.
