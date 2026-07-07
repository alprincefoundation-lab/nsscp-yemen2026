"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { RBACGuard, showToast } from "../components/rbac-ui";
import { SkeletonTable } from "../components/skeleton-table";

interface User {
  id: string;
  username: string;
  fullName: string;
  militaryNumber: string;
  rank: string;
  position: string;
  role: { id: string; name: string };
  status: "ACTIVE" | "SUSPENDED";
  province: string;
  department: string;
}

interface Role {
  id: string;
  name: string;
}

export default function UsersDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ id: string; action: "TOGGLE" | "DELETE"; currentStatus?: string } | null>(null);

  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    militaryNumber: "",
    rank: "",
    position: "",
    province: "",
    department: "",
    password: "",
    roleId: "",
  });

  const GOVERNORATES = ["عدن", "صنعاء", "تعز", "حضرموت", "لحج", "أبين", "الحديدة", "مأرب", "شبوة"];

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsers(data);
    } catch {
      showToast("خطأ أثناء جلب بيانات المستخدمين", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch("/api/roles");
      if (res.ok) {
        const data = await res.json();
        setRoles(data);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [fetchUsers, fetchRoles]);

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingUser ? `/api/users?id=${editingUser.id}` : "/api/users";
    const method = editingUser ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error();
      showToast(editingUser ? "تم تحديث البيانات بنجاح" : "تم إنشاء المستخدم بنجاح", "success");
      setIsCreateOpen(false);
      setEditingUser(null);
      resetForm();
      fetchUsers();
    } catch {
      showToast("فشلت العملية، يرجى التحقق من البيانات والاتصال بالخادم", "error");
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: "ACTIVE" | "SUSPENDED") => {
    const nextStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      const res = await fetch(`/api/users`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      if (!res.ok) throw new Error();
      showToast("تم تغيير حالة الحساب بنجاح", "success");
      setConfirmModal(null);
      fetchUsers();
    } catch {
      showToast("فشل تعديل حالة حساب المستخدم", "error");
    }
  };

  const resetForm = () => {
    setFormData({
      username: "",
      fullName: "",
      militaryNumber: "",
      rank: "",
      position: "",
      province: "",
      department: "",
      password: "",
      roleId: "",
    });
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      fullName: user.fullName,
      militaryNumber: user.militaryNumber,
      rank: user.rank,
      position: user.position,
      province: user.province,
      department: user.department,
      password: "",
      roleId: user.role?.id || "",
    });
    setIsCreateOpen(true);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.militaryNumber.includes(search);
    const matchesRole = roleFilter ? u.role?.id === roleFilter : true;
    const matchesProvince = provinceFilter ? u.province === provinceFilter : true;
    return matchesSearch && matchesRole && matchesProvince;
  });

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* الهيدر الرئيسي */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة النظم والمعلومات - المستخدمين</h1>
          <p className="text-sm text-gray-500">التحكم وضبط حسابات القوات والضباط المسجلين في المنصة الأمنية الذكية الموحدة.</p>
        </div>
        <RBACGuard permission="manage_users">
          <button
            onClick={() => { resetForm(); setEditingUser(null); setIsCreateOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm"
          >
            إضافة مستخدم عسكري جديد +
          </button>
        </RBACGuard>
      </div>

      {/* أدوات التصفية والبحث الفوري */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <input
          type="text"
          placeholder="البحث بالاسم الكامل، اسم المستخدم أو الرقم العسكري..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full px-3 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">كل الرتب/الصلاحيات</option>
          {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <select
          value={provinceFilter}
          onChange={(e) => setProvinceFilter(e.target.value)}
          className="w-full px-3 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">كل المحافظات</option>
          {GOVERNORATES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* جدول عرض البيانات وعمليات الإدارة */}
      {loading ? (
        <SkeletonTable />
      ) : filteredUsers.length === 0 ? (
        <div className="text-center p-12 bg-white border rounded-xl text-gray-500">لا يوجد مستخدمين مطابقين لمعايير البحث الحالية.</div>
      ) : (
        <div className="bg-white border rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b">
              <tr>
                <th className="p-4">الاسم الكامل / الرتبة</th>
                <th className="p-4">اسم المستخدم</th>
                <th className="p-4">الرقم العسكري</th>
                <th className="p-4">المحافظة والإدارة</th>
                <th className="p-4">الصلاحية</th>
                <th className="p-4">الحالة</th>
                <th className="p-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition">
                  <td className="p-4">
                    <div className="font-semibold text-gray-900">{user.fullName}</div>
                    <div className="text-xs text-gray-400">{user.rank} - {user.position}</div>
                  </td>
                  <td className="p-4 text-gray-600 font-mono">{user.username}</td>
                  <td className="p-4 text-gray-700">{user.militaryNumber}</td>
                  <td className="p-4">
                    <span className="text-gray-900 font-medium">{user.province}</span>
                    <span className="text-xs text-gray-400 block">{user.department}</span>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 text-xs font-semibold rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                      {user.role?.name || "بدون دور"}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-md ${user.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}>
                      {user.status === "ACTIVE" ? "نشط" : "موقوف"}
                    </span>
                  </td>
                  <td className="p-4 text-center space-x-2 space-x-reverse">
                    <button
                      onClick={() => openEditModal(user)}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => setConfirmModal({ id: user.id, action: "TOGGLE", currentStatus: user.status })}
                      className={`${user.status === "ACTIVE" ? "text-amber-600 hover:text-amber-800" : "text-emerald-600 hover:text-emerald-800"
                        } text-xs font-medium`}
                    >
                      {user.status === "ACTIVE" ? "تجميد الحساب" : "تنشيط"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* النافذة المنبثقة: إنشاء / تعديل بيانات المستخدم */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border max-w-2xl w-full p-6 space-y-4 my-8">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">
              {editingUser ? "تعديل بيانات المستخدم العسكري" : "إضافة مستخدم عسكري جديد للمنصة"}
            </h3>
            <form onSubmit={handleCreateOrUpdate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">الاسم الكامل</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">اسم المستخدم (المعرف العسكري)</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">الرقم العسكري</label>
                <input
                  type="text"
                  required
                  value={formData.militaryNumber}
                  onChange={(e) => setFormData({ ...formData, militaryNumber: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">الرتبة العسكرية</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مقدم، نقيب، ملازم"
                  value={formData.rank}
                  onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">المنصب</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مدير قسم تقنية المعلومات"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">المحافظة</label>
                <select
                  required
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">اختر المحافظة...</option>
                  {GOVERNORATES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">الإدارة العامة / الوحدة</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: إدارة البحث الجنائي"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">مجموعة الصلاحيات (Role)</label>
                <select
                  required
                  value={formData.roleId}
                  onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">اختر مصفوفة الصلاحيات...</option>
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  كلمة المرور {editingUser && "(اترك الحقل فارغاً إذا كنت لا تريد التغيير)"}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="sm:col-span-2 flex justify-end gap-2 pt-2 border-t mt-4">
                <button
                  type="button"
                  onClick={() => { setIsCreateOpen(false); setEditingUser(null); }}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-sm"
                >
                  {editingUser ? "حفظ التعديلات" : "إنشاء الحساب الفوري"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* النافذة المنبثقة: تأكيد التجميد أو التنشيط الأمني */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border max-w-sm w-full p-6 space-y-4 text-center animate-fadeIn">
            <h3 className="text-lg font-bold text-gray-900">تأكيد الإجراء الأمني المباشر</h3>
            <p className="text-sm text-gray-500">
              هل أنت متأكد من تغيير حالة هذا الحساب؟ الإجراء قد يقطع صلاحيات الوصول ومزامنة البيانات للضابط في نفس اللحظة.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                تراجع
              </button>
              <button
                onClick={() => handleToggleStatus(confirmModal.id, confirmModal.currentStatus as "ACTIVE" | "SUSPENDED")}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition shadow-sm"
              >
                تأكيد وبث الأمر
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
