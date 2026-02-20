export const FULTON_ZIP_CODES = [
  '30002', '30004', '30005', '30008', '30009', '30022', '30024', '30060',
  '30075', '30076', '30080', '30082', '30092', '30097', '30238', '30268',
  '30281', '30290', '30291', '30294', '30296', '30297', '30303', '30305',
  '30306', '30307', '30308', '30309', '30310', '30311', '30312', '30313',
  '30314', '30315', '30316', '30317', '30318', '30319', '30320', '30321',
  '30322', '30324', '30325', '30326', '30327', '30328', '30329', '30331',
  '30332', '30334', '30336', '30337', '30338', '30339', '30340', '30341',
  '30342', '30344', '30345', '30346', '30347', '30348', '30349', '30350',
  '30353', '30354', '30355', '30356', '30357', '30358', '30359', '30360',
  '30361', '30362', '30363', '30364', '30366', '30368', '30369', '30370',
  '30371', '30374', '30375', '30376', '30377', '30378', '30379', '30380',
  '30384', '30385', '30386', '30387', '30388', '30389', '30390', '30392',
  '30394', '30396', '30398', '31106', '31107', '31119', '31126', '31131',
  '31136', '31139', '31141', '31145', '31146', '31150', '31156', '31192',
  '31193', '31195', '31196', '39901'
];

export const CATEGORIES = [
  { id: 'Food', label: 'Food', icon: 'https://img.icons8.com/?size=100&id=5eq6oiP3hfPe&format=png&color=000000' },
  { id: 'Housing', label: 'Housing', icon: 'https://img.icons8.com/?size=100&id=SMY8y2KifwMB&format=png&color=000000' },
  { id: 'Healthcare', label: 'Healthcare', icon: 'https://img.icons8.com/?size=100&id=14799&format=png&color=000000' },
  { id: 'Mental Health', label: 'Mental Health', icon: 'https://img.icons8.com/?size=100&id=DYuG8jKiYeUD&format=png&color=000000' },
  { id: 'Transportation', label: 'Transportation', icon: 'https://img.icons8.com/?size=100&id=15158&format=png&color=000000' },
  { id: 'Utilities', label: 'Utilities', icon: 'https://img.icons8.com/?size=100&id=20544&format=png&color=000000' },
  { id: 'Employment', label: 'Employment', icon: 'https://img.icons8.com/?size=100&id=104075&format=png&color=000000' },
  { id: 'Financial', label: 'Financial', icon: 'https://img.icons8.com/?size=100&id=20777&format=png&color=000000' },
  { id: 'Legal', label: 'Legal', icon: 'https://img.icons8.com/?size=100&id=20777&format=png&color=000000' },
  { id: 'Youth Services', label: 'Youth Services', icon: 'https://img.icons8.com/?size=100&id=12928&format=png&color=000000' },
  { id: 'Family Services', label: 'Family Services', icon: 'https://img.icons8.com/?size=100&id=Bmk25pRSmDNS&format=png&color=000000' },
];

export const CRISIS_HOTLINES = [
  {
    name: '988 Suicide & Crisis Lifeline',
    phone: '988',
    description: 'Call or text 988 for mental health crisis support',
    available: '24/7'
  },
  {
    name: '911',
    phone: '911',
    description: 'Emergency services for immediate danger',
    available: '24/7'
  },
  {
    name: '211',
    phone: '211',
    description: 'Find local community resources and services',
    available: '24/7'
  }
];

export const MAP_CENTER: [number, number] = [33.7490, -84.3880];
export const MAP_ZOOM = 10;

export const CATEGORY_COLORS: Record<string, string> = {
  Food: '#16a34a',
  Housing: '#dc2626',
  Shelter: '#ea580c',
  Healthcare: '#2563eb',
  'Mental Health': '#9333ea',
  Transportation: '#0891b2',
  Utilities: '#eab308',
  Employment: '#7c3aed',
  Financial: '#059669',
  Legal: '#0f766e',
  'Youth Services': '#ec4899',
  'Family Services': '#8b5cf6',
  default: '#6b7280',
};
