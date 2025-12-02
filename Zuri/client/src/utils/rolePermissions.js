/**
 * Role-Based Access Control (RBAC) utility
 * Defines permissions for different user roles
 */

export const ROLES = {
  ADMINISTRATOR: 'Administrator',
  GROUP_MANAGER: 'Group Manager',
  STORE_MANAGER: 'Store Manager',
  EMPLOYEE: 'Employee'
};

export const PERMISSIONS = {
  // Admin-only features
  ACCESS_ADMIN_DASHBOARD: 'ACCESS_ADMIN_DASHBOARD',
  MANAGE_USERS: 'MANAGE_USERS',
  MANAGE_COMPANIES: 'MANAGE_COMPANIES',
  MANAGE_DEPOTS: 'MANAGE_DEPOTS',
  MANAGE_TYRES: 'MANAGE_TYRES',
  MANAGE_VEHICLE_CONFIG: 'MANAGE_VEHICLE_CONFIG',
  VIEW_ALL_REPORTS: 'VIEW_ALL_REPORTS',
  DELETE_INSPECTIONS: 'DELETE_INSPECTIONS',
  APPROVE_SUGGESTIONS: 'APPROVE_SUGGESTIONS',
  VIEW_ACTIVITY_LOG: 'VIEW_ACTIVITY_LOG',

  // Manager features
  VIEW_TEAM_REPORTS: 'VIEW_TEAM_REPORTS',
  MANAGE_TEAM_DATA: 'MANAGE_TEAM_DATA',

  // All users
  CREATE_INSPECTION: 'CREATE_INSPECTION',
  CREATE_SCRAP_REPORT: 'CREATE_SCRAP_REPORT',
  VIEW_OWN_REPORTS: 'VIEW_OWN_REPORTS',
  SUGGEST_DATA: 'SUGGEST_DATA',
  EDIT_OWN_INSPECTION: 'EDIT_OWN_INSPECTION',
};

/**
 * Role to Permissions mapping
 */
export const rolePermissions = {
  [ROLES.ADMINISTRATOR]: [
    PERMISSIONS.ACCESS_ADMIN_DASHBOARD,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_COMPANIES,
    PERMISSIONS.MANAGE_DEPOTS,
    PERMISSIONS.MANAGE_TYRES,
    PERMISSIONS.MANAGE_VEHICLE_CONFIG,
    PERMISSIONS.VIEW_ALL_REPORTS,
    PERMISSIONS.DELETE_INSPECTIONS,
    PERMISSIONS.APPROVE_SUGGESTIONS,
    PERMISSIONS.VIEW_ACTIVITY_LOG,
    PERMISSIONS.CREATE_INSPECTION,
    PERMISSIONS.CREATE_SCRAP_REPORT,
    PERMISSIONS.VIEW_OWN_REPORTS,
    PERMISSIONS.SUGGEST_DATA,
    PERMISSIONS.EDIT_OWN_INSPECTION,
  ],
  [ROLES.GROUP_MANAGER]: [
    PERMISSIONS.ACCESS_ADMIN_DASHBOARD,
    PERMISSIONS.MANAGE_TEAM_DATA,
    PERMISSIONS.VIEW_TEAM_REPORTS,
    PERMISSIONS.APPROVE_SUGGESTIONS,
    PERMISSIONS.VIEW_ACTIVITY_LOG,
    PERMISSIONS.CREATE_INSPECTION,
    PERMISSIONS.CREATE_SCRAP_REPORT,
    PERMISSIONS.VIEW_OWN_REPORTS,
    PERMISSIONS.SUGGEST_DATA,
    PERMISSIONS.EDIT_OWN_INSPECTION,
  ],
  [ROLES.STORE_MANAGER]: [
    PERMISSIONS.VIEW_TEAM_REPORTS,
    PERMISSIONS.CREATE_INSPECTION,
    PERMISSIONS.CREATE_SCRAP_REPORT,
    PERMISSIONS.VIEW_OWN_REPORTS,
    PERMISSIONS.SUGGEST_DATA,
    PERMISSIONS.EDIT_OWN_INSPECTION,
  ],
  [ROLES.EMPLOYEE]: [
    PERMISSIONS.CREATE_INSPECTION,
    PERMISSIONS.CREATE_SCRAP_REPORT,
    PERMISSIONS.VIEW_OWN_REPORTS,
    PERMISSIONS.SUGGEST_DATA,
    PERMISSIONS.EDIT_OWN_INSPECTION,
  ],
};

