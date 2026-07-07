// NSSCP System Data Models

export interface Province {
  id: string;
  name: string;
  code: string;
  districts: string[];
  departments?: Department[];
}

export interface Department {
  id: string;
  name: string;
  code: string;
  provinceId: string;
  icon?: string;
  description?: string;
  subdepartments?: Subdepartment[];
}

export interface Subdepartment {
  id: string;
  name: string;
  departmentId: string;
  tasks?: Task[];
}

export interface Task {
  id: string;
  name: string;
  subdepartmentId: string;
  description?: string;
}

// Level 1 - Ministry Center Data
export const ministryDepartments: Department[] = [
  {
    id: 'dept-1',
    name: 'إدارة المستخدمين',
    code: 'USER_MGMT',
    provinceId: 'ministry',
    description: 'إدارة المستخدمين والصلاحيات'
  },
  {
    id: 'dept-2',
    name: 'الملاحقة الجنائية',
    code: 'CRIMINAL_PURSUIT',
    provinceId: 'ministry',
    description: 'متابعة المطلوبين أمنياً'
  },
  {
    id: 'dept-3',
    name: 'التقارير والإحصائيات',
    code: 'REPORTS',
    provinceId: 'ministry',
    description: 'إدارة التقارير والبيانات'
  },
  {
    id: 'dept-4',
    name: 'إدارة نظم المعلومات',
    code: 'IT',
    provinceId: 'ministry',
    description: 'إدارة الأنظمة والتكنولوجيا'
  },
  {
    id: 'dept-5',
    name: 'إدارة العمليات',
    code: 'OPERATIONS',
    provinceId: 'ministry',
    description: 'إدارة العمليات الأمنية'
  },
  {
    id: 'dept-6',
    name: 'إدارة شؤون الضباط',
    code: 'OFFICERS',
    provinceId: 'ministry',
    description: 'إدارة شؤون الضباط'
  },
  {
    id: 'dept-7',
    name: 'إدارة شؤون الأفراد',
    code: 'PERSONNEL',
    provinceId: 'ministry',
    description: 'إدارة شؤون الأفراد'
  },
  {
    id: 'dept-8',
    name: 'مركز التعميمات والقرارات',
    code: 'CIRCULARS',
    provinceId: 'ministry',
    description: 'إدارة التعميمات والقرارات'
  },
  {
    id: 'dept-9',
    name: 'إدارة البحث الجنائي',
    code: 'CRIMINAL_INVESTIGATION',
    provinceId: 'ministry',
    description: 'البحث الجنائي والتحقيقات'
  },
  {
    id: 'dept-10',
    name: 'إدارة شرطة المرور',
    code: 'TRAFFIC',
    provinceId: 'ministry',
    description: 'إدارة المرور والحوادث'
  },
  {
    id: 'dept-11',
    name: 'مصلحة الهجرة والجوازات',
    code: 'IMMIGRATION',
    provinceId: 'ministry',
    description: 'الجوازات والهجرة'
  },
  {
    id: 'dept-12',
    name: 'مصلحة الاحوال المدنية',
    code: 'CIVIL_REGISTRY',
    provinceId: 'ministry',
    description: 'السجل المدني والأحوال'
  },
  {
    id: 'dept-13',
    name: 'مصلحة مكافحة المخدرات',
    code: 'NARCOTICS',
    provinceId: 'ministry',
    description: 'مكافحة المخدرات'
  },
  {
    id: 'dept-14',
    name: 'مصلحة السجون',
    code: 'PRISONS',
    provinceId: 'ministry',
    description: 'إدارة السجون'
  },
  {
    id: 'dept-15',
    name: 'مصلحة خفر السواحل',
    code: 'COAST_GUARD',
    provinceId: 'ministry',
    description: 'خفر السواحل والأمن البحري'
  },
  {
    id: 'dept-16',
    name: 'الامن الوطني',
    code: 'NATIONAL_SECURITY',
    provinceId: 'ministry',
    description: 'الأمن الوطني'
  },
  {
    id: 'dept-17',
    name: 'ادارة الادلة الجنائية',
    code: 'FORENSICS',
    provinceId: 'ministry',
    description: 'الأدلة الجنائية والسجل الجنائي'
  },
  {
    id: 'dept-18',
    name: 'إدارة أمن المنافذ',
    code: 'BORDER_SECURITY',
    provinceId: 'ministry',
    description: 'أمن المنافذ والحدود'
  },
  {
    id: 'dept-19',
    name: 'إدارة الدفاع المدني',
    code: 'CIVIL_DEFENSE',
    provinceId: 'ministry',
    description: 'الدفاع المدني والطوارئ'
  },
  {
    id: 'dept-20',
    name: 'إدارة شرطة النجدة',
    code: 'EMERGENCY_POLICE',
    provinceId: 'ministry',
    description: 'شرطة النجدة والطوارئ'
  },
  {
    id: 'dept-21',
    name: 'إدارة أمن الطرق',
    code: 'ROAD_SECURITY',
    provinceId: 'ministry',
    description: 'أمن الطرق والنقاط الأمنية'
  },
  {
    id: 'dept-22',
    name: 'إدارة الإنتربول الدولي',
    code: 'INTERPOL',
    provinceId: 'ministry',
    description: 'التعاون الدولي والإنتربول'
  },
  {
    id: 'dept-23',
    name: 'إدارة أمن المنشآت',
    code: 'FACILITIES_SECURITY',
    provinceId: 'ministry',
    description: 'أمن المنشآت وحماية الشخصيات'
  },
  {
    id: 'dept-24',
    name: 'الشرطة النسائية',
    code: 'WOMEN_POLICE',
    provinceId: 'ministry',
    description: 'الشرطة النسائية وحماية الأسرة'
  }
];

