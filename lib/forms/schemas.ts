// ============================================================================
// NSSCP Dynamic Form Schemas — 24 Departments (Complete)
// ============================================================================
export type FieldType = 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'SELECT' | 'MULTI_SELECT' | 'TEXTAREA' | 'FILE' | 'IMAGE'
export interface FormField { name: string; label: string; type: FieldType; required: boolean; placeholder?: string; options?: string[] }
export interface FormSchema { departmentName: string; departmentCode: string; recordType: string; title: string; description: string; fields: FormField[] }

const CRI: FormSchema[] = [
  { departmentName: 'البحث الجنائي', departmentCode: 'CRI', recordType: 'CRIMINAL_CASE', title: 'تسجيل قضية', description: 'تسجيل قضية جنائية جديدة', fields: [
    { name: 'caseNumber', label: 'رقم القضية', type: 'TEXT', required: true },
    { name: 'crimeType', label: 'نوع الجريمة', type: 'SELECT', required: true, options: ['قتل','سرقة','اعتداء','تهريب','احتيال','مخدرات','إلكترونية','أخرى'] },
    { name: 'suspectName', label: 'اسم المتهم', type: 'TEXT', required: true },
    { name: 'victimName', label: 'المجني عليه', type: 'TEXT', required: false },
    { name: 'incidentDate', label: 'تاريخ الواقعة', type: 'DATE', required: true },
    { name: 'incidentLocation', label: 'مكان الواقعة', type: 'TEXT', required: true },
    { name: 'incidentSummary', label: 'ملخص الواقعة', type: 'TEXTAREA', required: true },
    { name: 'investigatorName', label: 'المحقق', type: 'TEXT', required: true },
    { name: 'priority', label: 'الأولوية', type: 'SELECT', required: true, options: ['عالي جداً','عالي','متوسط','عادي'] },
  ]},
  { departmentName: 'البحث الجنائي', departmentCode: 'CRI', recordType: 'SEIZURE', title: 'ضبط مضبوطات', description: 'تسجيل المضبوطات', fields: [
    { name: 'seizureNumber', label: 'رقم الضبطية', type: 'TEXT', required: true },
    { name: 'itemType', label: 'نوع المضبوطات', type: 'SELECT', required: true, options: ['أسلحة','مخدرات','وثائق','إلكترونيات','أموال','مركبات','أخرى'] },
    { name: 'description', label: 'وصف المضبوطات', type: 'TEXTAREA', required: true },
    { name: 'quantity', label: 'الكمية', type: 'TEXT', required: false },
    { name: 'location', label: 'مكان الضبط', type: 'TEXT', required: true },
    { name: 'date', label: 'تاريخ الضبط', type: 'DATE', required: true },
  ]},
]

const PRS: FormSchema[] = [
  { departmentName: 'السجون', departmentCode: 'PRS', recordType: 'PRISONER_REG', title: 'تسجيل نزيل', description: 'تسجيل نزيل جديد', fields: [
    { name: 'prisonerNumber', label: 'رقم النزيل', type: 'TEXT', required: true },
    { name: 'fullName', label: 'الاسم الرباعي', type: 'TEXT', required: true },
    { name: 'nationalId', label: 'الرقم الوطني', type: 'TEXT', required: false },
    { name: 'gender', label: 'الجنس', type: 'SELECT', required: true, options: ['ذكر','أنثى'] },
    { name: 'crimeType', label: 'نوع الجريمة', type: 'TEXT', required: true },
    { name: 'sentence', label: 'مدة الحكم', type: 'TEXT', required: false },
    { name: 'admissionDate', label: 'تاريخ الدخول', type: 'DATE', required: true },
    { name: 'cellBlock', label: 'العنبر', type: 'TEXT', required: false },
  ]},
  { departmentName: 'السجون', departmentCode: 'PRS', recordType: 'VISIT', title: 'تسجيل زيارة', description: 'تسجيل زيارة نزيل', fields: [
    { name: 'prisonerNumber', label: 'رقم النزيل', type: 'TEXT', required: true },
    { name: 'visitorName', label: 'اسم الزائر', type: 'TEXT', required: true },
    { name: 'visitorId', label: 'رقم هوية الزائر', type: 'TEXT', required: true },
    { name: 'relationship', label: 'صلة القرابة', type: 'TEXT', required: true },
    { name: 'visitDate', label: 'تاريخ الزيارة', type: 'DATE', required: true },
  ]},
]

