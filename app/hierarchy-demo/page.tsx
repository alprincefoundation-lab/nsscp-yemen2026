"use client";

import { useState } from 'react';
import {
    Shield, MapPin, Users, LayoutDashboard,
    FileText, Radio, Database, ChevronRight,
    UserCheck, AlertTriangle, Building2, Layers
} from 'lucide-react';

// المحافظات الـ 22 الاستراتيجية
const GOVERNORATES = [
    { name: 'أمانة العاصمة', code: 'SAN' }, { name: 'عدن', code: 'ADE' },
    { name: 'صنعاء', code: 'SNA' }, { name: 'تعز', code: 'TAZ' },
    { name: 'الحديدة', code: 'HUD' }, { name: 'حضرموت', code: 'HDM' },
    { name: 'إب', code: 'IBB' }, { name: 'ذمار', code: 'ZHA' },
    { name: 'شبوة', code: 'SHW' }, { name: 'أبين', code: 'ABY' },
    { name: 'لحج', code: 'LAH' }, { name: 'صعدة', code: 'SAD' },
    { name: 'حجة', code: 'HAG' }, { name: 'عمران', code: 'AMR' },
    { name: 'البيضاء', code: 'BAY' }, { name: 'مأرب', code: 'MAR' },
    { name: 'المحويت', code: 'MAW' }, { name: 'الجوف', code: 'JAW' },
    { name: 'المهرة', code: 'MAH' }, { name: 'الضالع', code: 'DHL' },
    { name: 'سقطرى', code: 'SOT' }, { name: 'ريمة', code: 'RAY' }
];

// شجرة الهيكل التنظيمي والعملياتي الـ 19
const HIERARCHY_SECTIONS = [
    { id: '1', name: 'مركز العمليات والاتصال الحي' },
    { id: '2', name: 'السيطرة والتوجيه العملياتي' },
    { id: '3', name: 'إدارة السيطرة الجغرافية والخرائط' },
    { id: '4', name: 'منظومة الرقابة المرئية والكاميرات' },
    { id: '5', name: 'التحليل والتقييم الأمني المستمر' },
    { id: '6', name: 'إدارة تكنولوجيا المعلومات والاتصالات' },
    { id: '7', name: 'إدارة الأمن السيبراني وحماية البيانات' },
    { id: '8', name: 'إدارة التنسيق والربط المشترك' },
    { id: '9', name: 'إدارة البنية التحتية البرمجية للمنصة' },
    { id: '10', name: 'الأمن الوقائي وحماية المنشآت' },
    { id: '11', name: 'السجل المدني وبوابات الهوية' },
    { id: '12', name: 'الأدلة الجنائية والبحث الرقمي' },
    { id: '13', name: 'مكافحة المخدرات والتهريب عبر الحدود' },
    { id: '14', name: 'أمن المطارات والمنافذ السيادية' },
    { id: '15', name: 'التقارير الإحصائية والجنائية الدورية' },
    { id: '16', name: 'الدفاع المدني وإدارة الطوارئ والأزمات' },
    { id: '17', name: 'السجون والإصلاحيات والرقابة القانونية' },
    { id: '18', name: 'القطاع الخاص وحماية المنشآت الحيوية' },
    { id: '19', name: 'البوابة الرئيسية لتسجيل المراجعين' }
];

