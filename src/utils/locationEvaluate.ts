// LocationEvaluate function that evaluates e-waste drop-off points based on user location and pending items

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

/**
 * Evaluates all e-waste drop-off points and gives scores between 0 and 100
 * @param userLocation - [latitude, longitude] of user's current position
 * @param pendingList - Array of e-waste classes that need disposal
 * @param locations - Array of available e-waste drop-off locations
 * @returns Array of location scores sorted by score (highest first)
 */
export function LocationEvaluate(
  userLocation: [number, number], 
  pendingList: string[], 
  locations: EWasteBin[]
): LocationScore[] {
  const [userLat, userLng] = userLocation;
  
  const result = locations.map(location => { // for every location
    let score = 0;
    
    // Factor 1: Distance (40% weight)
    // Calculate distance using Haversine formula
    const distance = calculateDistance(userLat, userLng, location.lat, location.lng);
    
    // Distance scoring: closer = higher score (max 40 points)
    // Assume max useful distance is xx km
    const maxDistance = 25; // km
    const distanceScore = Math.max(0, (maxDistance - Math.min(distance, maxDistance)) / maxDistance * 40);
    score += distanceScore;
    
    // Factor 2: Accepted classes match (60% weight)
    // Check how many pending items this location can accept
    const matchingClasses = pendingList.filter(item => 
      location.acceptedClasses.includes(item)
    );
    
    const matchPercentage = pendingList.length > 0 ? matchingClasses.length / pendingList.length : 0;
    const acceptanceScore = matchPercentage * 60;
    score += acceptanceScore;
    
    // Round to nearest integer
    score = Math.round(score);
    
    return {
      id: location.id,
      score: Math.min(100, Math.max(0, score)) // Ensure score is between 0-100
    };
  });

  let sortedList = result.sort((a, b) => b.score - a.score); // Sort by score (highest first)
  if(1) sortedList[0].score = 100; // Give the highest one 100
  
  return sortedList;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 - Latitude of point 1
 * @param lng1 - Longitude of point 1
 * @param lat2 - Latitude of point 2
 * @param lng2 - Longitude of point 2
 * @returns Distance in kilometers
 */
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

/**
 * Get color based on score for map markers
 * @param score - Score between 0-100
 * @returns Color string for the marker
 */
export function getScoreColor(score: number): string {
  if (score >= 100) return '#ff2ffcff'; // Purple/Magenta - Perfect
  if (score >= 80) return '#22c55e'; // Green - Excellent
  if (score >= 60) return '#d0c908ff'; // Green - Good
  if (score >= 40) return '#e86e16ff'; // Orange - Fair
  if (score >= 20) return '#c33838ff'; // Red - Poor
  return '#a7a7a7ff'; // Gray - Very poor
}

/**
 * Get score description based on score value
 * @param score - Score between 0-100
 * @returns Description string
 */
export function getScoreDescription(score: number): string {
  if (score >= 100) return 'Perfect match';
  if (score >= 80) return 'Excellent match';
  if (score >= 60) return 'Good match';
  if (score >= 40) return 'Fair match';
  return 'Poor match';
}