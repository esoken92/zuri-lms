import { useMemo } from 'react';
import { 
  hasPermission, 
  hasAnyPermission, 
  hasAllPermissions,
  isAdmin,
  isAdminOrManager,
  isManager,
  getFeatureFlags,
  PERMISSIONS,
  ROLES 
} from '../utils/rolePermissions';

/**
 * Custom hook for role-based access control
 * Provides permission checking utilities and feature flags
 * 
 * @param {Object} user - User object with role property
 * @returns {Object} RBAC utilities and feature flags
 */
export const useRBAC = (user) => {
  const features = useMemo(() => getFeatureFlags(user), [user]);

  return useMemo(() => ({
    // User info
    user,
    hasUser: !!user,
    role: user?.role,

    // Role checks
    isAdmin: isAdmin(user),
    isAdminOrManager: isAdminOrManager(user),
    isManager: isManager(user),

    // Permission checks
    hasPermission: (permission) => hasPermission(user, permission),
    hasAnyPermission: (permissions) => hasAnyPermission(user, permissions),
    hasAllPermissions: (permissions) => hasAllPermissions(user, permissions),

    // Specific feature checks
    canSuggestData: features.canSuggestData,
    canApproveSuggestions: features.canApproveSuggestions,
    canViewAdminDashboard: features.showAdminDashboard,
    canViewUserManagement: features.showUserManagement,
    canViewDatabaseManagement: features.showDatabaseManagement,
    canViewActivityLog: features.showActivityLog,
    canCreateInspection: features.canCreateInspection,
    canCreateScrapReport: features.canCreateScrapReport,
    canViewAllReports: features.canViewAllReports,
    canViewTeamReports: features.canViewTeamReports,
    canViewOwnReports: features.canViewOwnReports,
    canEditOwnInspection: features.canEditOwnInspection,
    canDeleteInspections: features.canDeleteInspections,

    // All features flag object
    features,

    // Constants
    PERMISSIONS,
    ROLES,
  }), [user, features]);
};

export default useRBAC;
