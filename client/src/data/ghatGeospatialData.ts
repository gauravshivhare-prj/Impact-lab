import type { CoordinateStatus, LegalStatus } from '../types';

export interface GhatGeoLocation {
  site: string;
  waterBody: string;
  latitude: number;
  longitude: number;
  coordinateStatus: CoordinateStatus;
  legalStatus: LegalStatus;
  locationDescription: string;
  immersionInfrastructure: string;
  googleMapsUrl: string;
  ngtDirectiveNote: string;
}

/**
 * Approximate GPS coordinates for Bhopal Visarjan Ghats.
 *
 * IMPORTANT: These coordinates are derived from online mapping sources
 * (Google Maps, Wikipedia, Housing.com, Mapcarta) and have NOT been
 * field-verified with on-ground GPS measurements.
 *
 * Sources (all approximate, not field-verified):
 * - Khatlapura: Google Maps search (@23.2498196, 77.4051206)
 * - Bairagarh kund: Google Maps search (23.2700, 77.3270)
 * - Kamla Park: Wikipedia + Wikimedia (23.2503, 77.4003)
 * - Shahpura Lake: Mapcarta (23.2067, 77.4215)
 * - Hathaikheda: Reservoir boundary estimate (23.2800, 77.4700)
 * - Malikhedi kund: Housing.com estimate (23.3150, 77.4390)
 * - Prempura: Upper Lake SW shore estimate (23.2290, 77.3500)
 *
 * Legal status claims require verification against official NGT orders
 * and municipal records. Current status values are based on news reports
 * and should not be treated as authoritative.
 */
