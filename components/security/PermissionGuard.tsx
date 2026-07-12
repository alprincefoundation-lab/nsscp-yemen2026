"use client";

import React, { useEffect, useState } from "react";
import { Permission, hasPermission as checkPermission } from "@/lib/permissions";

interface PermissionGuardProps {
  /** The required permission to render children */
  permission: Permission;
  /** Optional fallback UI to show when permission is denied */
  fallback?: React.ReactNode;
  /** Children to render when permission is granted */
  children: React.ReactNode;
  /** Optional role override for static checks (skips API call) */
  role?: string;
}

/**
 * PermissionGuard — Client-side RBAC component
 * 
 * Wraps children and only renders them if the current user
 * has the required permission. Uses /api/auth/me to fetch
 * user role, then checks against the Permission enum.
 * 
 * Usage:
 * ```tsx
 * <PermissionGuard permission={Permission.CREATE_WANTED}>
 *   <CreateWantedButton />
 * </PermissionGuard>
 * ```
 */
export default function PermissionGuard({
  permission,
  fallback = null,
  children,
  role: staticRole,
}: PermissionGuardProps) {
  const [granted, setGranted] = useState<boolean | null>(null);

  useEffect(() => {
    if (staticRole) {
      setGranted(checkPermission(staticRole, permission));
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
          setGranted(checkPermission(data.user.role, permission));
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
  }, [permission, staticRole]);

  // Still loading — render nothing (or a subtle loader)
  if (granted === null) {
    return null;
  }

  if (!granted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}