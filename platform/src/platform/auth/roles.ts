/**
 * RBAC constants. Clerk Organizations provide the membership + roles;
 * these constants keep role/permission strings consistent across the app.
 */

// Organization-scoped roles (assigned within a Clerk org)
export const ORG_ROLES = {
  ADMIN: "org:admin",
  MANAGER: "org:manager",
  MEMBER: "org:member",
  BILLING_MANAGER: "org:billing_manager",
} as const;

export type OrgRole = (typeof ORG_ROLES)[keyof typeof ORG_ROLES];

// Platform-level role for Zuri staff/devs (cross-org oversight).
// Stored on the Clerk user's public metadata: { platformAdmin: true }
export const PLATFORM_ADMIN_METADATA_KEY = "platformAdmin";

// Cross-cutting permissions (module permissions live in the module registry)
export const PLATFORM_PERMISSIONS = {
  BILLING_MANAGE: "billing:manage",
} as const;
