"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { RBACGuard, showToast } from "../components/rbac-ui";
import { SkeletonTable } from "../components/skeleton-table";

export default function RolesDashboard() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/roles");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setRoles(data);
    } catch {
      showToast("خطأ أثناء سحب البيانات", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return (
    <RBACGuard permission="manage_roles">
      <div className="p-6 space-y-6 text-right" dir="rtl">
        <h1 className="text-2xl font-bold">إدارة الأدوار</h1>
        {loading ? (
          <SkeletonTable />
        ) : (
          <div className="bg-white border rounded-xl shadow-sm overflow-x-auto">
            <p>محتوى الأدوار سيظهر هنا</p>
          </div>
        )}
      </div>
    </RBACGuard>
  );
}