const FAC: FormSchema[] = [
  { departmentName: 'أمن المنشآت', departmentCode: 'FAC', recordType: 'FACILITY_REG', title: 'تسجيل منشأة', description: 'تسجيل منشأة قطاع خاص', fields: [
    { name: 'facilityName', label: 'اسم المنشأة', type: 'TEXT', required: true },
    { name: 'facilityType', label: 'نوع المنشأة', type: 'SELECT', required: true, options: ['فندق','مستشفى','بنك','صرافة','محل ذهب','تأجير سيارات','مطعم','قاعة أفراح','شركة أمنية','أخرى'] },
    { name: 'ownerName', label: 'اسم المالك', type: 'TEXT', required: true },
    { name: 'ownerNationalId', label: 'الرقم الوطني', type: 'TEXT', required: false },
    { name: 'phoneNumber', label: 'الهاتف', type: 'TEXT', required: false },
    { name: 'securityGuardCount', label: 'عدد الحراس', type: 'NUMBER', required: false },
    { name: 'cameraSystem', label: 'كاميرات مراقبة', type: 'BOOLEAN', required: false },
  ]},
  { departmentName: 'أمن المنشآت', departmentCode: 'FAC', recordType: 'WEAPON_LICENSE', title: 'ترخيص سلاح', description: 'إصدار ترخيص سلاح', fields: [
    { name: 'licenseNumber', label: 'رقم الترخيص', type: 'TEXT', required: true },
    { name: 'ownerName', label: 'اسم طالب الترخيص', type: 'TEXT', required: true },
    { name: 'weaponType', label: 'نوع السلاح', type: 'SELECT', required: true, options: ['مسدس','بندقية','رشاش','غير قاتل'] },
    { name: 'serialNumber', label: 'الرقم التسلسلي', type: 'TEXT', required: true },
    { name: 'purpose', label: 'غرض الترخيص', type: 'SELECT', required: true, options: ['حماية شخصية','حراسة منشأة','صيد','رياضة'] },
    { name: 'expiryDate', label: 'تاريخ الانتهاء', type: 'DATE', required: true },
  ]},
]

const FOR: FormSchema[] = [
  { departmentName: 'الأدلة الجنائية', departmentCode: 'FOR', recordType: 'FINGERPRINT', title: 'رفع بصمات', description: 'تسجيل رفع بصمات', fields: [
    { name: 'caseNumber', label: 'رقم القضية', type: 'TEXT', required: true },
    { name: 'subjectName', label: 'اسم الشخص', type: 'TEXT', required: false },
    { name: 'fingerprintType', label: 'نوع البصمة', type: 'SELECT', required: true, options: ['إصبع','كف','قدم','حيوي آخر'] },
    { name: 'location', label: 'مكان الرفع', type: 'TEXT', required: true },
    { name: 'date', label: 'تاريخ الرفع', type: 'DATE', required: true },
    { name: 'technicianName', label: 'اسم الفني', type: 'TEXT', required: true },
  ]},
  { departmentName: 'الأدلة الجنائية', departmentCode: 'FOR', recordType: 'CRIME_SCENE', title: 'معاينة مسرح الجريمة', description: 'توثيق مسرح جريمة', fields: [
    { name: 'caseNumber', label: 'رقم القضية', type: 'TEXT', required: true },
    { name: 'location', label: 'الموقع', type: 'TEXT', required: true },
    { name: 'inspectionDate', label: 'تاريخ المعاينة', type: 'DATE', required: true },
    { name: 'sceneDescription', label: 'وصف المسرح', type: 'TEXTAREA', required: true },
    { name: 'evidenceCollected', label: 'الأدلة المجمعة', type: 'TEXTAREA', required: false },
    { name: 'teamMembers', label: 'أعضاء الفريق', type: 'TEXTAREA', required: true },
    { name: 'leadInvestigator', label: 'رئيس الفريق', type: 'TEXT', required: true },
  ]},
]

