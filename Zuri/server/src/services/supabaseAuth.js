const { supabase, supabaseAdmin } = require('../config/supabase');

/**
 * Supabase Auth Service
 * Handles authentication operations using Supabase Auth
 */

class SupabaseAuthService {
  /**
   * Sign up a new user
   */
  async signUp(email, password, userData = {}) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });

      if (error) throw error;

      // Create user record in custom users table
      if (data.user) {
        const { pool } = require('../config/database');
        const useSupabase = process.env.USE_SUPABASE === 'true' || process.env.NODE_ENV === 'production';
        
        if (useSupabase) {
          await pool.query(
            `INSERT INTO users (id, username, email, role) 
             VALUES ($1, $2, $3, $4) 
             ON CONFLICT (email) DO UPDATE SET username = $2`,
            [data.user.id, userData.username || email.split('@')[0], email, userData.role || 'User']
          );
        }
      }

      return { success: true, data };
    } catch (error) {
      console.error('[SUPABASE_AUTH] Sign up error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sign in a user
   */
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Get user role from custom users table
      let userRole = 'User';
      if (data.user) {
        const { pool } = require('../config/database');
        const useSupabase = process.env.USE_SUPABASE === 'true' || process.env.NODE_ENV === 'production';
        
        if (useSupabase) {
          const result = await pool.query(
            'SELECT role FROM users WHERE id = $1',
            [data.user.id]
          );
          if (result.rows.length > 0) {
            userRole = result.rows[0].role;
          }
        }
      }

      return { 
        success: true, 
        data: {
          ...data,
          user: data.user ? { ...data.user, role: userRole } : null
        }
      };
    } catch (error) {
      console.error('[SUPABASE_AUTH] Sign in error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sign out a user
   */
  async signOut(accessToken) {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('[SUPABASE_AUTH] Sign out error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current user from token
   */
  async getUser(accessToken) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(accessToken);
      
      if (error) throw error;
      
      // Get user role from custom users table
      if (user) {
        const { pool } = require('../config/database');
        const useSupabase = process.env.USE_SUPABASE === 'true' || process.env.NODE_ENV === 'production';
        
        if (useSupabase) {
          const result = await pool.query(
            'SELECT * FROM users WHERE id = $1',
            [user.id]
          );
          if (result.rows.length > 0) {
            return { ...user, ...result.rows[0] };
          }
        }
      }

      return user;
    } catch (error) {
      console.error('[SUPABASE_AUTH] Get user error:', error);
      return null;
    }
  }

  /**
   * Verify JWT token
   */
  async verifyToken(accessToken) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(accessToken);
      
      if (error || !user) {
        return null;
      }

      // Get user role from custom users table
      const { pool } = require('../config/database');
      const useSupabase = process.env.USE_SUPABASE === 'true' || process.env.NODE_ENV === 'production';
      
      if (useSupabase) {
        const result = await pool.query(
          'SELECT * FROM users WHERE id = $1',
          [user.id]
        );
        if (result.rows.length > 0) {
          return { ...user, ...result.rows[0] };
        }
      }

      return user;
    } catch (error) {
      console.error('[SUPABASE_AUTH] Verify token error:', error);
      return null;
    }
  }

  /**
   * Update user role (admin only)
   */
  async updateUserRole(userId, newRole) {
    try {
      const { pool } = require('../config/database');
      const useSupabase = process.env.USE_SUPABASE === 'true' || process.env.NODE_ENV === 'production';
      
      if (useSupabase) {
        await pool.query(
          'UPDATE users SET role = $1 WHERE id = $2',
          [newRole, userId]
        );
      }

      return { success: true };
    } catch (error) {
      console.error('[SUPABASE_AUTH] Update role error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new SupabaseAuthService();
