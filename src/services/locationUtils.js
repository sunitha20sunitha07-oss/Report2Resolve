/**
 * Geolocation utility for Report2Resolve
 * 
 * Interacts with browser Geolocation API explicitly upon user action.
 * Never requests GPS permissions automatically on page load.
 */

/**
 * Request device GPS coordinates using the browser Geolocation API.
 * Only invoked when user explicitly clicks "Capture Location".
 * 
 * @returns {Promise<{latitude: number, longitude: number, accuracy: number, capturedAt: string}>}
 */
export async function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator?.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
          accuracy: Math.round(position.coords.accuracy || 0),
          capturedAt: new Date().toISOString()
        };
        resolve(coords);
      },
      (error) => {
        let message = 'Unable to retrieve location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location access was denied. Please allow location permissions in your browser or device settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'GPS location is currently unavailable. Please verify device GPS or network settings.';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out. Please ensure GPS signal is active and try again.';
            break;
          default:
            message = error.message || 'An unexpected error occurred while capturing GPS coordinates.';
        }
        reject(new Error(message));
      },
      options
    );
  });
}

/**
 * Format latitude and longitude for display.
 * @param {number} lat 
 * @param {number} lng 
 * @returns {string} e.g. "13.0827° N, 80.2707° E"
 */
export function formatCoordinates(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return 'N/A';
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(5)}° ${latDir}, ${Math.abs(lng).toFixed(5)}° ${lngDir}`;
}

/**
 * Generate Google Maps URL for given coordinates
 * @param {number} lat 
 * @param {number} lng 
 * @returns {string}
 */
export function getMapUrl(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return '#';
  return `https://www.google.com/maps?q=${lat},${lng}`;
}