/**
 * Check if user has a specific permission
 * @param {Object} user - User object with role property
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
export function hasPermission(user, permission) {
  if (!user || !user.role) return false;
  const userPermissions = rolePermissions[user.role] || [];
  return userPermissions.includes(permission);
}

/**
 * Check if user has any of the specified permissions
 * @param {Object} user - User object
 * @param {Array<string>} permissions - Array of permissions to check
 * @returns {boolean}
 */
export function hasAnyPermission(user, permissions) {
  return permissions.some(permission => hasPermission(user, permission));
}

/**
 * Check if user has all of the specified permissions
 * @param {Object} user - User object
 * @param {Array<string>} permissions - Array of permissions to check
 * @returns {boolean}
 */
export function hasAllPermissions(user, permissions) {
  return permissions.every(permission => hasPermission(user, permission));
}

/**
 * Check if user is admin or group manager
 * @param {Object} user - User object
 * @returns {boolean}
 */
export function isAdmin(user) {
  return user?.role === ROLES.ADMINISTRATOR;
}

/**
 * Check if user is admin or group manager
 * @param {Object} user - User object
 * @returns {boolean}
 */
export function isAdminOrManager(user) {
  return user?.role === ROLES.ADMINISTRATOR || user?.role === ROLES.GROUP_MANAGER;
}

/**
 * Check if user has at least manager role
 * @param {Object} user - User object
 * @returns {boolean}
 */
export function isManager(user) {
  return [ROLES.ADMINISTRATOR, ROLES.GROUP_MANAGER, ROLES.STORE_MANAGER].includes(user?.role);
}

/**
 * Get feature availability based on user role
 * @param {Object} user - User object
 * @returns {Object} Feature flags
 */
export function getFeatureFlags(user) {
  return {
    // Admin-only features
    showAdminDashboard: isAdmin(user),
    showUserManagement: isAdmin(user),
    showDatabaseManagement: isAdmin(user),
    showActivityLog: isAdminOrManager(user),

    // Suggestion system - all users can suggest, only managers can approve
    canSuggestData: hasPermission(user, PERMISSIONS.SUGGEST_DATA),
    canApproveSuggestions: hasPermission(user, PERMISSIONS.APPROVE_SUGGESTIONS),

    // Reporting
    canViewAllReports: hasPermission(user, PERMISSIONS.VIEW_ALL_REPORTS),
    canViewTeamReports: hasPermission(user, PERMISSIONS.VIEW_TEAM_REPORTS),
    canViewOwnReports: hasPermission(user, PERMISSIONS.VIEW_OWN_REPORTS),

    // Inspection operations
    canCreateInspection: hasPermission(user, PERMISSIONS.CREATE_INSPECTION),
    canCreateScrapReport: hasPermission(user, PERMISSIONS.CREATE_SCRAP_REPORT),
    canEditOwnInspection: hasPermission(user, PERMISSIONS.EDIT_OWN_INSPECTION),
    canDeleteInspections: hasPermission(user, PERMISSIONS.DELETE_INSPECTIONS),

    // Data management
    canManageCompanies: hasPermission(user, PERMISSIONS.MANAGE_COMPANIES),
    canManageDepots: hasPermission(user, PERMISSIONS.MANAGE_DEPOTS),
    canManageTyres: hasPermission(user, PERMISSIONS.MANAGE_TYRES),
    canManageVehicleConfig: hasPermission(user, PERMISSIONS.MANAGE_VEHICLE_CONFIG),
    canManageTeamData: hasPermission(user, PERMISSIONS.MANAGE_TEAM_DATA),
  };
}

export default {
  ROLES,
  PERMISSIONS,
  rolePermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isAdmin,
  isAdminOrManager,
  isManager,
  getFeatureFlags,
};
