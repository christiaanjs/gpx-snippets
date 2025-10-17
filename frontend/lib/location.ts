/**
 * Get current location from browser
 * @returns Promise that resolves to [latitude, longitude]
 */
export function getCurrentLocation(): Promise<[number, number] | undefined> {
  const isBrowser = typeof window !== "undefined";

  return new Promise((resolve, reject) => {
    if (!isBrowser || !navigator.geolocation) {
      resolve(undefined);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve([position.coords.latitude, position.coords.longitude]);
      },
      (error) => {
        resolve(undefined);
      },
      { timeout: 1000, enableHighAccuracy: true }
    );
  });
}
