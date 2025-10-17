import { getCurrentLocation } from "@/lib/location";
import { DEFAULT_LAT_LONG } from "@shared/constants";
import { useEffect, useState } from "react";

export const useCurrentLocation = () => {
  const [location, setLocation] = useState<[number, number]>(DEFAULT_LAT_LONG);

  useEffect(() => {
    const fetchLocation = async () => {
      const currentLocation = await getCurrentLocation();
      setLocation(currentLocation);
    };

    fetchLocation();
  }, []);

  return location;
};
