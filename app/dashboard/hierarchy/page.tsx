"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";

interface HierarchyNode {
  id: string;
  name: string;
  type: string;
  code: string;
  parentId: string | null;
}

export default function HierarchyDashboard() {
  const [nodes, setNodes] = useState<HierarchyNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<HierarchyNode | null>(null);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [formType, setFormType] = useState('');
  const [formData, setFormData] = useState({ name: '', code: '' });

  useEffect(() => {
    fetchHierarchy();
  }, []);

  const fetchHierarchy = async () => {
    setLoading(true);
    const res = await fetch('/api/hierarchy');
    const json = await res.json();
    if (json.success) setNodes(json.data);
    setLoading(false);
  };

  const openAddModal = (type: string, typeLabel: string) => {
    if (!selectedNode && type !== 'MINISTRY') {
      alert('الرجاء اختيار الكيان الإداري الأب من شجرة العرض أولاً.');
      return;
    }
    setFormType(type);
    setNewTypeName(typeLabel);
    setFormData({ name: '', code: '' });
    setShowModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/hierarchy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        type: formType,
        parentId: selectedNode ? selectedNode.id : null,
      }),
    });
    const json = await res.json();
    if (json.success) {
      alert('تم إضافة السجل التنظيمي بنجاح وتوثيقه بسجلات الرقابة الأمنية.');
      setShowModal(false);
      fetchHierarchy();
    } else {
      alert(`فشل الإجراء: ${json.error}`);
    }
  };

  const renderTree = (parentId: string | null = null, depth = 0) => {
    return nodes
      .filter((n) => n.parentId === parentId)
      .map((node) => (
        <div key={node.id} style={{ marginRight: `${depth * 20}px` }} className="my-1">
          <div
            onClick={() => setSelectedNode(node)}
            className={`p-2.5 rounded border cursor-pointer transition-all flex justify-between items-center ${selectedNode?.id === node.id
                ? 'bg-emerald-950 text-white border-emerald-500 shadow-md'
                : 'bg-zinc-900 text-zinc-200 border-zinc-800 hover:border-zinc-700'
              }`}
          >
            <div>
              <span className="font-mono text-xs bg-black/50 px-1.5 py-0.5 rounded text-emerald-400 ml-2">
                {node.type}
              </span>
              <span className="text-sm font-medium">{node.name}</span>
            </div>
            <span className="text-xs text-zinc-500 font-mono">{node.code}</span>
          </div>
          {renderTree(node.id, depth + 1)}
        </div>
      ));
  };

  return (
    <div className="p-6 bg-black min-h-screen text-white" dir="rtl">
      <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-emerald-500">منظومة التحكم بالهيكل وبنية الكيانات السيادية</h1>
          <p className="text-xs text-zinc-400 mt-0.5">إدارة تراتبية وزارة الداخلية، قيادات المحافظات، المديريات، الأقسام، والإدارات الفرعية التابعة.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-zinc-950 p-4 rounded border border-zinc-800 space-y-2 h-fit">
          <h2 className="text-sm font-bold border-b border-zinc-800 pb-2 text-zinc-300">أدوات إلحاق وتوسيع الهيكل</h2>
          <div className="text-xs text-zinc-400 bg-zinc-900 p-2 rounded mb-2">
            الكيان الأب المحدد: <b className="text-emerald-400">{selectedNode ? selectedNode.name : 'الرجاء الاختيار من الشجرة'}</b>
          </div>
          <button onClick={() => openAddModal('PROVINCE', 'محافظة جديدة')} className="w-full text-right p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-xs transition-colors">➕ إضافة محافظة / قيادة محافظة</button>
          <button onClick={() => openAddModal('DISTRICT', 'مديرية جديدة')} className="w-full text-right p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-xs transition-colors">➕ إضافة مديرية أمنية</button>
          <button onClick={() => openAddModal('POLICE_STATION', 'قسم شرطة')} className="w-full text-right p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-xs transition-colors">➕ إضافة قسم شرطة / مركز</button>
          <button onClick={() => openAddModal('DEPARTMENT', 'إدارة')} className="w-full text-right p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-xs transition-colors">➕ إضافة إدارة متخصصة</button>
          <button onClick={() => openAddModal('SECTION', 'شعبة')} className="w-full text-right p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-xs transition-colors">➕ إضافة شعبة فرعية</button>
          <button onClick={() => openAddModal('UNIT', 'وحدة')} className="w-full text-right p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-xs transition-colors">➕ إضافة وحدة ميدانية صغرى</button>
        </div>

        <div className="lg:col-span-2 bg-zinc-950 p-4 rounded border border-zinc-800 max-h-[600px] overflow-y-auto">
          <h2 className="text-sm font-bold border-b border-zinc-800 pb-2 mb-3 text-zinc-300">الشجرة التنظيمية الحية للجمهورية</h2>
          {loading ? <div className="text-center py-4 text-zinc-500 text-xs">جاري جلب البنية التراتبية...</div> : <div>{renderTree(null)}</div>}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded max-w-sm w-full">
            <h3 className="text-base font-bold text-emerald-400 mb-3">إدراج {newTypeName}</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">الاسم الرسمي الكامل</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-black border border-zinc-800 rounded p-2 text-xs text-white focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">كود التعريف الإداري القياسي</label>
                <input type="text" required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="w-full bg-black border border-zinc-800 rounded p-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500" />
              </div>
              <div className="flex justify-start space-x-2 space-x-reverse pt-2 border-t border-zinc-800">
                <button type="submit" className="bg-emerald-700 hover:bg-emerald-600 px-4 py-1.5 rounded font-bold text-xs text-white">تأمين وحفظ السجل</button>
                <button type="button" onClick={() => setShowModal(false)} className="bg-zinc-800 px-3 py-1.5 rounded text-xs text-zinc-300">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
