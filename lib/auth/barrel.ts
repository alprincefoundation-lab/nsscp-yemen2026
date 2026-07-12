/**
 * Unified Auth Module Barrel — NSSCP Platform
 * 
 * Single import point for all authentication and authorization functions.
 * 
 * Usage:
 * import { requireAuth, hasPermission, createRBACContext, isSuperAdmin } from '@/lib/auth/barrel';
 */

// Core authentication
export {
  hashPassword,
  verifyPassword,
  isValidRole,
  hasRole,
  isSuperAdmin,
  canManageUsers,
  canManageHierarchy,
  isValidUsername,
  validatePasswordStrength,
  isValidEmail,
  hasHierarchyAccess,
  getDataFilter,
  getAuthenticatedUser,
  requireAuth,
} from './index';

// Types
export type { AuthenticatedUser } from './auth.types';

// RBAC Engine
export {
  hasPermission,
  canAccessHierarchyNode,
  withDualVerification,
  createRBACContext,
  resolvePermission,
} from './rbac';
export type { RBACContext, PermissionCheck, DualVerificationResult } from './rbac';
export type { Action, Resource } from './rbac';

// Session Management
export {
  createSession,
  getSession,
  validateSession,
  revokeSession,
  revokeAllUserSessions,
  getUserSessions,
  extendSession,
  invalidateSession,
  cleanupExpiredSessions,
  getActiveSessionCount,
} from './session-manager';
export type { SessionData, CreateSessionOptions } from './session-manager';

// Permissions
export {
  Role,
  Permission,
  hasPermission as hasRolePermission,
  hasAllPermissions,
  hasAnyPermission,
  getRolePermissions,
  hasSufficientLevel,
  canManageHierarchy as canManageHierarchyPerm,
  getDataScope,
  ROLE_ARABIC_NAMES,
  ROLE_LEVELS,
} from '../permissions';