const OPS: FormSchema[] = [
  { departmentName: 'العمليات', departmentCode: 'OPS', recordType: 'EMERGENCY_REPORT', title: 'بلاغ طوارئ', description: 'استقبال بلاغ طوارئ', fields: [
    { name: 'reportNumber', label: 'رقم البلاغ', type: 'TEXT', required: true },
    { name: 'callerName', label: 'اسم المبلغ', type: 'TEXT', required: true },
    { name: 'callerPhone', label: 'هاتف المبلغ', type: 'TEXT', required: true },
    { name: 'incidentType', label: 'نوع البلاغ', type: 'SELECT', required: true, options: ['حريق','حادث','جريمة','طبية','أمنية','أخرى'] },
    { name: 'location', label: 'الموقع', type: 'TEXT', required: true },
    { name: 'description', label: 'وصف البلاغ', type: 'TEXTAREA', required: true },
    { name: 'severity', label: 'درجة الخطورة', type: 'SELECT', required: true, options: ['حرجة','عالية','متوسطة','عادية'] },
  ]},
  { departmentName: 'العمليات', departmentCode: 'OPS', recordType: 'PATROL_ASSIGN', title: 'توزيع دوريات', description: 'توزيع وإدارة الدوريات', fields: [
    { name: 'patrolNumber', label: 'رقم الدورية', type: 'TEXT', required: true },
    { name: 'area', label: 'منطقة الانتشار', type: 'TEXT', required: true },
    { name: 'officers', label: 'أسماء الأفراد', type: 'TEXTAREA', required: true },
    { name: 'startTime', label: 'وقت البداية', type: 'DATE', required: true },
    { name: 'endTime', label: 'وقت النهاية', type: 'DATE', required: false },
    { name: 'tasks', label: 'المهام المكلفة', type: 'TEXTAREA', required: false },
  ]},
]

const NAR: FormSchema[] = [
  { departmentName: 'مكافحة المخدرات', departmentCode: 'NAR', recordType: 'NARCOTICS_SEIZURE', title: 'ضبط مخدرات', description: 'تسجيل ضبط مواد مخدرة', fields: [
    { name: 'caseNumber', label: 'رقم القضية', type: 'TEXT', required: true },
    { name: 'substanceType', label: 'نوع المادة', type: 'TEXT', required: true },
    { name: 'quantity', label: 'الكمية/الوزن', type: 'TEXT', required: true },
    { name: 'location', label: 'مكان الضبط', type: 'TEXT', required: true },
    { name: 'transportMethod', label: 'وسيلة التهريب', type: 'TEXT', required: false },
    { name: 'suspectName', label: 'اسم المتهم', type: 'TEXT', required: true },
    { name: 'date', label: 'تاريخ الضبط', type: 'DATE', required: true },
  ]},
]

const TRF: FormSchema[] = [
  { departmentName: 'المرور', departmentCode: 'TRF', recordType: 'VEHICLE_REG', title: 'تسجيل مركبة', description: 'تسجيل مركبة جديدة', fields: [
    { name: 'plateNumber', label: 'رقم اللوحة', type: 'TEXT', required: true },
    { name: 'vehicleType', label: 'نوع المركبة', type: 'SELECT', required: true, options: ['سيارة','شاحنة','دراجة','حافلة'] },
    { name: 'make', label: 'الصانع', type: 'TEXT', required: true },
    { name: 'model', label: 'الموديل', type: 'TEXT', required: true },
    { name: 'year', label: 'سنة الصنع', type: 'NUMBER', required: true },
    { name: 'chassisNumber', label: 'رقم الهيكل', type: 'TEXT', required: true },
    { name: 'ownerName', label: 'اسم المالك', type: 'TEXT', required: true },
  ]},
  { departmentName: 'المرور', departmentCode: 'TRF', recordType: 'TRAFFIC_VIOLATION', title: 'مخالفة مرورية', description: 'تسجيل مخالفة مرورية', fields: [
    { name: 'violationNumber', label: 'رقم المخالفة', type: 'TEXT', required: true },
    { name: 'plateNumber', label: 'رقم المركبة', type: 'TEXT', required: true },
    { name: 'violationType', label: 'نوع المخالفة', type: 'SELECT', required: true, options: ['سرعة','إشارة','وقوف','حزام','هاتف','أخرى'] },
    { name: 'location', label: 'الموقع', type: 'TEXT', required: true },
    { name: 'fineAmount', label: 'قيمة الغرامة', type: 'NUMBER', required: true },
    { name: 'date', label: 'تاريخ المخالفة', type: 'DATE', required: true },
  ]},
]

