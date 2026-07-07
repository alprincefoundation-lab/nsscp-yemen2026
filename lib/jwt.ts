/**
 * JWT utility functions for authentication
 * Provides signing, verification, and cookie management
 * 
 * SECURITY: JWT_SECRET must be set via environment variable.
 * No hardcoded fallback is permitted in any environment.
 */

import jwt from 'jsonwebtoken';

/**
 * Retrieve the JWT secret with strict runtime validation.
 * Throws if JWT_SECRET is not configured, preventing accidental
 * use of default/hardcoded secrets in production.
 */
function getSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error(
            'FATAL: JWT_SECRET environment variable is not configured. ' +
            'Authentication cannot function without a secure secret.'
        );
    }
    return secret;
}

export interface JwtPayload {
    id: string;
    username: string;
    role: string;
    fullName?: string;
    hierarchyEntityId?: string;
    hierarchyEntityName?: string;
    hierarchyEntityType?: string;
    badgeNumber?: string;
    rank?: string;
}

export function signToken(payload: JwtPayload): string {
    return jwt.sign(payload, getSecret(), { expiresIn: '24h' });
}

export function verifyToken(token: string): JwtPayload | null {
    try {
        return jwt.verify(token, getSecret()) as JwtPayload;
    } catch {
        return null;
    }
}

export function decodeToken(token: string): JwtPayload | null {
    try {
        return jwt.decode(token) as JwtPayload;
    } catch {
        return null;
    }
}

export function getTokenExpiration(): number {
    return 60 * 60 * 24; // 24 hours in seconds
}

export function isTokenExpired(payload: JwtPayload & { exp?: number }): boolean {
    if (!payload.exp) return true;
    return Date.now() >= payload.exp * 1000;
}