/**
 * Module Registry - the single source of truth for every subsidiary module
 * Zuri hosts (Meta -> Facebook/Instagram analogy).
 *
 * The platform reads which modules an organization has enabled
 * (platform.organization_modules) and conditionally mounts navigation +
 * routes from this registry. Keeping each module self-describing here is the
 * seam that lets a module be extracted into its own microservice later.
 */

export type ModuleId = "tyresync" | "gatepass" | "access" | "waybill";

export interface ModulePermission {
  /** Clerk permission key, e.g. "tyresync:read" */
  key: string;
  label: string;
}

export interface ModuleDefinition {
  id: ModuleId;
  name: string;
  description: string;
  /** Base path under an org subdomain, e.g. /tyresync */
  basePath: string;
  /** Postgres schema that holds this module's data */
  schema: string;
  /** Lucide icon name (resolved in nav components) */
  icon: string;
  /** Permissions assignable to org members for this module */
  permissions: ModulePermission[];
  /** Whether the module is generally available (vs coming soon) */
  available: boolean;
}

export const MODULES: Record<ModuleId, ModuleDefinition> = {
  tyresync: {
    id: "tyresync",
    name: "Tyre Sync",
    description: "Fleet tyre tracking, damage profiling, inspections and cost analysis.",
    basePath: "/tyresync",
    schema: "tyresync",
    icon: "Disc3",
    available: true,
    permissions: [
      { key: "tyresync:read", label: "View tyre data" },
      { key: "tyresync:inspect", label: "Create inspections" },
      { key: "tyresync:manage", label: "Manage tyre inventory & config" },
    ],
  },
  gatepass: {
    id: "gatepass",
    name: "Gate Pass",
    description: "Visitor pre-registration, QR passes, check-in/out and host approvals.",
    basePath: "/gatepass",
    schema: "gatepass",
    icon: "TicketCheck",
    available: false,
    permissions: [
      { key: "gatepass:view", label: "View gate passes" },
      { key: "gatepass:create", label: "Create gate passes" },
      { key: "gatepass:approve", label: "Approve gate passes" },
    ],
  },
  access: {
    id: "access",
    name: "Access Management",
    description: "On-depot access points, request/approval workflows and access logs.",
    basePath: "/access",
    schema: "access",
    icon: "DoorOpen",
    available: false,
    permissions: [
      { key: "access:request", label: "Request access" },
      { key: "access:approve", label: "Approve access requests" },
      { key: "access:manage", label: "Manage access points" },
    ],
  },
  waybill: {
    id: "waybill",
    name: "Waybill / POD",
    description: "Waybills, GPS tracking and electronic proof of delivery for transporters.",
    basePath: "/waybill",
    schema: "waybill",
    icon: "Truck",
    available: false,
    permissions: [
      { key: "waybill:track", label: "Track deliveries" },
      { key: "waybill:create", label: "Create waybills" },
      { key: "waybill:sign", label: "Capture proof of delivery" },
    ],
  },
};

export const MODULE_LIST: ModuleDefinition[] = Object.values(MODULES);

export function getModule(id: string): ModuleDefinition | undefined {
  return MODULES[id as ModuleId];
}

export function isModuleId(id: string): id is ModuleId {
  return id in MODULES;
}
