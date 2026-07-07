import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { headers, cookies } from "next/headers";
import type { AuthenticatedUser } from "./auth.types";

/**
 * Normalize headers into plain object
 */
function normalizeHeaders(h: Headers) {
  const obj: Record<string, string> = {};
  h.forEach((value, key) => {
    obj[key.toLowerCase()] = value;
  });
  return obj;
}

/**
 * Build user from headers
 */
function buildUser(h: Record<string, string>): AuthenticatedUser | null {
  if (!h["x-hierarchy-user-id"]) return null;

  return {
    id: h["x-hierarchy-user-id"],
    role: h["x-hierarchy-role"] || "user",
    username: h["x-hierarchy-username"] || "",
    hierarchyEntityId: h["x-hierarchy-entity-id"],
    hierarchyEntityName: h["x-hierarchy-entity-name"]
      ? decodeURIComponent(h["x-hierarchy-entity-name"])
      : undefined,
    hierarchyEntityType: h["x-hierarchy-entity-type"],
    fullName: h["x-hierarchy-fullname"]
      ? decodeURIComponent(h["x-hierarchy-fullname"])
      : undefined,
  };
}

/**
 * Main Auth Resolver (SAFE VERSION)
 */
export async function getUserFromRequest(
  req?: NextRequest
): Promise<AuthenticatedUser | null> {
  try {
    // 1. From request headers
    if (req) {
      const user = buildUser(normalizeHeaders(req.headers));
      if (user) return user;
    }

    // 2. From next/headers
    const headerList = await headers();
    const userFromHeaders = buildUser(normalizeHeaders(headerList));
    if (userFromHeaders) return userFromHeaders;

    // 3. From cookies JWT fallback
    const cookieStore = await cookies();
    const token = cookieStore.get("nsscp_session")?.value;

    if (!token) return null;

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as any;

    return {
      id: decoded.id,
      role: decoded.role,
      username: decoded.username,
      hierarchyEntityId: decoded.hierarchyEntityId,
      hierarchyEntityName: decoded.hierarchyEntityName,
      hierarchyEntityType: decoded.hierarchyEntityType,
      fullName: decoded.fullName,
    };
  } catch (err) {
    console.error("[Auth Resolver Error]:", err);
    return null;
  }
}
