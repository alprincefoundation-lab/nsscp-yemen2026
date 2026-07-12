"use client";

import React, { useEffect, useState } from "react";
import { Role } from "@/lib/permissions";

interface RoleGateProps {
  /** Roles allowed to see the children */
  allowedRoles: Role[];
  /** Optional fallback UI when role is not authorized */
  fallback?: React.ReactNode;
  /** Children to render when role is authorized */
  children: React.ReactNode;
  /** Optional role override for static checks (skips API call) */
  role?: string;
}

/**
 * RoleGate — Client-side role-based gating component
 * 
 * Wraps children and only renders them if the current user
 * has one of the allowed roles. Uses /api/auth/me to fetch
 * user role, then checks against the allowedRoles array.
 * 
 * Usage:
 * ```tsx
 * <RoleGate allowedRoles={[Role.SUPER_ADMIN, Role.GOVERNORATE_ADMIN]}>
 *   <UserManagementPage />
 * </RoleGate>
 * ```
 */
export default function RoleGate({
  allowedRoles,
  fallback = null,
  children,
  role: staticRole,
}: RoleGateProps) {
  const [granted, setGranted] = useState<boolean | null>(null);

  useEffect(() => {
    if (staticRole) {
      setGranted(allowedRoles.includes(staticRole as Role));
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/auth/me", { credentials: "include" });
        if (!response.ok) {
          if (!cancelled) setGranted(false);
          return;
        }
        const data = await response.json();
        if (!cancelled && data.user) {
          setGranted(allowedRoles.includes(data.user.role));
        } else if (!cancelled) {
          setGranted(false);
        }
      } catch {
        if (!cancelled) setGranted(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [allowedRoles, staticRole]);

  // Still loading — render nothing
  if (granted === null) {
    return null;
  }

  if (!granted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}