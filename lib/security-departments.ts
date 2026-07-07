// نظام الأقسام الأمنية المتخصصة
// Specialized Security Departments System

export const securityDepartments = [
  {
    id: 'criminal-investigation',
    name: 'البحث الجنائي',
    englishName: 'Criminal Investigation',
    icon: '🔍',
    sections: [
      {
        id: 'general-investigation',
        name: 'البحث الجنائي الموحد والتحليل',
        englishName: 'General Investigation & Analysis'
      },
      {
        id: 'national-security',
        name: 'الأدلة الجنائية والتدريب',
        englishName: 'Forensics & Training'
      },
      {
        id: 'drug-enforcement',
        name: 'مكافحة المخدرات والتوعية',
        englishName: 'Drug Enforcement & Awareness'
      },
      {
        id: 'youth-crimes',
        name: 'شؤون الأفراد والتدريب',
        englishName: 'Personal Affairs & Training'
      }
    ],
    forms: ['complaints', 'investigations', 'criminal_record', 'wanted_persons', 'daily_reports'],
    dashboardColor: '#0066cc'
  },
  {
    id: 'police-operations',
    name: 'عمليات الشرطة',
    englishName: 'Police Operations',
    icon: '👮',
    sections: [
      {
        id: 'vehicle-control',
        name: 'شرطة السير والمرور',
        englishName: 'Traffic Police'
      },
      {
        id: 'facility-protection',
        name: 'حماية المنشآت ودراسة الشخصيات',
        englishName: 'Facility Protection'
      },
      {
        id: 'path-security',
        name: 'شرطة الدوريات وأمن الطرق',
        englishName: 'Patrol & Road Security'
      },
      {
        id: 'identification',
        name: 'الشرطة الدولية والمديريات',
        englishName: 'International Police'
      },
      {
        id: 'police-leadership',
        name: 'أقسام الشرطة والمديريات',
        englishName: 'Police Departments'
      }
    ],
    forms: ['crime_report', 'daily_report', 'investigations'],
    dashboardColor: '#00aa00'
  },
  {
    id: 'drug-control',
    name: 'مكافحة المخدرات',
    englishName: 'Drug Control',
    icon: '🚫',
    sections: [
      {
        id: 'enforcement',
        name: 'التنفيذ والمداهمات',
        englishName: 'Enforcement Operations'
      },
      {
        id: 'investigations',
        name: 'التحقيقات والتحريات',
        englishName: 'Investigations'
      }
    ],
    forms: ['crime_report', 'investigations', 'daily_reports'],
    dashboardColor: '#cc0000'
  },
  {
    id: 'juvenile-crimes',
    name: 'شرطة الأحداث',
    englishName: 'Juvenile Police',
    icon: '👦',
    sections: [
      {
        id: 'prevention',
        name: 'الوقاية والتدخل المبكر',
        englishName: 'Prevention & Intervention'
      },
      {
        id: 'rehabilitation',
        name: 'إعادة التأهيل والرعاية',
        englishName: 'Rehabilitation'
      }
    ],
    forms: ['complaints', 'investigations', 'daily_reports'],
    dashboardColor: '#9933cc'
  },
  {
    id: 'forensics',
    name: 'الأدلة الجنائية',
    englishName: 'Forensics',
    icon: '🔬',
    sections: [
      {
        id: 'crime-scene',
        name: 'قسم مسرح الجريمة',
        englishName: 'Crime Scene'
      },
      {
        id: 'personal-investigation',
        name: 'قسم التحقيقات الشخصية',
        englishName: 'Personal Investigation'
      },
      {
        id: 'forgery',
        name: 'قسم التزوير والتزييف',
        englishName: 'Forgery Detection'
      },
      {
        id: 'crimes-expert',
        name: 'قسم خبير الجرائم',
        englishName: 'Crimes Expert'
      },
      {
        id: 'handwriting',
        name: 'قسم خبير الاكتتاب',
        englishName: 'Handwriting Expert'
      },
      {
        id: 'chemistry',
        name: 'قسم خبير الكيمياء والسموم',
        englishName: 'Chemistry & Toxicology'
      },
      {
        id: 'weapons',
        name: 'قسم خبير السلاح',
        englishName: 'Weapons Expert'
      },
      {
        id: 'biology',
        name: 'قسم خبير الأحياء',
        englishName: 'Biology Expert'
      }
    ],
    forms: ['investigations', 'forensics_report'],
    dashboardColor: '#0099cc'
  },
  {
    id: 'women-police',
    name: 'الشرطة النسائية',
    englishName: 'Women Police',
    icon: '👩‍🦰',
    sections: [
      {
        id: 'protection',
        name: 'حماية النساء والأطفال',
        englishName: 'Women & Children Protection'
      }
    ],
    forms: ['complaints', 'investigations'],
    dashboardColor: '#ff66cc'
  },
  {
    id: 'civil-defense',
    name: 'الدفاع المدني',
    englishName: 'Civil Defense',
    icon: '🚒',
    sections: [
      {
        id: 'rescue',
        name: 'الإنقاذ والإطفاء',
        englishName: 'Rescue & Fire Fighting'
      },
      {
        id: 'prevention',
        name: 'الوقاية والسلامة',
        englishName: 'Prevention & Safety'
      }
    ],
    forms: ['emergency_report', 'daily_reports'],
    dashboardColor: '#ff6600'
  },
  {
    id: 'emergency-forces',
    name: 'قوات الطوارئ',
    englishName: 'Emergency Forces',
    icon: '🚨',
    sections: [
      {
        id: 'rapid-response',
        name: 'الاستجابة السريعة',
        englishName: 'Rapid Response'
      }
    ],
    forms: ['emergency_report'],
    dashboardColor: '#ff0000'
  },
  {
    id: 'interpol',
    name: 'الشرطة الدولية',
    englishName: 'Interpol',
    icon: '🌍',
    sections: [
      {
        id: 'international-wanted',
        name: 'قائمة المطلوبين الدوليين',
        englishName: 'International Wanted List'
      },
      {
        id: 'coordination',
        name: 'التنسيق الدولي',
        englishName: 'International Coordination'
      }
    ],
    forms: ['wanted_persons', 'international_reports'],
    dashboardColor: '#003366'
  },
  {
    id: 'prisons',
    name: 'الاحتجاز والسجون',
    englishName: 'Prisons & Detention',
    icon: '🔒',
    sections: [
      {
        id: 'detention',
        name: 'إدارة الاحتجاز',
        englishName: 'Detention Management'
      },
      {
        id: 'prisoner-records',
        name: 'تسجيل السجناء',
        englishName: 'Prisoner Records'
      }
    ],
    forms: ['prisoner_registration', 'detention_records'],
    dashboardColor: '#666666'
  },
  {
    id: 'facility-security',
    name: 'حماية المنشآت',
    englishName: 'Facility Security',
    icon: '🏢',
    sections: [
      {
        id: 'facility-registration',
        name: 'تسجيل المنشآت والشركات',
        englishName: 'Facility Registration'
      },
      {
        id: 'license-approval',
        name: 'معالجة الرخص والموافقات',
        englishName: 'License & Approval Processing'
      },
      {
        id: 'facility-reports',
        name: 'تقارير وتحريات المنشآت',
        englishName: 'Facility Reports & Investigations'
      }
    ],
    forms: ['facility_request', 'facility_registration', 'facility_reports'],
    dashboardColor: '#cc6600'
  },
  {
    id: 'emergency-call',
    name: 'شرطة النجدة',
    englishName: 'Emergency Call Center',
    icon: '📞',
    sections: [
      {
        id: 'call-dispatch',
        name: 'استقبال البلاغات والتوجيه',
        englishName: 'Call Reception & Dispatch'
      }
    ],
    forms: ['emergency_report', 'dispatch_log'],
    dashboardColor: '#ff3300'
  },
  {
    id: 'information-systems',
    name: 'إدارة نظم المعلومات',
    englishName: 'Information Systems Management',
    icon: '💻',
    sections: [
      {
        id: 'data-management',
        name: 'إدارة البيانات والتسجيل',
        englishName: 'Data & Registration Management'
      },
      {
        id: 'system-security',
        name: 'أمان الأنظمة والشبكات',
        englishName: 'System Security'
      }
    ],
    forms: ['data_report', 'system_report'],
    dashboardColor: '#0066ff'
  }
];

// خريطة الأدوار والصلاحيات
export const roleMappings = {
  'general-admin': { access: ['all'], level: 5 },
  'crime-chief': { access: ['criminal-investigation'], level: 4 },
  'police-chief': { access: ['police-operations', 'prisons'], level: 4 },
  'security-officer': { access: ['police-operations', 'facility-security'], level: 3 },
  'investigator': { access: ['criminal-investigation', 'forensics'], level: 2 },
  'officer': { access: ['daily-reports'], level: 1 }
};
