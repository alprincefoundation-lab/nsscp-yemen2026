/**
 * Store types for the golden-ratio tactical store
 */

export interface ProvinceThreat {
  id: string;
  lat: number;
  lng: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: 'drone' | 'ied' | 'military_convoy' | 'border_incursion' | 'smuggling_route' | 'communication_intercept' | 'suspected_surveillance' | 'patrol_sighting';
  label: string;
  region: string;
  color: string;
  ts: number;
}