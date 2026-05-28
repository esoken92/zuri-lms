const { supabase } = require('../config/supabase');

/**
 * Supabase Storage Service
 * Handles file uploads to Supabase Storage
 */

class SupabaseStorageService {
  /**
   * Upload a file to Supabase Storage
   */
  async uploadFile(file, bucket = 'uploads', folder = '') {
    try {
      const fileName = `${folder}${Date.now()}-${file.originalname}`;
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return {
        success: true,
        path: fileName,
        url: publicUrl
      };
    } catch (error) {
      console.error('[SUPABASE_STORAGE] Upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete a file from Supabase Storage
   */
  async deleteFile(fileName, bucket = 'uploads') {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([fileName]);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('[SUPABASE_STORAGE] Delete error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(fileName, bucket = 'uploads') {
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);
    
    return publicUrl;
  }
}

module.exports = new SupabaseStorageService();
