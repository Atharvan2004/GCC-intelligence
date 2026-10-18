const CITY_ALIASES: Record<string, string> = {
  'bangalore': 'Bengaluru',
  'bengaluru': 'Bengaluru',
  'bengalooru': 'Bengaluru',
  'hyderabad': 'Hyderabad',
  'pune': 'Pune',
  'chennai': 'Chennai',
  'delhi ncr': 'Delhi NCR',
  'ncr': 'Delhi NCR',
  'delhi': 'Delhi NCR',
  'gurugram': 'Delhi NCR',
  'gurgaon': 'Delhi NCR',
  'noida': 'Delhi NCR',
  'mumbai': 'Mumbai',
  'bombay': 'Mumbai',
  'kolkata': 'Kolkata',
  'calcutta': 'Kolkata',
  'ahmedabad': 'Ahmedabad',
  'ahmedabad (gift city)': 'Ahmedabad',
  'gift city': 'Ahmedabad',
  'kochi': 'Kochi',
  'cochin': 'Kochi',
  'thiruvananthapuram': 'Thiruvananthapuram',
  'trivandrum': 'Thiruvananthapuram',
  'coimbatore': 'Coimbatore',
  'visakhapatnam': 'Visakhapatnam',
  'vizag': 'Visakhapatnam',
  'jaipur': 'Jaipur',
  'indore': 'Indore',
  'bhubaneswar': 'Bhubaneswar',
  'bhubaneshwar': 'Bhubaneswar',
};

const CANONICAL_TO_DISPLAY: Record<string, string> = {
  'Bengaluru': 'Bengaluru',
  'Hyderabad': 'Hyderabad',
  'Pune': 'Pune',
  'Chennai': 'Chennai',
  'Delhi NCR': 'Delhi NCR',
  'Mumbai': 'Mumbai',
  'Kolkata': 'Kolkata',
  'Ahmedabad': 'Ahmedabad',
  'Kochi': 'Kochi',
  'Thiruvananthapuram': 'Thiruvananthapuram',
  'Coimbatore': 'Coimbatore',
  'Visakhapatnam': 'Visakhapatnam',
  'Jaipur': 'Jaipur',
  'Indore': 'Indore',
  'Bhubaneswar': 'Bhubaneswar',
};

export const RECOMMENDED_CITIES = [
  'Bengaluru',
  'Hyderabad',
  'Pune',
  'Chennai',
  'Delhi NCR',
  'Mumbai',
];

export function normalizeCity(raw: string): string {
  const key = raw.trim().toLowerCase();
  const canonical = CITY_ALIASES[key];
  if (canonical) return canonical;
  return raw.trim();
}

export function cityToDataKey(city: string): string {
  const canonical = normalizeCity(city);
  if (canonical === 'Bengaluru') return 'Bangalore';
  if (canonical === 'Delhi NCR') return 'NCR';
  if (canonical === 'Visakhapatnam') return 'Vizag';
  if (canonical === 'Thiruvananthapuram') return 'Trivandrum';
  return canonical;
}

export function displayCity(city: string): string {
  const canonical = normalizeCity(city);
  return CANONICAL_TO_DISPLAY[canonical] ?? canonical;
}

export function getAllKnownCities(): string[] {
  return Object.values(CANONICAL_TO_DISPLAY);
}
