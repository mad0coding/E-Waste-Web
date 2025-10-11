// src/utils/locationEvaluate.ts

export interface EWasteBin {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  acceptedClasses: string[];
}

// A "Solution" is a set of locations that covers all items, with a total travel score.
export interface Solution {
  locations: EWasteBin[];
  totalDistance: number;
}

function getCombinations<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  function combinate(temp: T[], start: number) {
    if (temp.length === size) {
      result.push([...temp]);
      return;
    }
    for (let i = start; i < array.length; i++) {
      temp.push(array[i]);
      combinate(temp, i + 1);
      temp.pop();
    }
  }
  combinate([], 0);
  return result;
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Finds all possible sets of locations that cover the user's pending items,
 * scores them by total travel distance, and returns the sorted results.
 */
export function findBestSolutions(
  userLocation: [number, number],
  pendingList: string[],
  allLocations: EWasteBin[]
): Solution[] {
  if (!pendingList || pendingList.length === 0 || !allLocations || allLocations.length === 0) {
    return [];
  }

  const userItemsSet = new Set(pendingList);
  const [userLat, userLng] = userLocation;
  const allFoundSolutions: Solution[] = [];

  const relevantLocations = allLocations.filter(loc =>
    loc.acceptedClasses.some(item => userItemsSet.has(item))
  );

  const MAX_STOPS = 3; // Consider solutions with up to 3 stops

  for (let numStops = 1; numStops <= MAX_STOPS; numStops++) {
    const combinations = getCombinations(relevantLocations, numStops);

    for (const combo of combinations) {
      const combinedItems = new Set(combo.flatMap(loc => loc.acceptedClasses));
      const isCompleteSolution = [...userItemsSet].every(item => combinedItems.has(item));

      if (isCompleteSolution) {
        const totalDistance = combo.reduce((sum, loc) =>
          sum + calculateDistance(userLat, userLng, loc.lat, loc.lng), 0);
        
        allFoundSolutions.push({ locations: combo, totalDistance });
      }
    }

    // Optimization: If we found solutions with N stops, we don't need to look for N+1.
    if (allFoundSolutions.length > 0) {
      break;
    }
  }

  allFoundSolutions.sort((a, b) => a.totalDistance - b.totalDistance);

  return allFoundSolutions;
}