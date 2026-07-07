// Comprehensive Schema for 24 Specialized Departments
export interface DepartmentFormField {
  id: string
  name: string
  label: string
  type: 'text' | 'number' | 'email' | 'date' | 'select' | 'textarea' | 'checkbox' | 'file'
  required: boolean
  placeholder?: string
  options?: { value: string; label: string }[]
}

export interface Department {
  id: string
  code: string
  nameAr: string
  nameEn: string
  description: string
  parentDepartmentId?: string
  managerName: string
  managerRank: string
  staffCount: number
  budget: number
  formFields: DepartmentFormField[]
  primaryKeys: string[] // Military ID, National ID, Case Number
  linkedDepartments: string[]
  icon: string
}

// 24 Specialized Departments
export const departments: Department[] = [
  {
    id: 'dept-001',
    code: 'DIR',
    nameAr: 'إدارة العمليات المركزية',
    nameEn: 'Central Operations Directorate',
    description: 'الإدارة المركزية للعمليات الأمنية والسيطرة',
    managerName: 'العميد / أحمد محمد علي',
    managerRank: 'عميد',
    staffCount: 250,
    budget: 1500000,
    formFields: [
      { id: 'f1', name: 'militaryId', label: 'الرقم العسكري', type: 'text', required: true },
      { id: 'f2', name: 'operationType', label: 'نوع العملية', type: 'select', required: true, options: [{ value: 'security', label: 'أمنية' }, { value: 'search', label: 'بحث وتحري' }] },
      { id: 'f3', name: 'operationDate', label: 'تاريخ العملية', type: 'date', required: true },
      { id: 'f4', name: 'operationDetails', label: 'تفاصيل العملية', type: 'textarea', required: true },
      { id: 'f5', name: 'location', label: 'موقع العملية', type: 'text', required: true }
    ],
    primaryKeys: ['militaryId', 'nationalId', 'caseNumber'],
    linkedDepartments: ['dept-002', 'dept-003', 'dept-004'],
    icon: 'operations'
  },
  {
    id: 'dept-002',
    code: 'INV',
    nameAr: 'إدارة التحقيقات والبحث',
    nameEn: 'Investigation & Research Directorate',
    description: 'تحقيقات جنائية وبحث تفصيلي',
    managerName: 'العقيد / محمد سالم حسن',
    managerRank: 'عقيد',
    staffCount: 180,
    budget: 1200000,
    formFields: [
      { id: 'f1', name: 'nationalId', label: 'الرقم الوطني', type: 'text', required: true },
      { id: 'f2', name: 'caseNumber', label: 'رقم القضية', type: 'text', required: true },
      { id: 'f3', name: 'caseType', label: 'نوع القضية', type: 'select', required: true, options: [{ value: 'criminal', label: 'جنائية' }, { value: 'security', label: 'أمنية' }] },
      { id: 'f4', name: 'investigationStatus', label: 'حالة التحقيق', type: 'select', required: true, options: [{ value: 'open', label: 'مفتوحة' }, { value: 'closed', label: 'مقفلة' }] },
      { id: 'f5', name: 'findings', label: 'النتائج', type: 'textarea', required: false }
    ],
    primaryKeys: ['nationalId', 'caseNumber', 'militaryId'],
    linkedDepartments: ['dept-001', 'dept-005', 'dept-007'],
    icon: 'investigation'
  },
  {
    id: 'dept-003',
    code: 'SEA',
    nameAr: 'إدارة البحث والاستخبارات الأمنية',
    nameEn: 'Search & Security Intelligence',
    description: 'جمع وتحليل المعلومات الأمنية',
    managerName: 'العقيد / علي أحمد محمود',
    managerRank: 'عقيد',
    staffCount: 150,
    budget: 1000000,
    formFields: [
      { id: 'f1', name: 'intelligenceType', label: 'نوع المعلومة', type: 'select', required: true, options: [{ value: 'threat', label: 'تهديد' }, { value: 'security', label: 'أمنية' }] },
      { id: 'f2', name: 'source', label: 'المصدر', type: 'text', required: true },
      { id: 'f3', name: 'reliability', label: 'درجة الموثوقية', type: 'select', required: true, options: [{ value: 'high', label: 'عالية' }, { value: 'medium', label: 'متوسطة' }, { value: 'low', label: 'منخفضة' }] },
      { id: 'f4', name: 'report', label: 'التقرير', type: 'textarea', required: true }
    ],
    primaryKeys: ['caseNumber', 'militaryId', 'nationalId'],
    linkedDepartments: ['dept-001', 'dept-002', 'dept-004'],
    icon: 'intelligence'
  },
  {
    id: 'dept-004',
    code: 'REP',
    nameAr: 'إدارة التقارير والإحصائيات',
    nameEn: 'Reports & Statistics Directorate',
    description: 'إعداد التقارير والإحصائيات الأمنية',
    managerName: 'الرائد / فاطمة علي محمد',
    managerRank: 'رائد',
    staffCount: 100,
    budget: 600000,
    formFields: [
      { id: 'f1', name: 'reportType', label: 'نوع التقرير', type: 'select', required: true, options: [{ value: 'daily', label: 'يومي' }, { value: 'weekly', label: 'أسبوعي' }, { value: 'monthly', label: 'شهري' }] },
      { id: 'f2', name: 'period', label: 'الفترة', type: 'date', required: true },
      { id: 'f3', name: 'metrics', label: 'المؤشرات', type: 'textarea', required: true },
      { id: 'f4', name: 'analysis', label: 'التحليل', type: 'textarea', required: false }
    ],
    primaryKeys: ['reportId', 'period'],
    linkedDepartments: ['dept-001', 'dept-002', 'dept-003'],
    icon: 'reports'
  },
  {
    id: 'dept-005',
    code: 'RESP',
    nameAr: 'إدارة الاستجابة والدعم الميداني',
    nameEn: 'Response & Field Support',
    description: 'دعم العمليات الميدانية والاستجابة السريعة',
    managerName: 'الرائد / سامي حسن علي',
    managerRank: 'رائد',
    staffCount: 200,
    budget: 1300000,
    formFields: [
      { id: 'f1', name: 'incidentType', label: 'نوع الحادث', type: 'select', required: true, options: [{ value: 'emergency', label: 'طوارئ' }, { value: 'routine', label: 'روتيني' }] },
      { id: 'f2', name: 'responseTime', label: 'وقت الاستجابة', type: 'number', required: true },
      { id: 'f3', name: 'teams', label: 'عدد الفرق', type: 'number', required: true },
      { id: 'f4', name: 'status', label: 'الحالة', type: 'select', required: true, options: [{ value: 'active', label: 'نشطة' }, { value: 'completed', label: 'مكتملة' }] }
    ],
    primaryKeys: ['incidentId', 'militaryId'],
    linkedDepartments: ['dept-001', 'dept-002', 'dept-006'],
    icon: 'response'
  },
  {
    id: 'dept-006',
    code: 'HR',
    nameAr: 'إدارة الموارد البشرية',
    nameEn: 'Human Resources Directorate',
    description: 'إدارة الأفراد والموارد البشرية',
    managerName: 'الملازم / نور محمد حسن',
    managerRank: 'ملازم أول',
    staffCount: 80,
    budget: 800000,
    formFields: [
      { id: 'f1', name: 'militaryId', label: 'الرقم العسكري', type: 'text', required: true },
      { id: 'f2', name: 'fullName', label: 'الاسم الكامل', type: 'text', required: true },
      { id: 'f3', name: 'rank', label: 'الرتبة', type: 'text', required: true },
      { id: 'f4', name: 'department', label: 'الإدارة', type: 'text', required: true },
      { id: 'f5', name: 'status', label: 'الحالة', type: 'select', required: true, options: [{ value: 'active', label: 'نشط' }, { value: 'onLeave', label: 'في إجازة' }] }
    ],
    primaryKeys: ['militaryId', 'nationalId'],
    linkedDepartments: ['dept-001', 'dept-007'],
    icon: 'human-resources'
  },
  {
    id: 'dept-007',
    code: 'TRAIN',
    nameAr: 'إدارة التدريب والتطوير',
    nameEn: 'Training & Development',
    description: 'برامج التدريب والتطوير المهني',
    managerName: 'العقيد / محمود أحمد سالم',
    managerRank: 'عقيد',
    staffCount: 120,
    budget: 900000,
    formFields: [
      { id: 'f1', name: 'militaryId', label: 'الرقم العسكري', type: 'text', required: true },
      { id: 'f2', name: 'trainingCourse', label: 'نوع الدورة', type: 'select', required: true, options: [{ value: 'basic', label: 'أساسية' }, { value: 'advanced', label: 'متقدمة' }] },
      { id: 'f3', name: 'duration', label: 'المدة بالأيام', type: 'number', required: true },
      { id: 'f4', name: 'grade', label: 'التقدير', type: 'select', required: false, options: [{ value: 'A', label: 'A' }, { value: 'B', label: 'B' }, { value: 'C', label: 'C' }] }
    ],
    primaryKeys: ['militaryId', 'trainingId'],
    linkedDepartments: ['dept-006', 'dept-001'],
    icon: 'training'
  },
  {
    id: 'dept-008',
    code: 'PLAN',
    nameAr: 'إدارة التخطيط والاستراتيجية',
    nameEn: 'Planning & Strategy',
    description: 'التخطيط الاستراتيجي والعمليات',
    managerName: 'العميد / خالد محمد علي',
    managerRank: 'عميد',
    staffCount: 110,
    budget: 950000,
    formFields: [
      { id: 'f1', name: 'planName', label: 'اسم الخطة', type: 'text', required: true },
      { id: 'f2', name: 'planType', label: 'نوع الخطة', type: 'select', required: true, options: [{ value: 'strategic', label: 'استراتيجية' }, { value: 'tactical', label: 'تكتيكية' }] },
      { id: 'f3', name: 'duration', label: 'المدة الزمنية', type: 'text', required: true },
      { id: 'f4', name: 'objectives', label: 'الأهداف', type: 'textarea', required: true }
    ],
    primaryKeys: ['planId', 'militaryId'],
    linkedDepartments: ['dept-001', 'dept-004'],
    icon: 'planning'
  },
  {
    id: 'dept-009',
    code: 'FIN',
    nameAr: 'إدارة الشؤون المالية',
    nameEn: 'Finance & Budget Directorate',
    description: 'إدارة الميزانية والموارد المالية',
    managerName: 'الرائد / سارة علي حسن',
    managerRank: 'رائد',
    staffCount: 95,
    budget: 1100000,
    formFields: [
      { id: 'f1', name: 'expenditureType', label: 'نوع الإنفاق', type: 'select', required: true, options: [{ value: 'salaries', label: 'رواتب' }, { value: 'equipment', label: 'معدات' }] },
      { id: 'f2', name: 'amount', label: 'المبلغ', type: 'number', required: true },
      { id: 'f3', name: 'date', label: 'التاريخ', type: 'date', required: true },
      { id: 'f4', name: 'approvalStatus', label: 'حالة الموافقة', type: 'select', required: true, options: [{ value: 'pending', label: 'معلقة' }, { value: 'approved', label: 'موافق عليها' }] }
    ],
    primaryKeys: ['transactionId', 'date'],
    linkedDepartments: ['dept-001', 'dept-006'],
    icon: 'finance'
  },
  {
    id: 'dept-010',
    code: 'LOG',
    nameAr: 'إدارة الإمدادات واللوجستيات',
    nameEn: 'Logistics & Supply',
    description: 'تنسيق الإمدادات والمعدات',
    managerName: 'العقيد / إبراهيم محمود علي',
    managerRank: 'عقيد',
    staffCount: 130,
    budget: 1400000,
    formFields: [
      { id: 'f1', name: 'itemName', label: 'اسم المادة', type: 'text', required: true },
      { id: 'f2', name: 'quantity', label: 'الكمية', type: 'number', required: true },
      { id: 'f3', name: 'supplier', label: 'المورد', type: 'text', required: true },
      { id: 'f4', name: 'deliveryDate', label: 'تاريخ التسليم', type: 'date', required: true }
    ],
    primaryKeys: ['itemId', 'batchNumber'],
    linkedDepartments: ['dept-001', 'dept-009'],
    icon: 'logistics'
  },
  {
    id: 'dept-011',
    code: 'IT',
    nameAr: 'إدارة تقنية المعلومات',
    nameEn: 'Information Technology',
    description: 'البنية التحتية والأنظمة المعلوماتية',
    managerName: 'الملازم / حسين علي سالم',
    managerRank: 'ملازم أول',
    staffCount: 140,
    budget: 1600000,
    formFields: [
      { id: 'f1', name: 'systemName', label: 'اسم النظام', type: 'text', required: true },
      { id: 'f2', name: 'issueType', label: 'نوع المشكلة', type: 'select', required: true, options: [{ value: 'hardware', label: 'أجهزة' }, { value: 'software', label: 'برامج' }] },
      { id: 'f3', name: 'severity', label: 'درجة الأهمية', type: 'select', required: true, options: [{ value: 'critical', label: 'حرجة' }, { value: 'high', label: 'عالية' }, { value: 'medium', label: 'متوسطة' }] },
      { id: 'f4', name: 'resolution', label: 'الحل', type: 'textarea', required: false }
    ],
    primaryKeys: ['ticketId', 'systemId'],
    linkedDepartments: ['dept-001', 'dept-004'],
    icon: 'technology'
  },
  {
    id: 'dept-012',
    code: 'SEC',
    nameAr: 'إدارة الأمن السيبراني',
    nameEn: 'Cyber Security',
    description: 'حماية الأنظمة والبيانات',
    managerName: 'العقيد / سامي محمود حسن',
    managerRank: 'عقيد',
    staffCount: 125,
    budget: 1700000,
    formFields: [
      { id: 'f1', name: 'threatType', label: 'نوع التهديد', type: 'select', required: true, options: [{ value: 'malware', label: 'برامج ضارة' }, { value: 'phishing', label: 'صيد احتيالي' }] },
      { id: 'f2', name: 'detectionTime', label: 'وقت الكشف', type: 'date', required: true },
      { id: 'f3', name: 'impact', label: 'التأثير', type: 'textarea', required: true },
      { id: 'f4', name: 'mitigation', label: 'الإجراءات المتخذة', type: 'textarea', required: true }
    ],
    primaryKeys: ['incidentId', 'systemId'],
    linkedDepartments: ['dept-011', 'dept-001'],
    icon: 'cyber-security'
  },
  {
    id: 'dept-013',
    code: 'COM',
    nameAr: 'إدارة الاتصالات',
    nameEn: 'Communications Directorate',
    description: 'وسائل الاتصال والنقل',
    managerName: 'الرائد / نور علي محمد',
    managerRank: 'رائد',
    staffCount: 115,
    budget: 850000,
    formFields: [
      { id: 'f1', name: 'callType', label: 'نوع البلاغ', type: 'select', required: true, options: [{ value: 'emergency', label: 'طوارئ' }, { value: 'routine', label: 'روتيني' }] },
      { id: 'f2', name: 'callerInfo', label: 'بيانات المتصل', type: 'text', required: true },
      { id: 'f3', name: 'callDetails', label: 'تفاصيل البلاغ', type: 'textarea', required: true },
      { id: 'f4', name: 'recordingTime', label: 'وقت التسجيل', type: 'date', required: true }
    ],
    primaryKeys: ['callId', 'recordingTime'],
    linkedDepartments: ['dept-001', 'dept-005'],
    icon: 'communications'
  },
  {
    id: 'dept-014',
    code: 'TRANS',
    nameAr: 'إدارة النقل والأسطول',
    nameEn: 'Transport & Fleet Management',
    description: 'إدارة المركبات والأسطول',
    managerName: 'الملازم / عمرو حسن علي',
    managerRank: 'ملازم',
    staffCount: 105,
    budget: 950000,
    formFields: [
      { id: 'f1', name: 'vehicleID', label: 'رقم المركبة', type: 'text', required: true },
      { id: 'f2', name: 'maintenanceType', label: 'نوع الصيانة', type: 'select', required: true, options: [{ value: 'routine', label: 'روتينية' }, { value: 'emergency', label: 'طارئة' }] },
      { id: 'f3', name: 'date', label: 'التاريخ', type: 'date', required: true },
      { id: 'f4', name: 'mileage', label: 'الكيلومترات', type: 'number', required: true }
    ],
    primaryKeys: ['vehicleID', 'recordId'],
    linkedDepartments: ['dept-001', 'dept-010'],
    icon: 'transport'
  },
  {
    id: 'dept-015',
    code: 'MED',
    nameAr: 'إدارة الخدمات الطبية',
    nameEn: 'Medical Services',
    description: 'الخدمات الطبية والرعاية الصحية',
    managerName: 'الدكتور / علي محمد حسن',
    managerRank: 'عقيد',
    staffCount: 90,
    budget: 1200000,
    formFields: [
      { id: 'f1', name: 'militaryId', label: 'الرقم العسكري', type: 'text', required: true },
      { id: 'f2', name: 'medicalCond', label: 'الحالة الطبية', type: 'textarea', required: true },
      { id: 'f3', name: 'treatment', label: 'العلاج', type: 'textarea', required: true },
      { id: 'f4', name: 'visitDate', label: 'تاريخ الزيارة', type: 'date', required: true }
    ],
    primaryKeys: ['militaryId', 'medicalRecordId'],
    linkedDepartments: ['dept-006', 'dept-001'],
    icon: 'medical'
  },
  {
    id: 'dept-016',
    code: 'REL',
    nameAr: 'إدارة العلاقات العامة',
    nameEn: 'Public Relations',
    description: 'العلاقات العامة والإعلام',
    managerName: 'الملازم أول / فاطمة علي سالم',
    managerRank: 'ملازم أول',
    staffCount: 85,
    budget: 700000,
    formFields: [
      { id: 'f1', name: 'releaseType', label: 'نوع البيان', type: 'select', required: true, options: [{ value: 'statement', label: 'بيان' }, { value: 'report', label: 'تقرير' }] },
      { id: 'f2', name: 'subject', label: 'الموضوع', type: 'text', required: true },
      { id: 'f3', name: 'content', label: 'المحتوى', type: 'textarea', required: true },
      { id: 'f4', name: 'publishDate', label: 'تاريخ النشر', type: 'date', required: true }
    ],
    primaryKeys: ['releaseId', 'publishDate'],
    linkedDepartments: ['dept-001', 'dept-004'],
    icon: 'public-relations'
  },
  {
    id: 'dept-017',
    code: 'LEGAL',
    nameAr: 'الإدارة القانونية',
    nameEn: 'Legal Affairs',
    description: 'الاستشارات والأمور القانونية',
    managerName: 'المستشار / محمود علي حسن',
    managerRank: 'عقيد',
    staffCount: 75,
    budget: 600000,
    formFields: [
      { id: 'f1', name: 'caseNumber', label: 'رقم القضية', type: 'text', required: true },
      { id: 'f2', name: 'legalStatus', label: 'الحالة القانونية', type: 'select', required: true, options: [{ value: 'pending', label: 'معلقة' }, { value: 'closed', label: 'مقفلة' }] },
      { id: 'f3', name: 'verdict', label: 'الحكم', type: 'textarea', required: false },
      { id: 'f4', name: 'notes', label: 'ملاحظات', type: 'textarea', required: false }
    ],
    primaryKeys: ['caseNumber', 'nationalId'],
    linkedDepartments: ['dept-002', 'dept-001'],
    icon: 'legal'
  },
  {
    id: 'dept-018',
    code: 'ARCH',
    nameAr: 'إدارة الأرشيف والوثائق',
    nameEn: 'Archives & Records',
    description: 'حفظ واسترجاع الوثائق والأرشيفات',
    managerName: 'الرائد / هند محمد علي',
    managerRank: 'رائد',
    staffCount: 70,
    budget: 500000,
    formFields: [
      { id: 'f1', name: 'docType', label: 'نوع الوثيقة', type: 'select', required: true, options: [{ value: 'case', label: 'قضية' }, { value: 'report', label: 'تقرير' }] },
      { id: 'f2', name: 'docNumber', label: 'رقم الوثيقة', type: 'text', required: true },
      { id: 'f3', name: 'storageLocation', label: 'مكان الحفظ', type: 'text', required: true },
      { id: 'f4', name: 'retrievalDate', label: 'تاريخ الاسترجاع', type: 'date', required: false }
    ],
    primaryKeys: ['docNumber', 'docId'],
    linkedDepartments: ['dept-002', 'dept-004'],
    icon: 'archives'
  },
  {
    id: 'dept-019',
    code: 'INSP',
    nameAr: 'إدارة التفتيش والرقابة',
    nameEn: 'Inspection & Control',
    description: 'تفتيش ورقابة العمليات',
    managerName: 'العقيد / محمد سالم علي',
    managerRank: 'عقيد',
    staffCount: 110,
    budget: 800000,
    formFields: [
      { id: 'f1', name: 'inspectionType', label: 'نوع التفتيش', type: 'select', required: true, options: [{ value: 'routine', label: 'روتيني' }, { value: 'special', label: 'خاص' }] },
      { id: 'f2', name: 'date', label: 'التاريخ', type: 'date', required: true },
      { id: 'f3', name: 'findings', label: 'النتائج', type: 'textarea', required: true },
      { id: 'f4', name: 'recommendations', label: 'التوصيات', type: 'textarea', required: false }
    ],
    primaryKeys: ['inspectionId', 'date'],
    linkedDepartments: ['dept-001', 'dept-004'],
    icon: 'inspection'
  },
  {
    id: 'dept-020',
    code: 'EVAL',
    nameAr: 'إدارة التقييم والأداء',
    nameEn: 'Performance Evaluation',
    description: 'تقييم الأداء والكفاءات',
    managerName: 'الملازم أول / سلمى علي محمد',
    managerRank: 'ملازم أول',
    staffCount: 85,
    budget: 650000,
    formFields: [
      { id: 'f1', name: 'militaryId', label: 'الرقم العسكري', type: 'text', required: true },
      { id: 'f2', name: 'evaluationPeriod', label: 'فترة التقييم', type: 'text', required: true },
      { id: 'f3', name: 'score', label: 'النقاط', type: 'number', required: true },
      { id: 'f4', name: 'feedback', label: 'التقييم', type: 'textarea', required: true }
    ],
    primaryKeys: ['militaryId', 'evaluationId'],
    linkedDepartments: ['dept-006', 'dept-001'],
    icon: 'evaluation'
  },
  {
    id: 'dept-021',
    code: 'SAFE',
    nameAr: 'إدارة السلامة والصحة المهنية',
    nameEn: 'Safety & Occupational Health',
    description: 'السلامة والصحة المهنية',
    managerName: 'الرائد / أحمد علي سالم',
    managerRank: 'رائد',
    staffCount: 80,
    budget: 750000,
    formFields: [
      { id: 'f1', name: 'incidentType', label: 'نوع الحادث', type: 'select', required: true, options: [{ value: 'injury', label: 'إصابة' }, { value: 'nearmiss', label: 'حريق قريب' }] },
      { id: 'f2', name: 'date', label: 'التاريخ', type: 'date', required: true },
      { id: 'f3', name: 'severity', label: 'درجة الخطورة', type: 'select', required: true, options: [{ value: 'minor', label: 'طفيفة' }, { value: 'serious', label: 'خطيرة' }] },
      { id: 'f4', name: 'corrective', label: 'الإجراءات التصحيحية', type: 'textarea', required: true }
    ],
    primaryKeys: ['incidentId', 'date'],
    linkedDepartments: ['dept-001', 'dept-015'],
    icon: 'safety'
  },
  {
    id: 'dept-022',
    code: 'ENV',
    nameAr: 'إدارة البيئة والاستدامة',
    nameEn: 'Environment & Sustainability',
    description: 'البيئة والممارسات المستدامة',
    managerName: 'الملازم / نجيب محمد علي',
    managerRank: 'ملازم',
    staffCount: 65,
    budget: 550000,
    formFields: [
      { id: 'f1', name: 'initiativeType', label: 'نوع المبادرة', type: 'select', required: true, options: [{ value: 'recycling', label: 'إعادة تدوير' }, { value: 'energy', label: 'توفير الطاقة' }] },
      { id: 'f2', name: 'description', label: 'الوصف', type: 'textarea', required: true },
      { id: 'f3', name: 'impact', label: 'التأثير', type: 'textarea', required: true },
      { id: 'f4', name: 'implementationDate', label: 'تاريخ التنفيذ', type: 'date', required: true }
    ],
    primaryKeys: ['initiativeId', 'implementationDate'],
    linkedDepartments: ['dept-001', 'dept-010'],
    icon: 'environment'
  },
  {
    id: 'dept-023',
    code: 'QUAL',
    nameAr: 'إدارة ضمان الجودة',
    nameEn: 'Quality Assurance',
    description: 'ضمان الجودة والمعايير',
    managerName: 'العقيد / سامي حسن محمود',
    managerRank: 'عقيد',
    staffCount: 95,
    budget: 700000,
    formFields: [
      { id: 'f1', name: 'auditType', label: 'نوع التدقيق', type: 'select', required: true, options: [{ value: 'internal', label: 'داخلي' }, { value: 'external', label: 'خارجي' }] },
      { id: 'f2', name: 'standards', label: 'المعايير', type: 'text', required: true },
      { id: 'f3', name: 'findings', label: 'النتائج', type: 'textarea', required: true },
      { id: 'f4', name: 'improvements', label: 'التحسينات المقترحة', type: 'textarea', required: false }
    ],
    primaryKeys: ['auditId', 'date'],
    linkedDepartments: ['dept-001', 'dept-019'],
    icon: 'quality'
  },
  {
    id: 'dept-024',
    code: 'PART',
    nameAr: 'إدارة الشراكات والتعاون الدولي',
    nameEn: 'Partnerships & International Cooperation',
    description: 'الشراكات والتعاون الدولي',
    managerName: 'السفير / أحمد علي محمود',
    managerRank: 'عميد',
    staffCount: 70,
    budget: 1000000,
    formFields: [
      { id: 'f1', name: 'partnerCountry', label: 'الدولة الشريكة', type: 'text', required: true },
      { id: 'f2', name: 'agreementType', label: 'نوع الاتفاق', type: 'select', required: true, options: [{ value: 'bilateral', label: 'ثنائي' }, { value: 'multilateral', label: 'متعدد الأطراف' }] },
      { id: 'f3', name: 'signedDate', label: 'تاريخ التوقيع', type: 'date', required: true },
      { id: 'f4', name: 'objectives', label: 'الأهداف', type: 'textarea', required: true }
    ],
    primaryKeys: ['agreementId', 'partnerCountry'],
    linkedDepartments: ['dept-001', 'dept-016'],
    icon: 'partnerships'
  }
]
