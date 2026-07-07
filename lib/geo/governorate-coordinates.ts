/**
 * Yemen Governorate Geographic Coordinates
 * 22 governorates + approximate centroid coordinates
 * Used for map FlyTo navigation on province selection
 */

export interface GovernorateGeo {
  name: string;
  code: string;
  nameEn: string;
  /** [latitude, longitude] */
  center: [number, number];
  /** Default zoom level for this governorate */
  zoom: number;
}

export const YEMEN_CENTER: [number, number] = [15.552727, 48.516388];
export const YEMEN_DEFAULT_ZOOM = 7;

export const GOVERNORATE_COORDINATES: GovernorateGeo[] = [
  { name: 'أمانة العاصمة', nameEn: 'Amanat Al Asimah', code: 'AMN', center: [15.3694, 44.1910], zoom: 12 },
  { name: 'عدن', nameEn: 'Aden', code: 'ADN', center: [12.7855, 45.0187], zoom: 13 },
  { name: 'صنعاء', nameEn: "Sana'a", code: 'SAN', center: [15.3694, 44.1910], zoom: 12 },
  { name: 'تعز', nameEn: 'Taiz', code: 'TAI', center: [13.5776, 44.0178], zoom: 13 },
  { name: 'الحديدة', nameEn: 'Al Hudaydah', code: 'HUD', center: [14.7978, 42.9530], zoom: 12 },
  { name: 'حضرموت', nameEn: 'Hadramawt', code: 'HDN', center: [15.9390, 48.7865], zoom: 10 },
  { name: 'إب', nameEn: 'Ibb', code: 'IBB', center: [13.9667, 44.1833], zoom: 13 },
  { name: 'ذمار', nameEn: 'Dhamar', code: 'DHA', center: [14.5577, 44.4041], zoom: 13 },
  { name: 'شبوة', nameEn: 'Shabwah', code: 'SHW', center: [14.5545, 46.8280], zoom: 11 },
  { name: 'أبين', nameEn: 'Abyan', code: 'ABN', center: [13.4333, 45.4500], zoom: 12 },
  { name: 'لحج', nameEn: 'Lahij', code: 'LAH', center: [13.0567, 44.8819], zoom: 13 },
  { name: 'صعدة', nameEn: "Sa'dah", code: 'SAD', center: [16.9398, 43.7598], zoom: 12 },
  { name: 'مأرب', nameEn: 'Marib', code: 'MAR', center: [15.6153, 45.3130], zoom: 12 },
  { name: 'الجوف', nameEn: 'Al Jawf', code: 'JAW', center: [16.5500, 44.8000], zoom: 11 },
  { name: 'البيضاء', nameEn: 'Al Bayda', code: 'BAY', center: [13.9833, 45.5667], zoom: 12 },
  { name: 'حجة', nameEn: 'Hajjah', code: 'HAG', center: [15.6917, 43.6021], zoom: 12 },
  { name: 'المهرة', nameEn: 'Al Mahrah', code: 'MHR', center: [16.8000, 51.7333], zoom: 10 },
  { name: 'المحويت', nameEn: 'Al Mahwit', code: 'MWI', center: [15.4701, 43.5448], zoom: 13 },
  { name: 'الضالع', nameEn: 'Ad Dali', code: 'DHL', center: [13.7000, 44.7333], zoom: 13 },
  { name: 'عمران', nameEn: 'Amran', code: 'AMR', center: [15.6594, 43.9439], zoom: 13 },
  { name: 'ريمة', nameEn: 'Raymah', code: 'RAY', center: [14.6400, 43.7100], zoom: 13 },
  { name: 'سقطرى', nameEn: 'Socotra', code: 'SQT', center: [12.5000, 53.8333], zoom: 11 },
];

/**
 * Find governorate geo data by name (Arabic or English) or code
 */
export function findGovernorateGeo(
  query: string,
): GovernorateGeo | undefined {
  return GOVERNORATE_COORDINATES.find(
    (g) =>
      g.name === query ||
      g.nameEn.toLowerCase() === query.toLowerCase() ||
      g.code === query.toUpperCase(),
  );
}
