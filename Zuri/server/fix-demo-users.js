const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '../client-new/.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

// Initialize with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
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

async function fixDemoUsers() {
  console.log('Fixing demo users in Supabase Auth...')
  console.log('Using URL:', supabaseUrl)

  for (const user of demoUsers) {
    try {
      console.log(`\nProcessing ${user.email}...`)

      // Check if user exists in auth.users
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', user.email)

      if (checkError) {
        console.error(`Failed to check user ${user.email}:`, checkError.message)
        continue
      }

      let userId

      if (existingUsers && existingUsers.length > 0) {
        userId = existingUsers[0].id
        console.log(`User ${user.email} exists with ID: ${userId}`)

        // Update password using admin API
        const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
          password: user.password,
          email_confirm: true
        })

        if (updateError) {
          console.error(`Failed to update user ${user.email}:`, updateError.message)
        } else {
          console.log(`Updated password and confirmed email for ${user.email}`)
        }
      } else {
        // Create new user using admin API
        console.log(`Creating user ${user.email}...`)
        const { data: authData, error: createError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: { role: user.role }
        })

        if (createError) {
          console.error(`Failed to create user ${user.email}:`, createError.message)
          continue
        }

        userId = authData.user?.id
        console.log(`Created user ${user.email} with ID: ${userId}`)
      }

      if (!userId) {
        console.error(`No user ID for ${user.email}`)
        continue
      }

      // Update custom users table
      const { error: userError } = await supabase
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
        console.log(`Upserted user ${user.email} in custom table`)
      }

    } catch (error) {
      console.error(`Error processing ${user.email}:`, error.message)
    }
  }

  console.log('\nDemo users fix complete!')
  console.log('\nTest login credentials:')
  console.log('demoAdmin@lms.com / DemoAdmin123')
  console.log('demoManager@lms.com / DemoManager123')
  console.log('demoInspector@lms.com / DemoInspector123')
  console.log('demoUser@lms.com / DemoUser123')
}

fixDemoUsers().catch(console.error)
