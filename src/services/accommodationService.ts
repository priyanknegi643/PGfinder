import { Accommodation } from "../types";

/**
 * Haversine formula to calculate distance between two points on Earth
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Normalizes values to a 0-1 range for fair scoring
 */
const normalize = (val: number, min: number, max: number): number => {
  if (max === min) return 0;
  return (val - min) / (max - min);
};

/**
 * Weighted scoring algorithm as per the project proposal
 * Score = (w1 * campus_dist) + (w2 * grocery_dist) + (w3 * hospital_dist)
 * Lower score is better (closer/better)
 */
export const scoreAccommodations = (
  list: Accommodation[],
  campusLat: number,
  campusLon: number,
  weights: { campus: number; grocery: number; hospital: number }
): Accommodation[] => {
  const scored = list.map((acc) => ({
    ...acc,
    distanceFromCampus: calculateDistance(campusLat, campusLon, acc.lat, acc.lon),
  }));

  // Find min/max for normalization
  const campusDistances = scored.map(s => s.distanceFromCampus!);
  const groceryDistances = scored.map(s => s.groceryDist);
  const hospitalDistances = scored.map(s => s.hospitalDist);

  const minCampus = Math.min(...campusDistances);
  const maxCampus = Math.max(...campusDistances);
  const minGrocery = Math.min(...groceryDistances);
  const maxGrocery = Math.max(...groceryDistances);
  const minHospital = Math.min(...hospitalDistances);
  const maxHospital = Math.max(...hospitalDistances);

  return scored.map((acc) => {
    const nCampus = normalize(acc.distanceFromCampus!, minCampus, maxCampus);
    const nGrocery = normalize(acc.groceryDist, minGrocery, maxGrocery);
    const nHospital = normalize(acc.hospitalDist, minHospital, maxHospital);

    const score =
      weights.campus * nCampus +
      weights.grocery * nGrocery +
      weights.hospital * nHospital;

    return { ...acc, score };
  }).sort((a, b) => (a.score || 0) - (b.score || 0));
};
