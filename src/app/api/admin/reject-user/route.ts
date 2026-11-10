import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function POST(request: NextRequest) {
  try {
    const { userId, adminId, reason } = await request.json()

    if (!userId || !adminId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify the requesting user is an admin
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', adminId)
      .single()

    if (adminError || !adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Reject the user
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        approval_status: 'rejected',
        approved_by: adminId,
        approved_at: new Date().toISOString(),
        rejection_reason: reason
      })
      .eq('id', userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
