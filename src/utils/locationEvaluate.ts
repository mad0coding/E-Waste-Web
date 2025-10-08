// LocationEvaluate.ts (Corrected .issuperset Logic)

export interface LocationScore {
  id: string;
  score: number;
}

export interface EWasteBin {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  acceptedClasses: string[];
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

export function LocationEvaluate(
  userLocation: [number, number],
  pendingList: string[],
  locations: EWasteBin[]
): LocationScore[] {
  // GUARD CLAUSE: Only check for a valid locations array.
  if (!locations || locations.length === 0) {
    return [];
  }

  const [userLat, userLng] = userLocation;
  const userItemsSet = new Set(pendingList);
  const optimalLocationIds = new Set<string>();

  // --- PHASE 1: FIND THE OPTIMAL SOLUTION (Only if there are items to find) ---
  if (pendingList.length > 0) {
    // FIX IS HERE: Replaced non-existent '.issuperset()' with the correct JS/TS logic.
    const perfectMatches = locations.filter(loc => {
      // For a location to be a perfect match, every item in the user's list
      // must be included in the location's list of accepted classes.
      return [...userItemsSet].every(userItem => loc.acceptedClasses.includes(userItem));
    });

    if (perfectMatches.length > 0) {
      perfectMatches.forEach(loc => optimalLocationIds.add(loc.id));
    } else {
      const relevantLocations = locations.filter(loc =>
        loc.acceptedClasses.some(item => userItemsSet.has(item))
      );

      if (relevantLocations.length > 0) {
        for (let numLocations = 2; numLocations <= relevantLocations.length; numLocations++) {
          const combinations = getCombinations(relevantLocations, numLocations);
          let bestCombo: EWasteBin[] | null = null;
          let minTotalDistance = Infinity;

          for (const combo of combinations) {
            const combinedItems = new Set(combo.flatMap(loc => loc.acceptedClasses));
            const isSuperset = [...userItemsSet].every(item => combinedItems.has(item));
            if (isSuperset) {
              const totalDistance = combo.reduce((sum, loc) =>
                sum + calculateDistance(userLat, userLng, loc.lat, loc.lng), 0);

              if (totalDistance < minTotalDistance) {
                minTotalDistance = totalDistance;
                bestCombo = combo;
              }
            }
          }

          if (bestCombo) {
            bestCombo.forEach(loc => optimalLocationIds.add(loc.id));
            break;
          }
        }
      }
    }
  }

  // --- PHASE 2: SCORE ALL LOCATIONS ---
  const result = locations.map(location => {
    let baseScore = 0;
    const distance = calculateDistance(userLat, userLng, location.lat, location.lng);
    const maxDistance = 25;
    const distanceScore = Math.max(0, (maxDistance - Math.min(distance, maxDistance)) / maxDistance * 40);
    baseScore += distanceScore;

    const matchingClasses = pendingList.filter(item =>
      location.acceptedClasses.includes(item)
    );
    const matchPercentage = pendingList.length > 0 ? matchingClasses.length / pendingList.length : 0;
    const acceptanceScore = matchPercentage * 60;
    baseScore += acceptanceScore;

    const finalScore = optimalLocationIds.has(location.id)
      ? 100
      : Math.round(baseScore);

    return {
      id: location.id,
      score: Math.min(100, Math.max(0, finalScore))
    };
  });

  const sortedList = result.sort((a, b) => b.score - a.score);

  if (optimalLocationIds.size === 0 && sortedList.length > 0 && pendingList.length > 0) {
      const bestMatchPercentage = sortedList[0].score > 40; // Avoids making a 0% match a 'perfect' one
      if(bestMatchPercentage) sortedList[0].score = 100;
  } else if (pendingList.length === 0 && sortedList.length > 0) {
      sortedList[0].score = 100;
  }


  return sortedList;
}

// --- HELPER FUNCTIONS ---

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function getScoreColor(score: number): string {
  if (score >= 100) return '#ff2ffcff';
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#d0c908ff';
  if (score >= 40) return '#e86e16ff';
  if (score >= 20) return '#c33838ff';
  return '#a7a7a7ff';
}

export function getScoreDescription(score: number): string {
  if (score >= 100) return 'Perfect match';
  if (score >= 80) return 'Excellent match';
  if (score >= 60) return 'Good match';
  if (score >= 40) return 'Fair match';
  return 'Poor match';
}