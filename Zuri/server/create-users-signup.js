const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '../client-new/.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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
  console.log('Creating demo users via Supabase Auth signup...')
  console.log('Using URL:', supabaseUrl)

  for (const user of demoUsers) {
    try {
      console.log(`\nCreating: ${user.email}`)
      
      const { data, error } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: { role: user.role }
        }
      })

      if (error) {
        console.error(`Failed to create ${user.email}:`, error.message)
      } else {
        console.log(`Success: Created user with ID ${data.user?.id}`)
      }
    } catch (error) {
      console.error(`Error creating ${user.email}:`, error.message)
    }
    
    // Wait 5 seconds between each user to avoid rate limits
    console.log('Waiting 5 seconds...')
    await new Promise(resolve => setTimeout(resolve, 5000))
  }

  console.log('\nDone creating users via signup.')
}

createDemoUsers().catch(console.error)
