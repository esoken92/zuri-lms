const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '../client-new/.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

// Initialize with anon key for auth operations
const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Initialize with service role key for database operations (bypasses RLS)
const supabaseDb = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const demoUsers = [
  { email: 'demoAdmin@lms.com', password: 'DemoAdmin123', username: 'demoAdmin', role: 'Administrator' },
  { email: 'demoManager@lms.com', password: 'DemoManager123', username: 'demoManager', role: 'Management' },
  { email: 'demoInspector@lms.com', password: 'DemoInspector123', username: 'demoInspector', role: 'Inspector' },
  { email: 'demoUser@lms.com', password: 'DemoUser123', username: 'demoUser', role: 'User' }
]

async function createDemoUsers() {
  console.log('Creating demo users in Supabase Auth...')
  console.log('Using URL:', supabaseUrl)

  for (const user of demoUsers) {
    try {
      console.log(`\nProcessing ${user.email}...`)

      // Check if user already exists in custom users table (using service role to bypass RLS)
      const { data: existingUser } = await supabaseDb
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single()

      let userId

      if (existingUser) {
        console.log(`User ${user.email} already exists in custom table with ID: ${existingUser.id}`)
        userId = existingUser.id
      } else {
        // Create new auth user using signUp
        console.log(`Creating auth user ${user.email}...`)
        const { data: authData, error: authError } = await supabaseAuth.auth.signUp({
          email: user.email,
          password: user.password,
          options: {
            data: { role: user.role }
          }
        })

        if (authError) {
          console.error(`Failed to create auth user ${user.email}:`, authError.message)
          continue
        }

        userId = authData.user?.id
        console.log(`Created auth user ${user.email} with ID: ${userId}`)
      }

      if (!userId) {
        console.error(`No user ID for ${user.email}`)
        continue
      }

      // Update or create user in custom users table (using service role to bypass RLS)
      const { error: userError } = await supabaseDb
        .from('users')
        .upsert({
          id: userId,
          username: user.username,
          role: user.role,
          email: user.email,
          approval_status: 'approved',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })

      if (userError) {
        console.error(`Failed to upsert user ${user.email}:`, userError.message)
      } else {
        console.log(`Upserted user ${user.email} in custom table with approval_status='approved'`)
      }

    } catch (error) {
      console.error(`Error processing ${user.email}:`, error.message)
    }
  }

  console.log('\nDemo users creation complete!')
  console.log('\nTest login credentials:')
  console.log('demoAdmin@lms.com / DemoAdmin123')
  console.log('demoManager@lms.com / DemoManager123')
  console.log('demoInspector@lms.com / DemoInspector123')
  console.log('demoUser@lms.com / DemoUser123')
}

createDemoUsers().catch(console.error)