const PAS: FormSchema[] = [
  { departmentName: 'الجوازات', departmentCode: 'PAS', recordType: 'PASSPORT_ISSUE', title: 'إصدار جواز', description: 'طلب إصدار جواز سفر', fields: [
    { name: 'fullName', label: 'الاسم الرباعي', type: 'TEXT', required: true },
    { name: 'nationalId', label: 'الرقم الوطني', type: 'TEXT', required: true },
    { name: 'dateOfBirth', label: 'تاريخ الميلاد', type: 'DATE', required: true },
    { name: 'placeOfBirth', label: 'مكان الميلاد', type: 'TEXT', required: false },
    { name: 'profession', label: 'المهنة', type: 'TEXT', required: false },
    { name: 'address', label: 'العنوان', type: 'TEXT', required: false },
  ]},
]

const CVL: FormSchema[] = [
  { departmentName: 'السجل المدني', departmentCode: 'CVL', recordType: 'BIRTH_CERT', title: 'شهادة ميلاد', description: 'تسجيل واقعة ميلاد', fields: [
    { name: 'childName', label: 'اسم المولود', type: 'TEXT', required: true },
    { name: 'dateOfBirth', label: 'تاريخ الميلاد', type: 'DATE', required: true },
    { name: 'placeOfBirth', label: 'مكان الميلاد', type: 'TEXT', required: true },
    { name: 'fatherName', label: 'اسم الأب', type: 'TEXT', required: true },
    { name: 'motherName', label: 'اسم الأم', type: 'TEXT', required: true },
    { name: 'gender', label: 'الجنس', type: 'SELECT', required: true, options: ['ذكر','أنثى'] },
  ]},
]

const CDO: FormSchema[] = [
  { departmentName: 'الدفاع المدني', departmentCode: 'CDO', recordType: 'FIRE_REPORT', title: 'بلاغ حريق', description: 'تسجيل بلاغ حريق', fields: [
    { name: 'reportNumber', label: 'رقم البلاغ', type: 'TEXT', required: true },
    { name: 'reporterName', label: 'اسم المبلغ', type: 'TEXT', required: true },
    { name: 'location', label: 'موقع الحريق', type: 'TEXT', required: true },
    { name: 'fireType', label: 'نوع الحريق', type: 'SELECT', required: true, options: ['كهربائي','غاز','مواد كيميائية','غابات','منزلي','صناعي'] },
    { name: 'casualties', label: 'عدد الإصابات', type: 'NUMBER', required: false },
    { name: 'responseTeam', label: 'الفريق المستجيب', type: 'TEXT', required: false },
  ]},
]

const BOR: FormSchema[] = [
  { departmentName: 'المنافذ', departmentCode: 'BOR', recordType: 'TRAVELER_ENTRY', title: 'دخول مسافر', description: 'تسجيل دخول مسافر', fields: [
    { name: 'fullName', label: 'الاسم الرباعي', type: 'TEXT', required: true },
    { name: 'passportNumber', label: 'رقم الجواز', type: 'TEXT', required: true },
    { name: 'nationality', label: 'الجنسية', type: 'TEXT', required: true },
    { name: 'origin', label: 'جهة القدوم', type: 'TEXT', required: true },
    { name: 'portName', label: 'اسم المنفذ', type: 'TEXT', required: true },
    { name: 'entryDate', label: 'تاريخ الدخول', type: 'DATE', required: true },
  ]},
  { departmentName: 'المنافذ', departmentCode: 'BOR', recordType: 'SMUGGLING', title: 'ضبط تهريب', description: 'تسجيل قضية تهريب', fields: [
    { name: 'caseNumber', label: 'رقم القضية', type: 'TEXT', required: true },
    { name: 'smuggledGoods', label: 'نوع المهربات', type: 'TEXT', required: true },
    { name: 'quantity', label: 'الكمية', type: 'TEXT', required: false },
    { name: 'transportMethod', label: 'وسيلة التهريب', type: 'TEXT', required: false },
    { name: 'suspectName', label: 'اسم المتهم', type: 'TEXT', required: true },
    { name: 'portName', label: 'اسم المنفذ', type: 'TEXT', required: true },
  ]},
]

