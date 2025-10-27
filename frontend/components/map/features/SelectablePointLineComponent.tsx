import { SelectablePointLineFeature } from "@/lib/types/map-features";
import { JSX } from "react";
import { PolylineFromGpx } from "../PolylineFromGpx";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

function getIcon(iconType: "default" | "selected" = "default"): L.Icon {
  switch (iconType) {
    case "selected":
      return L.icon({
        iconUrl: "/markers/selected-marker-32.svg",
        iconSize: [32, 32],
      });
    case "default":
      return L.icon({
        iconUrl: "/markers/marker-32.svg",
        iconSize: [32, 32],
      });
    default:
      return L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
  }
}

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
          icon={getIcon()}
        />
      ))}
    </>
  );
}
