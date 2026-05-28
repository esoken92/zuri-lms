require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addAdminUser() {
  try {
    console.log('Adding admin user...');
    
    const { data, error } = await supabase
      .from('users')
      .upsert({
        username: 'admin',
        password_hash: '$2b$10$/WUYkEdghV0TfnvN24JS.uhITLomHV2nWQ7Qvtniz.8yBgipP9.L2',
        role: 'Administrator',
        email: 'admin@zuri.com',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'username'
      });

    if (error) {
      console.error('Error adding admin user:', error);
      process.exit(1);
    }

    console.log('✅ Admin user added successfully!');
    console.log('Username: admin');
    console.log('Password: admin');
    console.log('Role: Administrator');
    process.exit(0);
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

addAdminUser();
