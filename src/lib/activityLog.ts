import { supabase } from './supabase'

export async function logActivity(
  action: string,
  entityType?: string,
  entityId?: string,
  details?: any
) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    const { error } = await supabase.rpc('log_activity', {
      p_user_id: user.id,
      p_action: action,
      p_entity_type: entityType || null,
      p_entity_id: entityId || null,
      p_details: details || null
    })

    if (error) {
      console.error('Failed to log activity:', error)
    }
  } catch (error) {
    console.error('Error logging activity:', error)
  }
}

export async function getActivityLogs(limit: number = 100) {
  const { data, error } = await supabase
    .from('activity_logs')
    .select(`
      *,
      users (username, first_name, last_name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching activity logs:', error)
    return []
  }

  return data || []
}

export async function getUserActivityLogs(userId: string, limit: number = 50) {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching user activity logs:', error)
    return []
  }

  return data || []
}
