export interface User {
  id: string
  username: string
  email: string
  role: 'inspector' | 'manager' | 'admin'
  first_name?: string
  last_name?: string
  phone?: string
  country_id?: string
  province_id?: string
  region_id?: string
  store_id?: string
  branch?: string
  security_question_1?: string
  security_answer_1?: string
  security_question_2?: string
  security_answer_2?: string
  approval_status?: 'pending' | 'approved' | 'rejected'
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
  created_at: string
  updated_at: string
  countries?: { name: string }
  provinces?: { name: string }
  regions?: { name: string }
  stores?: { name: string; branch_code: string }
}

export interface Country {
  id: string
  name: string
  code: string
  dialling_code: string
  is_sadc: boolean
  priority: number
}

export interface Province {
  id: string
  name: string
  country_id: string
  code: string
}

export interface Region {
  id: string
  name: string
  code: string
  description?: string
}

export interface Store {
  id: string
  name: string
  code: string
  branch_code: string
  address?: string
  country_id?: string
  province_id?: string
  region_id?: string
  contact_person?: string
  phone?: string
  email?: string
  is_active?: boolean
}

export interface ActivityLog {
  id: string
  user_id: string
  action: string
  entity_type?: string
  entity_id?: string
  details?: Record<string, unknown>
  created_at: string
  users?: {
    username: string
    first_name?: string
    last_name?: string
    email: string
  }
}