// 22 Yemeni Provinces
export const provinces: Province[] = [
  {
    id: 'prov-1',
    name: 'ديوان وزارة الداخلية',
    code: 'MINISTRY',
    districts: []
  },
  {
    id: 'prov-2',
    name: 'أمانة العاصمة',
    code: 'CAPITAL',
    districts: ['صنعاء القديمة', 'صنعاء الجديدة', 'بني هاشم', 'الوحدة']
  },
  {
    id: 'prov-3',
    name: 'محافظة عدن',
    code: 'ADEN',
    districts: ['المعلا', 'كريتر', 'البريقة', 'تواهي', 'الشيخ عثمان']
  },
  {
    id: 'prov-4',
    name: 'محافظة تعز',
    code: 'TAIZ',
    districts: ['التعيزية', 'الوازعية', 'الشماية', 'السلامة', 'صيرة']
  },
  {
    id: 'prov-5',
    name: 'محافظة حضرموت',
    code: 'HADRAMAUT',
    districts: ['المكلا', 'الشحر', 'سيئون', 'تريم', 'سيحوت']
  },
  {
    id: 'prov-6',
    name: 'محافظة الحديدة',
    code: 'HODAIDAH',
    districts: ['الحديدة', 'الدريهمي', 'الحجيمة', 'باجل', 'كوكبان']
  },
  {
    id: 'prov-7',
    name: 'محافظة إب',
    code: 'IBBAB',
    districts: ['إب', 'القفر', 'يافع', 'جبلة', 'السبرة']
  },
  {
    id: 'prov-8',
    name: 'محافظة ذمار',
    code: 'DHAMAR',
    districts: ['ذمار', 'الحسيني', 'الرويضة', 'عنس', 'كمران']
  },
  {
    id: 'prov-9',
    name: 'محافظة مأرب',
    code: 'MARIB',
    districts: ['مأرب', 'البيضاء', 'أرحب', 'الجوبة', 'كشيار']
  },
  {
    id: 'prov-10',
    name: 'محافظة البيضاء',
    code: 'ALBAIDHA',
    districts: ['البيضاء', 'العود', 'المسيلة', 'الجوفة', 'الوادعة']
  },
  {
    id: 'prov-11',
    name: 'محافظة الجوف',
    code: 'ALJOUF',
    districts: ['المراوعة', 'الحزم', 'خمر', 'ما الجوف', 'الغيل']
  },
  {
    id: 'prov-12',
    name: 'محافظة شبوة',
    code: 'SHABWAH',
    districts: ['عتق', 'الغيضة', 'حوف', 'مريمة', 'بلحارث']
  },
  {
    id: 'prov-13',
    name: 'محافظة المه��ة',
    code: 'ALMAHRAH',
    districts: ['الغيضة', 'ثمريت', 'الخابة', 'سالم', 'قصيعر']
  },
  {
    id: 'prov-14',
    name: 'محافظة صعدة',
    code: 'SAADA',
    districts: ['صعدة', 'كتاف', 'الدعيم', 'رازح', 'مران']
  },
  {
    id: 'prov-15',
    name: 'محافظة عمران',
    code: 'AMRAN',
    districts: ['عمران', 'صبر الموادع', 'خمر الغيل', 'عقاب الهجر', 'سحار']
  },
  {
    id: 'prov-16',
    name: 'محافظة حجة',
    code: 'HAJJAH',
    districts: ['حجة', 'الجراحي', 'الطور', 'المجاعة', 'ميدي']
  },
  {
    id: 'prov-17',
    name: 'محافظة المحويت',
    code: 'ALMAHWIT',
    districts: ['المحويت', 'ريمة', 'كشمير', 'بيت الفقيه', 'دهاب']
  },
  {
    id: 'prov-18',
    name: 'محافظة ريمة',
    code: 'RAIMAH',
    districts: ['ريمة', 'الجعيفرة', 'كسمة', 'قسم باب', 'الجديرة']
  },
  {
    id: 'prov-19',
    name: 'محافظة الضالع',
    code: 'DHALEA',
    districts: ['الضالع', 'ردفان', 'قعطبة', 'دمت', 'هبيل']
  },
  {
    id: 'prov-20',
    name: 'محافظة لحج',
    code: 'LAHIJ',
    districts: ['لحج', 'المراوعة', 'يافع', 'حوف', 'الشارقية']
  },
  {
    id: 'prov-21',
    name: 'محافظة أبين',
    code: 'ABYAN',
    districts: ['زنجبار', 'الشرقية', 'شبام', 'جعار', 'كود']
  },
  {
    id: 'prov-22',
    name: 'محافظة أرخبيل سقطرى',
    code: 'SOCOTRA',
    districts: ['عدن القرى', 'ديسم', 'قنوبة', 'درسة', 'جيزيرة عبد الكوري']
  },
  {
    id: 'prov-23',
    name: 'محافظة صنعاء',
    code: 'SANAA',
    districts: ['سنحان', 'خمر', 'الروضة', 'صعيفة', 'بني مطر']
  }
];

export const mainMenuItems = [
  {
    id: 'tactical',
    name: 'لوحة مركز القيادة التكتيكية',
    englishName: 'TACTICAL DASHBOARD PORTAL',
    icon: 'Zap',
    path: '/tactical-dashboard'
  },
  {
    id: 'hierarchy',
    name: 'الهيكل التنظيمي العام',
    englishName: 'GENERAL HIERARCHY SYSTEM',
    icon: 'Layers',
    path: '/organizational-hierarchy'
  }
];