export default function TacticalDashboard() {
    const [selectedGov, setSelectedGov] = useState('ADE'); // عدن كافتراضي
    const [activeTab, setActiveTab] = useState('operations');
    const [showAddModal, setShowAddModal] = useState(false);

    return (
        <div className="min-h-screen bg-[#0b0f14] text-gray-100 font-sans border-t-4 border-[#00ff66]">
            {/* الشريط العلوي السيادي */}
            <header className="bg-[#11161d] border-b border-gray-800 px-6 py-4 flex justify-between items-center shadow-2xl">
                <div className="flex items-center space-x-3 space-x-reverse">
                    <Shield className="h-8 w-8 text-[#00ff66] animate-pulse" />
                    <div>
                        <h1 className="text-xl font-black tracking-wider text-white">NSSCP | منظومة القيادة الوطنية الشاملة</h1>
                        <p className="text-xs text-gray-400">مركز القيادة والسيطرة الاستراتيجية الموحد</p>
                    </div>
                </div>

                <div className="flex items-center space-x-6 space-x-reverse">
                    <div className="bg-[#17202a] px-4 py-2 rounded border border-gray-800 text-right">
                        <span className="text-xs text-gray-400 block">الضابط المسؤول</span>
                        <span className="text-sm font-bold text-[#00ff66]">عقيد/ أحمد محمد عبدالله</span>
                    </div>
                    <div className="bg-[#1c1212] px-4 py-2 rounded border border-red-900/50 text-right">
                        <span className="text-xs text-red-400 block">المستوى التكتيكي</span>
                        <span className="text-sm font-bold text-red-500">1 - الرقابة المركزية العليا</span>
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* القائمة الجانبية السيادية السبع */}
                <aside className="w-72 bg-[#11161d] border-l border-gray-800 min-h-[calc(100vh-73px)] p-4 flex flex-col justify-between">
                    <div className="space-y-2">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider px-3 mb-3">المهام السيادية العليا</div>

                        <button onClick={() => setActiveTab('operations')} className={`w-full flex items-center space-x-3 space-x-reverse px-4 py-3 rounded transition-all ${activeTab === 'operations' ? 'bg-[#00ff66]/10 text-[#00ff66] border-r-4 border-[#00ff66]' : 'hover:bg-gray-800 text-gray-400'}`}>
                            <LayoutDashboard className="h-5 w-5" />
                            <span className="font-medium text-sm">مركز القيادة والسيطرة</span>
                        </button>

                        <button onClick={() => setActiveTab('personnel')} className={`w-full flex items-center space-x-3 space-x-reverse px-4 py-3 rounded transition-all ${activeTab === 'personnel' ? 'bg-[#00ff66]/10 text-[#00ff66] border-r-4 border-[#00ff66]' : 'hover:bg-gray-800 text-gray-400'}`}>
                            <Users className="h-5 w-5" />
                            <span className="font-medium text-sm">إدارة القوى البشرية والضباط</span>
                        </button>

                        <button onClick={() => setActiveTab('records')} className={`w-full flex items-center space-x-3 space-x-reverse px-4 py-3 rounded transition-all ${activeTab === 'records' ? 'bg-[#00ff66]/10 text-[#00ff66] border-r-4 border-[#00ff66]' : 'hover:bg-gray-800 text-gray-400'}`}>
                            <FileText className="h-5 w-5" />
                            <span className="font-medium text-sm">الملاحة الجنائية والمطلوبين</span>
                        </button>

                        <button onClick={() => setActiveTab('comms')} className={`w-full flex items-center space-x-3 space-x-reverse px-4 py-3 rounded transition-all ${activeTab === 'comms' ? 'bg-[#00ff66]/10 text-[#00ff66] border-r-4 border-[#00ff66]' : 'hover:bg-gray-800 text-gray-400'}`}>
                            <Radio className="h-5 w-5" />
                            <span className="font-medium text-sm">الاتصال الحي والإشارات</span>
                        </button>

                        <button onClick={() => setActiveTab('database')} className={`w-full flex items-center space-x-3 space-x-reverse px-4 py-3 rounded transition-all ${activeTab === 'database' ? 'bg-[#00ff66]/10 text-[#00ff66] border-r-4 border-[#00ff66]' : 'hover:bg-gray-800 text-gray-400'}`}>
                            <Database className="h-5 w-5" />
                            <span className="font-medium text-sm">قواعد البيانات والربط الفوري</span>
                        </button>
                    </div>

                    <div className="bg-[#17202a] p-4 rounded border border-gray-800">
                        <div className="flex items-center space-x-2 space-x-reverse text-xs text-[#00ff66] mb-1">
                            <span className="h-2 w-2 rounded-full bg-[#00ff66] animate-ping"></span>
                            <span className="font-mono">NSSCP LIVE TRACKING</span>
                        </div>
                        <p className="text-[11px] text-gray-400">النظام متصل بالقمر الاصطناعي وبوابات المحافظات بشكل آمن.</p>
                    </div>
                </aside>

                {/* مساحة العرض المركزية */}
                <main className="flex-1 p-6 space-y-6">
                    {/* قسم الامتداد الجغرافي الـ 22 محافظة */}
                    <section className="bg-[#11161d] p-4 rounded-xl border border-gray-800 shadow-xl">
                        <div className="flex items-center space-x-2 space-x-reverse mb-4 text-sm font-bold text-gray-300">
                            <MapPin className="h-5 w-5 text-[#00ff66]" />
                            <h2>الامتداد الجغرافي والسيطرة الإقليمية (انقر لتصفية ورقابة العمليات)</h2>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                            {GOVERNORATES.map((gov) => (
                                <button
                                    key={gov.code}
                                    onClick={() => setSelectedGov(gov.code)}
                                    className={`p-3 rounded text-center transition-all border flex flex-col justify-between items-center h-16 ${selectedGov === gov.code ? 'bg-[#00ff66]/20 border-[#00ff66] text-white shadow-lg font-bold' : 'bg-[#17202a] border-gray-800 hover:border-gray-700 text-gray-400'}`}
                                >
                                    <span className="text-sm">{gov.name}</span>
                                    <span className="text-[10px] opacity-60 font-mono tracking-widest">{gov.code}</span>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* محتوى التبويبات النشطة */}
                    {activeTab === 'operations' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* شجرة الإدارات والأقسام الـ 19 */}
                            <div className="lg:col-span-1 bg-[#11161d] p-4 rounded-xl border border-gray-800 h-[600px] flex flex-col">
                                <div className="flex items-center space-x-2 space-x-reverse mb-3 pb-2 border-b border-gray-800">
                                    <Layers className="h-5 w-5 text-[#00ff66]" />
                                    <h3 className="text-sm font-bold text-white">الهيكل القيادي (الـ 19 قطاعاً وإدارة)</h3>
                                </div>
                                <div className="overflow-y-auto flex-1 space-y-1 pl-1">
                                    {HIERARCHY_SECTIONS.map((sec) => (
                                        <div key={sec.id} className="flex items-center justify-between p-2.5 rounded bg-[#17202a] border border-gray-800/60 hover:bg-[#1f2c3a] transition-all cursor-pointer">
                                            <div className="flex items-center space-x-2 space-x-reverse">
                                                <span className="text-xs font-mono bg-gray-800 text-[#00ff66] px-1.5 py-0.5 rounded">{sec.id}</span>
                                                <span className="text-xs text-gray-200">{sec.name}</span>
                                            </div>
                                            <ChevronRight className="h-3 w-3 text-gray-500" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* لوحة السيطرة التكتيكية الحية */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-[#11161d] p-6 rounded-xl border border-gray-800 shadow-xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#00ff66]/5 rounded-full blur-3xl"></div>
                                    <h3 className="text-lg font-black text-white mb-2">وزارة الداخلية - - مركز القيادة الوطني</h3>
                                    <p className="text-xs text-gray-400 mb-4">القاعدة القيادية العليا لمراقبة وتتبع العمليات الجارية في المحافظات والقطاعات الـ 19 بصورة لحظية.</p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="bg-[#17202a] p-4 rounded border border-gray-800">
                                            <span className="text-xs text-gray-400 block mb-1">النطاق المرصود حالياً:</span>
                                            <span className="text-sm font-bold text-[#00ff66] bg-[#00ff66]/10 px-2 py-1 rounded">المستوى المركزي (كافة المحافظات)</span>
                                        </div>
                                        <div className="bg-[#17202a] p-4 rounded border border-gray-800">
                                            <span className="text-xs text-gray-400 block mb-1">المحافظة النشطة للتحليل:</span>
                                            <span className="text-sm font-bold text-white">
                                                {GOVERNORATES.find(g => g.code === selectedGov)?.name || selectedGov}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* سجل المستخدمين والضباط الافتراضي */}
                                <div className="bg-[#11161d] p-4 rounded-xl border border-gray-800">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-sm font-bold text-white flex items-center space-x-2 space-x-reverse">
                                            <UserCheck className="h-4 w-4 text-[#00ff66]" />
                                            <span>سجل الضباط والمستخدمين المصرح لهم - نطاق التحكم</span>
                                        </h3>
                                        <button onClick={() => setShowAddModal(true)} className="bg-[#00ff66] text-slate-950 font-bold text-xs px-3 py-1.5 rounded hover:bg-[#00dd55] transition-all">
                                            + تسجيل مستخدم جديد
                                        </button>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-right text-xs">
                                            <thead>
                                                <tr className="border-b border-gray-800 text-gray-400 bg-[#17202a]">
                                                    <th className="p-3">الرقم العسكري</th>
                                                    <th className="p-3">الاسم الرُّباعي</th>
                                                    <th className="p-3">الرتبة</th>
                                                    <th className="p-3">الدور العملياتي</th>
                                                    <th className="p-3">الحالة</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-800/50">
                                                <tr className="hover:bg-gray-800/30">
                                                    <td className="p-3 font-mono text-gray-400">12345678</td>
                                                    <td className="p-3 font-bold text-white">عقيد أحمد محمد عبدالله</td>
                                                    <td className="p-3">عقيد</td>
                                                    <td className="p-3 text-gray-300">مدير الإدارة المركزية</td>
                                                    <td className="p-3"><span className="bg-green-900/40 text-green-400 px-2 py-0.5 rounded-full text-[10px]">نشط الآن</span></td>
                                                </tr>
                                                <tr className="hover:bg-gray-800/30">
                                                    <td className="p-3 font-mono text-gray-400">87654321</td>
                                                    <td className="p-3 font-bold text-white">مقدم خالد سعود مسعد</td>
                                                    <td className="p-3">مقدم</td>
                                                    <td className="p-3 text-gray-300">نائب مدير العمليات</td>
                                                    <td className="p-3"><span className="bg-green-900/40 text-green-400 px-2 py-0.5 rounded-full text-[10px]">نشط الآن</span></td>
                                                </tr>
                                                <tr className="hover:bg-gray-800/30">
                                                    <td className="p-3 font-mono text-gray-400">11223344</td>
                                                    <td className="p-3 font-bold text-white">رائد فهد عبدالله الخضر</td>
                                                    <td className="p-3">رائد</td>
                                                    <td className="p-3 text-gray-300">رئيس قسم الإشارات</td>
                                                    <td className="p-3"><span className="bg-red-900/40 text-red-400 px-2 py-0.5 rounded-full text-[10px]">غير نشط</span></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab !== 'operations' && (
                        <div className="bg-[#11161d] p-12 rounded-xl border border-gray-800 text-center space-y-3">
                            <AlertTriangle className="h-12 w-12 text-[#00ff66] mx-auto animate-bounce" />
                            <h3 className="text-lg font-bold text-white">القطاع قيد المراقبة والتأمين</h3>
                            <p className="text-xs text-gray-400 max-w-md mx-auto">يجري الآن جلب البيانات الحية والمشفرة من خوادم الاتصال المركزي التابعة للمحافظة المحددة ({selectedGov}).</p>
                        </div>
                    )}
                </main>
            </div>

            {/* نافذة إضافة مستخدم تكتيكي منبثقة */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-[#11161d] border border-gray-800 w-full max-w-md rounded-xl shadow-2xl p-6 relative">
                        <button onClick={() => setShowAddModal(false)} className="absolute top-4 left-4 text-gray-400 hover:text-white font-bold">✕</button>
                        <h3 className="text-base font-bold text-white mb-4 border-b border-gray-800 pb-2 flex items-center space-x-2 space-x-reverse">
                            <Building2 className="h-5 w-5 text-[#00ff66]" />
                            <span>تسجيل وإضافة ضابط جديد بالمنظومة</span>
                        </h3>

                        <form className="space-y-4 text-right text-xs" onSubmit={(e) => { e.preventDefault(); setShowAddModal(false); }}>
                            <div>
                                <label className="block text-gray-400 mb-1">الاسم الرباعي الكامل</label>
                                <input type="text" placeholder="أدخل الاسم الرباعي الرسمي للضابط..." className="w-full bg-[#17202a] border border-gray-800 rounded p-2.5 text-white focus:outline-none focus:border-[#00ff66]" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-400 mb-1">الرقم العسكري</label>
                                    <input type="text" placeholder="أدخل الرقم العسكري..." className="w-full bg-[#17202a] border border-gray-800 rounded p-2.5 text-white focus:outline-none focus:border-[#00ff66]" required />
                                </div>
                                <div>
                                    <label className="block text-gray-400 mb-1">الرتبة العسكرية</label>
                                    <select className="w-full bg-[#17202a] border border-gray-800 rounded p-2.5 text-white focus:outline-none focus:border-[#00ff66]">
                                        <option>ملازم</option>
                                        <option>نقيب</option>
                                        <option>رائد</option>
                                        <option>مقدم</option>
                                        <option>عقيد</option>
                                        <option>عميد</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-gray-400 mb-1">الدور العملياتي / الإدارة</label>
                                <select className="w-full bg-[#17202a] border border-gray-800 rounded p-2.5 text-white focus:outline-none focus:border-[#00ff66]">
                                    {HIERARCHY_SECTIONS.map(s => <option key={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="flex space-x-3 space-x-reverse pt-2">
                                <button type="submit" className="flex-1 bg-[#00ff66] text-slate-950 font-bold p-2.5 rounded hover:bg-[#00dd55] transition-all">حفظ البيانات بالمنظومة</button>
                                <button type="button" onClick={() => setShowAddModal(false)} className="bg-gray-800 text-gray-300 px-4 py-2.5 rounded hover:bg-gray-700 transition-all">إلغاء</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}