/**
 * Single Source of Truth — Authentication Types
 *
 * This file is the ONLY place in the project that defines AuthenticatedUser.
 * All other modules MUST import it from here.
 */

export type AuthenticatedUser = {
  id: string;
  username: string;
  role: string;
  badgeNumber?: string;
  rank?: string;
  fullName?: string;
  hierarchyEntityId?: string;
  hierarchyEntityName?: string;
  hierarchyEntityType?: string;
};

export type Role = string;
