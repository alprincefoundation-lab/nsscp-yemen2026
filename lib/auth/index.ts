import type { NextRequest } from "next/server";
import { getUserFromRequest } from "./require-auth";
import type { AuthenticatedUser } from "./auth.types";

/**
 * Core Authentication Module — NSSCP Platform
 *
 * This module provides ONLY core authentication functions:
 * - Password hashing and verification (bcrypt)
 * - Role validation helpers
 * - User validation helpers
 * - getAuthenticatedUser / requireAuth
 *
 * NO session management (see ./session-manager.ts)
 * NO middleware logic (see ../../middleware.ts)
 * NO JWT signing/verification (see ../jwt.ts)
 */

import bcrypt from 'bcryptjs';
import { Role } from '@/lib/permissions';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PASSWORD HASHING & VERIFICATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Hash a password using bcrypt with 12 rounds
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
}

/**
 * Verify a password against its hash
 * @param password - Plain text password to verify
 * @param hashedPassword - Previously hashed password
 * @returns true if password matches, false otherwise
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ROLE VALIDATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Check if a role is valid
 * @param role - Role string to validate
 * @returns true if role is valid
 */
export function isValidRole(role: string): boolean {
    return Object.values(Role).includes(role as Role);
}

/**
 * Check if user has one of the allowed roles
 * @param userRole - User's current role
 * @param allowedRoles - Array of allowed roles
 * @returns true if user role is in allowed roles
 */
export function hasRole(userRole: string, allowedRoles: string[]): boolean {
    return allowedRoles.includes(userRole);
}

/**
 * Check if user is SUPER_ADMIN
 * @param role - User's role
 * @returns true if role is SUPER_ADMIN
 */
export function isSuperAdmin(role: string): boolean {
    return role === Role.SUPER_ADMIN;
}

/**
 * Check if user can manage other users
 * @returns true if user can manage users
 */
export function canManageUsers(role: string): boolean {
    return [Role.SUPER_ADMIN, Role.GOVERNORATE_ADMIN].includes(role as Role);
}

/**
 * Check if user can manage hierarchy
 * @returns true if user can manage hierarchy
 */
export function canManageHierarchy(role: string): boolean {
    return [Role.SUPER_ADMIN, Role.GOVERNORATE_ADMIN].includes(role as Role);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// USER VALIDATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Validate username format
 * @param username - Username to validate
 * @returns true if username is valid
 */
export function isValidUsername(username: string): boolean {
    // Username must be 3-50 characters, alphanumeric with underscores
    const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
    return usernameRegex.test(username);
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns { valid: boolean, errors: string[] }
 */
export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (password.length < 8) {
        errors.push('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل');
    }
    if (!/[0-9]/.test(password)) {
        errors.push('كلمة المرور يجب أن تحتوي على رقم واحد على الأقل');
    }
    if (!/[@$!%*?&#]/.test(password)) {
        errors.push('كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل (@$!%*?&#)');
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Validate email format
 * @param email - Email to validate
 * @returns true if email is valid
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HIERARCHY ACCESS HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Check if user has access to a specific hierarchy entity
 * SUPER_ADMIN can access all entities
 * @param userRole - User's role
 * @param userHierarchyId - User's hierarchy entity ID
 * @param targetHierarchyId - Target hierarchy entity ID
 * @returns true if user has access
 */
export function hasHierarchyAccess(
    userRole: string,
    userHierarchyId: string | null | undefined,
    targetHierarchyId: string
): boolean {
    if (isSuperAdmin(userRole)) return true;
    return userHierarchyId === targetHierarchyId;
}

/**
 * Get data filter for Prisma queries based on user scope
 * @returns Prisma where clause filter
 */
export function getDataFilter(userRole: string, userHierarchyId?: string | null): Record<string, unknown> {
    if (isSuperAdmin(userRole)) {
        return {}; // No filter - can see everything
    }
    if (userHierarchyId) {
        return { hierarchyEntityId: userHierarchyId };
    }
    return {}; // Fallback to no filter (should be restricted by other means)
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AUTHENTICATED USER RESOLUTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Resolve the currently authenticated user from a NextRequest.
 * Returns null when no valid session/token is present.
 */
export async function getAuthenticatedUser(
    request?: NextRequest
): Promise<AuthenticatedUser | null> {
    const user = await getUserFromRequest(request);
    if (!user) {
        return null;
    }
    return user as AuthenticatedUser;
}

/**
 * Require an authenticated user or throw an error.
 */
export async function requireAuth(
    request?: NextRequest
): Promise<AuthenticatedUser> {
    const user = await getAuthenticatedUser(request);
    if (!user) {
        throw new Error("Unauthorized");
    }
    return user;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXPORTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type { Role } from '@/lib/permissions';
export type { AuthenticatedUser } from './auth.types';
