export interface Accommodation {
  id: number;
  name: string;
  lat: number;
  lon: number;
  type: 'PG' | 'Flat';
  rent: number;
  rating: number;
  groceryDist: number; // in km
  hospitalDist: number; // in km
  distanceFromCampus?: number;
  score?: number;
}

export interface User {
  username: string;
}

export interface SearchFilters {
  radius: number;
  type: string;
  weights: {
    campus: number;
    grocery: number;
    hospital: number;
  };
}