const NPR: FormSchema[] = [
  { departmentName: 'الإنتربول', departmentCode: 'NPR', recordType: 'RED_NOTICE', title: 'نشرة حمراء', description: 'إصدار نشرة حمراء دولية', fields: [
    { name: 'fullName', label: 'الاسم الرباعي', type: 'TEXT', required: true },
    { name: 'nationality', label: 'الجنسية', type: 'TEXT', required: true },
    { name: 'crimeType', label: 'نوع الجريمة', type: 'TEXT', required: true },
    { name: 'requestingCountry', label: 'الدولة الطالبة', type: 'TEXT', required: true },
    { name: 'dangerLevel', label: 'درجة الخطورة', type: 'SELECT', required: true, options: ['عالي جداً','عالي','متوسط'] },
    { name: 'physicalMarks', label: 'الأوصاف الجسدية', type: 'TEXTAREA', required: false },
  ]},
]

const FMP: FormSchema[] = [
  { departmentName: 'حماية الأسرة', departmentCode: 'FMP', recordType: 'DOMESTIC_ABUSE', title: 'بلاغ عنف أسري', description: 'تسجيل بلاغ عنف أسري', fields: [
    { name: 'victimName', label: 'اسم الضحية', type: 'TEXT', required: true },
    { name: 'victimAge', label: 'عمر الضحية', type: 'NUMBER', required: false },
    { name: 'abuserName', label: 'اسم المعتدي', type: 'TEXT', required: true },
    { name: 'relationship', label: 'صلة القرابة', type: 'TEXT', required: true },
    { name: 'violenceType', label: 'نوع العنف', type: 'SELECT', required: true, options: ['جسدي','نفسي','جنسي','اقتصادي'] },
    { name: 'incidentDate', label: 'تاريخ الحادثة', type: 'DATE', required: true },
    { name: 'description', label: 'تفاصيل البلاغ', type: 'TEXTAREA', required: true },
  ]},
]

const VST: FormSchema[] = [
  { departmentName: 'بوابة المراجعين', departmentCode: 'VST', recordType: 'VISITOR_REG', title: 'تسجيل زائر', description: 'تسجيل زائر للمنشأة', fields: [
    { name: 'fullName', label: 'الاسم الرباعي', type: 'TEXT', required: true },
    { name: 'nationalId', label: 'الرقم الوطني', type: 'TEXT', required: true },
    { name: 'phoneNumber', label: 'رقم الهاتف', type: 'TEXT', required: false },
    { name: 'targetDepartment', label: 'الإدارة المقصودة', type: 'TEXT', required: true },
    { name: 'visitReason', label: 'سبب الزيارة', type: 'TEXTAREA', required: false },
    { name: 'entryTime', label: 'وقت الدخول', type: 'DATE', required: true },
  ]},
]

const CGD: FormSchema[] = [
  { departmentName: 'خفر السواحل', departmentCode: 'CGD', recordType: 'VESSEL_REG', title: 'تسجيل قارب', description: 'تسجيل قطعة بحرية', fields: [
    { name: 'vesselName', label: 'اسم القارب', type: 'TEXT', required: true },
    { name: 'registrationNumber', label: 'رقم التسجيل', type: 'TEXT', required: true },
    { name: 'vesselType', label: 'نوع القارب', type: 'SELECT', required: true, options: ['صيد','نقل','سياحي','شراعي'] },
    { name: 'ownerName', label: 'اسم المالك', type: 'TEXT', required: true },
    { name: 'crewCount', label: 'عدد الطاقم', type: 'NUMBER', required: false },
    { name: 'homePort', label: 'ميناء التسجيل', type: 'TEXT', required: false },
  ]},
]

const SOC: FormSchema[] = [
  { departmentName: 'نظم المعلومات', departmentCode: 'SOC', recordType: 'USER_ADD', title: 'إضافة مستخدم', description: 'إضافة مستخدم للنظام', fields: [
    { name: 'fullName', label: 'الاسم الرباعي', type: 'TEXT', required: true },
    { name: 'militaryId', label: 'الرقم العسكري', type: 'TEXT', required: true },
    { name: 'rank', label: 'الرتبة', type: 'TEXT', required: true },
    { name: 'position', label: 'المنصب', type: 'TEXT', required: true },
    { name: 'department', label: 'الإدارة', type: 'TEXT', required: true },
    { name: 'username', label: 'اسم المستخدم', type: 'TEXT', required: true },
    { name: 'password', label: 'كلمة المرور', type: 'TEXT', required: true },
    { name: 'phoneNumber', label: 'الهاتف', type: 'TEXT', required: false },
  ]},
  { departmentName: 'نظم المعلومات', departmentCode: 'SOC', recordType: 'PERMISSION_GRANT', title: 'منح الصلاحيات', description: 'منح صلاحيات لمستخدم', fields: [
    { name: 'username', label: 'اسم المستخدم', type: 'TEXT', required: true },
    { name: 'targetDepartment', label: 'الإدارة المستهدفة', type: 'TEXT', required: true },
    { name: 'permissionType', label: 'نوع الصلاحية', type: 'MULTI_SELECT', required: true, options: ['قراءة','كتابة','تعديل','حذف'] },
    { name: 'accessLevel', label: 'مستوى الوصول', type: 'SELECT', required: true, options: ['1-وطني','2-محافظة','3-إدارة','4-قسم','5-وحدة'] },
  ]},
]