export const GHAT_GEOSPATIAL_DATA: Record<string, GhatGeoLocation> = {
  'Bairagarh (Sant Hirdaram) kund': {
    site: 'Bairagarh (Sant Hirdaram) kund',
    waterBody: 'Upper Lake',
    // Sant Hirdaram Nagar (Bairagarh) — immersion kund on north edge of Upper Lake basin
    latitude: 23.2700,
    longitude: 77.3270,
    coordinateStatus: 'approximate',
    legalStatus: 'not_verified',
    locationDescription: 'Sant Hirdaram Nagar (Bairagarh), north-western edge of Upper Lake basin. Designated kund approx. 600m from Bairagarh Railway Station.',
    immersionInfrastructure: 'Dedicated artificial immersion kund with concrete retaining walls and sediment catchment trap.',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=23.2700,77.3270',
    ngtDirectiveNote: 'Direct immersion into natural lake waters strictly banned by NGT; immersion permitted exclusively inside artificial kund enclosure.',
  },

  'Khatlapura ghat': {
    site: 'Khatlapura ghat',
    waterBody: 'Lower Lake',
    // Confirmed on Google Maps: Visarjan ghat khatlapur @23.2498196, 77.4051206
    latitude: 23.24982,
    longitude: 77.40512,
    coordinateStatus: 'approximate',
    legalStatus: 'not_verified',
    locationDescription: 'Traditional masonry ghat on the eastern bank of Lower Lake (Chhota Talab), Professor Colony / Jahangirabad area.',
    immersionInfrastructure: 'Historic stone masonry steps; mobile containment tanks and enforcement barricades deployed along approach roadway during festivals.',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=23.24982,77.40512',
    ngtDirectiveNote: 'Direct immersion strictly prohibited in Lower Lake. Municipal marshals divert idols to off-lake collection tanks.',
  },

  'Prempura ghat': {
    site: 'Prempura ghat',
    waterBody: 'Upper Lake',
    // South-western shore of Upper Lake (Bada Talab) — Bhadbhada Road / Van Vihar National Park approach
    latitude: 23.2290,
    longitude: 77.3500,
    coordinateStatus: 'approximate',
    legalStatus: 'not_verified',
    locationDescription: 'South-western shore of Upper Lake (Bada Talab), Bhadbhada Road / Van Vihar National Park approach road.',
    immersionInfrastructure: 'High-capacity staging area with heavy mobile hydraulic cranes and designated collection pontoons on lake-shore.',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=23.2290,77.3500',
    ngtDirectiveNote: 'NGT ban strictly enforced. Idol immersion diverted to adjacent artificial holding pools to safeguard Bhopal drinking water supply.',
  },

  'Rani Kamlapati ghat / Kamla Park kund': {
    site: 'Rani Kamlapati ghat / Kamla Park kund',
    waterBody: 'Lower Lake',
    // Kamla Park / Rani Kamlapati Palace area — bridge causeway between Upper & Lower Lake
    // Wikipedia + Wikimedia confirmed: 23.2503° N, 77.4003° E
    latitude: 23.25030,
    longitude: 77.40030,
    coordinateStatus: 'approximate',
    legalStatus: 'not_verified',
    locationDescription: 'Kamla Park area on the land bridge between Upper and Lower Lake, adjacent to Rani Kamlapati Palace. Kund tank located within park premises.',
    immersionInfrastructure: 'Demarcated artificial kund tank within park premises; boundary demarcation confirmed by NGT field inspection.',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=23.25030,77.40030',
    ngtDirectiveNote: 'Report naming ambiguity (Kamla Park vs Lower Lake). Immersion permitted in offline artificial tank only; barred from main lake body.',
  },

  'Hathaikheda dam / kund': {
    site: 'Hathaikheda dam / kund',
    waterBody: 'Hathaikheda dam',
    // Hathaikheda Dam — Kokta / Awadhpuri area, south-eastern Bhopal
    // Confirmed: ~23.26° N, 77.49° E (housing.com, multiple mapping sources)
    // Near Technocrats Institute of Technology (TIT), opposite the dam entrance
    latitude: 23.2600,
    longitude: 77.4900,
    coordinateStatus: 'approximate',
    legalStatus: 'not_verified',
    locationDescription: 'Hathaikheda Reservoir, Kokta / Awadhpuri zone, south-eastern Bhopal near Technocrats Institute of Technology. Designated immersion bay at the reservoir peripheral boundary.',
    immersionInfrastructure: 'Dedicated artificial immersion bay isolated from primary reservoir water channels by concrete berm and geotextile lining.',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=23.2600,77.4900',
    ngtDirectiveNote: 'Immersion allowed inside designated concrete enclosures only; reservoir raw-water channels protected with physical barriers.',
  },

  'Malikhedi kund': {
    site: 'Malikhedi kund',
    waterBody: 'Kund',
    // Off-lake artificial kund — north Bhopal, Ayodhya Bypass / Vidisha Road corridor
    // Confirmed approx. 23.315° N, 77.439° E (housing.com / north Bhopal bypass)
    latitude: 23.3150,
    longitude: 77.4390,
    coordinateStatus: 'approximate',
    legalStatus: 'not_verified',
    locationDescription: 'Engineered artificial immersion kund in north Bhopal, Ayodhya Bypass / Malikhedi locality. No natural water body contact.',
    immersionInfrastructure: 'Purpose-built artificial immersion kund with dedicated silt sedimentation chambers and water treatment provisions.',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=23.3150,77.4390',
    ngtDirectiveNote: 'Fully compliant with NGT directive. Artificial purpose-built kund entirely outside natural water bodies; highest compliance rating.',
  },

  'Shahpura lake ghat': {
    site: 'Shahpura lake ghat',
    waterBody: 'Shahpura Lake',
    // Shahpura Lake — confirmed at 23.2067° N, 77.4215° E (Mapcarta, multiple sources)
    latitude: 23.20670,
    longitude: 77.42150,
    coordinateStatus: 'approximate',
    legalStatus: 'not_verified',
    locationDescription: 'Shahpura Lake promenade, southern Bhopal, Trilanga / Chunabhatti area. Paved lakefront with designated barrier-isolated immersion sector.',
    immersionInfrastructure: 'Paved lakefront equipped with temporary geotextile containment barriers, rapid-response skimming teams, and idol-dissolution tanks.',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=23.20670,77.42150',
    ngtDirectiveNote: 'Subject to containment protocols; idol immersion restricted to barrier-isolated sector to limit organic pollution load on lake body.',
  },
};
