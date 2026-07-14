import { NextRequest } from "next/server";
import { headers, cookies } from "next/headers";
import type { AuthenticatedUser } from "./auth.types";
import { getSession } from "./session-manager";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken, resolveOfficerHierarchyContext } from "@/lib/auth";

/**
 * PRODUCTION AUTH RESOLVER — NSSCP Final Security Hardening
 *
 * Authenticated user resolution is ALWAYS derived from:
 *   1. Session token (nsscp_session cookie) — preferred path
 *   2. JWT Bearer token (Authorization header) — fallback
 *
 * NEVER trusts:
 *   - x-hierarchy-* headers (removed — severe impersonation risk)
 *   - client-supplied user IDs
 *   - client-supplied department IDs
 */
export async function getUserFromRequest(
  req?: NextRequest
): Promise<AuthenticatedUser | null> {
  try {
    // 1. From request cookies (NextRequest)
    let token: string | null = null;
    if (req) {
      token = req.cookies.get("nsscp_session")?.value ?? null;
    }

    // 2. From next/headers cookies
    if (!token) {
      try {
        const cookieStore = await cookies();
        token = cookieStore.get("nsscp_session")?.value ?? null;
      } catch {
        token = null;
      }
    }

    // 3. From Authorization header (JWT bearer)
    if (!token) {
      let authHeader: string | null = null;
      if (req) {
        authHeader = req.headers.get("authorization") ?? null;
      }
      if (!authHeader) {
        try {
          const headerList = await headers();
          authHeader = headerList.get("authorization") ?? null;
        } catch {
          authHeader = null;
        }
      }
      if (authHeader) {
        const parts = authHeader.split(" ");
        if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
          token = parts[1];
        }
      }
    }

    if (!token) return null;

    // Try session first, then JWT
    const session = await getSession(token);
    let userId = session?.userId ?? null;
    let hierarchyEntityId = session?.hierarchyEntityId ?? null;
    let hierarchyEntityName = session?.hierarchyEntityName ?? null;
    let hierarchyEntityType = session?.hierarchyEntityType ?? null;

    if (!userId) {
      const decoded = verifyAccessToken(token);
      if (!decoded) {
        return null;
      }
      userId = decoded.id;
      hierarchyEntityId = decoded.hierarchyEntityId ?? hierarchyEntityId;
      hierarchyEntityName = decoded.hierarchyEntityName ?? hierarchyEntityName;
      hierarchyEntityType = decoded.hierarchyEntityType ?? hierarchyEntityType;
    }

    if (!userId) {
      return null;
    }

    const officer = await prisma.officer.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        role: true,
        rank: true,
        department: true,
      },
    });

    if (!officer) return null;

    const resolvedHierarchy = hierarchyEntityId
      ? {
          hierarchyEntityId,
          hierarchyEntityName,
          hierarchyEntityType,
        }
      : await resolveOfficerHierarchyContext(officer.id);

    return {
      id: officer.id,
      role: officer.role,
      username: officer.name,
      hierarchyEntityId: resolvedHierarchy.hierarchyEntityId ?? undefined,
      hierarchyEntityName: resolvedHierarchy.hierarchyEntityName ?? undefined,
      hierarchyEntityType: resolvedHierarchy.hierarchyEntityType ?? undefined,
      fullName: officer.name,
      rank: officer.rank,
      badgeNumber: officer.id,
    };
  } catch (err) {
    console.error("[Auth Resolver Error]:", err);
    return null;
  }
}
