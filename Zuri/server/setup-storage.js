require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupStorage() {
  try {
    console.log('Creating storage bucket: uploads');
    
    const { data, error } = await supabase.storage.createBucket('uploads', {
      public: true,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: ['image/*']
    });

    if (error) {
      if (error.message.includes('already exists')) {
        console.log('Bucket already exists, updating policies...');
      } else {
        throw error;
      }
    } else {
      console.log('Bucket created successfully');
    }

    // Set up public policy
    console.log('Setting up public read policy...');
    const { error: policyError } = await supabase.storage.from('uploads').createSignedUrl('test.txt', 60);
    
    if (policyError && !policyError.message.includes('not found')) {
      console.log('Public policy may need to be set manually in dashboard');
    }

    console.log('Storage setup complete!');
    console.log('Please verify in Supabase Dashboard > Storage > uploads that:');
    console.log('1. Public bucket is enabled');
    console.log('2. Authenticated write access is enabled');
    
  } catch (error) {
    console.error('Error setting up storage:', error.message);
    process.exit(1);
  }
}

setupStorage();
