"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";

interface RBACGuardProps {
  permission: "manage_users" | "manage_roles" | "manage_permissions";
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function RBACGuard({ permission, fallback = null, children }: RBACGuardProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) throw new Error();
        const data = await res.json();
        const permissions: string[] = data.permissions || [];
        setHasPermission(permissions.includes(permission) || permissions.includes("SUPER_ADMIN"));
      } catch {
        setHasPermission(false);
      }
    }
    checkAuth();
  }, [permission]);

  if (hasPermission === null) {
    return <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>;
  }

  return hasPermission ? <>{children}</> : <>{fallback}</>;
}

export function showToast(message: string, type: "success" | "error") {
  const toast = document.createElement("div");
  toast.className = `fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-lg text-white font-medium shadow-lg transition-all transform translate-y-0 duration-300 ${
    type === "success" ? "bg-emerald-600" : "bg-rose-600"
  }`;
  toast.innerText = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-y-2");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
