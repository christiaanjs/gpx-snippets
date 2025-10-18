import { SelectablePointLineFeature } from "@/lib/types/map-features";
import { JSX } from "react";
import { PolylineFromGpx } from "../PolylineFromGpx";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

export function SelectablePointLineComponent({
  onPointSelect,
  points,
}: SelectablePointLineFeature): JSX.Element {
  return (
    <>
      <PolylineFromGpx points={points} />
      {points.map((pt, idx) => (
        <Marker
          key={idx}
          position={[pt.lat, pt.lon]}
          eventHandlers={{
            click: () => onPointSelect?.(pt, idx),
          }}
          icon={L.icon({
            iconUrl:
              "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowUrl:
              "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
          })}
        >
          <Popup>Point {idx + 1}</Popup>
        </Marker>
      ))}
    </>
  );
}