const HR1: FormSchema[] = [
  { departmentName: 'شؤون الضباط', departmentCode: 'HR1', recordType: 'PROMOTION', title: 'ترقية ضابط', description: 'طلب ترقية ضابط', fields: [
    { name: 'officerName', label: 'اسم الضابط', type: 'TEXT', required: true },
    { name: 'currentRank', label: 'الرتبة الحالية', type: 'TEXT', required: true },
    { name: 'newRank', label: 'الرتبة المطلوبة', type: 'TEXT', required: true },
    { name: 'promotionDate', label: 'تاريخ الترقية', type: 'DATE', required: true },
    { name: 'reason', label: 'سبب الترقية', type: 'TEXTAREA', required: false },
  ]},
]

const HR2: FormSchema[] = [
  { departmentName: 'شؤون الأفراد', departmentCode: 'HR2', recordType: 'LEAVE_REQUEST', title: 'طلب إجازة', description: 'طلب إجازة', fields: [
    { name: 'name', label: 'الاسم', type: 'TEXT', required: true },
    { name: 'militaryId', label: 'الرقم العسكري', type: 'TEXT', required: true },
    { name: 'leaveType', label: 'نوع الإجازة', type: 'SELECT', required: true, options: ['سنوية','مرضية','طارئة','أمومة','أبوة','تدريبية'] },
    { name: 'startDate', label: 'تاريخ البداية', type: 'DATE', required: true },
    { name: 'endDate', label: 'تاريخ النهاية', type: 'DATE', required: true },
    { name: 'reason', label: 'السبب', type: 'TEXTAREA', required: false },
  ]},
]

const ADM: FormSchema[] = [
  { departmentName: 'التعميمات والقرارات', departmentCode: 'ADM', recordType: 'CIRCULAR', title: 'إصدار تعميم', description: 'إصدار تعميم رسمي', fields: [
    { name: 'circularNumber', label: 'رقم التعميم', type: 'TEXT', required: true },
    { name: 'subject', label: 'الموضوع', type: 'TEXT', required: true },
    { name: 'content', label: 'نص التعميم', type: 'TEXTAREA', required: true },
    { name: 'targetEntities', label: 'الجهات المستهدفة', type: 'TEXTAREA', required: false },
    { name: 'issueDate', label: 'تاريخ الإصدار', type: 'DATE', required: true },
    { name: 'priority', label: 'درجة الأهمية', type: 'SELECT', required: true, options: ['عاجل','هام','عادي'] },
  ]},
]

export const ALL_DEPARTMENT_SCHEMAS: Record<string, FormSchema[]> = {
  CRI, PRS, FAC, FOR, OPS, NAR, TRF, PAS, CVL, CDO, BOR, NPR, FMP, VST, CGD, SOC, HR1, HR2, ADM,
}

export const DEPARTMENT_NAMES: Record<string, string> = {
  CRI: 'البحث الجنائي', PRS: 'السجون', FAC: 'أمن المنشآت', FOR: 'الأدلة الجنائية',
  OPS: 'العمليات', NAR: 'مكافحة المخدرات', TRF: 'المرور', PAS: 'الجوازات',
  CVL: 'السجل المدني', CDO: 'الدفاع المدني', BOR: 'المنافذ', NPR: 'الإنتربول',
  FMP: 'حماية الأسرة', VST: 'بوابة المراجعين', CGD: 'خفر السواحل', SOC: 'نظم المعلومات',
  HR1: 'شؤون الضباط', HR2: 'شؤون الأفراد', ADM: 'التعميمات والقرارات',
}