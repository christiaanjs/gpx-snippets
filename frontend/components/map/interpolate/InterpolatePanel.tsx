"use client";

import { useMyMap } from "@/lib/map-context";
import { PanelHeader } from "../panels/PanelHeader";
import { RightPanel } from "../panels/RightPanel";

import { useEffect, useState, useCallback } from "react";
import type { GPXPoint } from "@shared/types";
import type { RoutingResult } from "@shared/routing/types";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { plotSelectableGPXTrace } from "@/lib/plot-trace";

const pointLabels = ["First point", "Second point"];

const NoData = () => <div>Load a GPX file to interpolate.</div>;

export const InterpolatePanel = () => {
  const header = <PanelHeader>Interpolate</PanelHeader>;
  const { gpx, upsertFeature } = useMyMap();

  const [selectedPoints, setSelectedPoints] = useState<GPXPoint[]>([]);
  const [routingService, setRoutingService] = useState<"osrm" | "ors">("osrm");
  const [osrmProfile, setOsrmProfile] = useState("walking");
  const [orsProfile, setOrsProfile] = useState("foot-walking");
  const [orsPreference, setOrsPreference] = useState("recommended");
  const [routeResult, setRouteResult] = useState<RoutingResult | null>(null);
  const [isInterpolating, setIsInterpolating] = useState(false);
  const [interpolationError, setInterpolationError] = useState<string | null>(
    null
  );
  const [routeLayer, setRouteLayer] = useState<any>(undefined);

  const handlePointSelection = useCallback(
    (point: GPXPoint, index: number) => {
      if (selectedPoints.length >= 2) {
        setSelectedPoints([point]);
      } else {
        setSelectedPoints([...selectedPoints, point]);
      }
    },
    [selectedPoints]
  );

  useEffect(() => {
    if (gpx) {
      upsertFeature("selectable-gpx-trace", {
        id: "selectable-gpx-trace",
        type: "selectable-point-line",
        points: gpx.points,
        onPointSelect: handlePointSelection,
      });
    }
  }, [gpx]);

  //   const interpolateRoute = async () => {
  //     if (!map || selectedPoints.length !== 2) return;
  //     setIsInterpolating(true);
  //     setInterpolationError(null);
  //     try {
  //       let result: RoutingResult | null = null;
  //       if (routingService === "osrm") {
  //         result = await getRouteOSRM(
  //           selectedPoints[0],
  //           selectedPoints[1],
  //           osrmProfile
  //         );
  //       } else {
  //         result = await getRouteORS(selectedPoints[0], selectedPoints[1], {
  //           profile: orsProfile,
  //           preference: orsPreference,
  //         });
  //       }
  //       setRouteResult(result);
  //       if (result) {
  //         const layer = await plotInterpolatedRoute(
  //           map,
  //           result,
  //           selectedPoints[0],
  //           selectedPoints[1],
  //           routeLayer
  //         );
  //         setRouteLayer(layer);
  //       }
  //     } catch (error: any) {
  //       setInterpolationError(error?.message || "Unknown interpolation error");
  //     } finally {
  //       setIsInterpolating(false);
  //     }
  //   };

  // Reset selection and route
  const resetSelection = () => {
    setSelectedPoints([]);
    setRouteResult(null);
  };

  return (
    <RightPanel headerContent={header} buttonContent="Interpolate">
      <Card className="p-4">
        <CardHeader>
          <h3 className="text-lg font-bold">Route Interpolation</h3>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Select two points on the GPX trace to interpolate a route between
            them.
          </p>
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {selectedPoints.length > 0 ? (
              selectedPoints.map((point, i) => (
                <div key={i} className="bg-primary/10 rounded p-3">
                  <span className="font-bold">{pointLabels[i]}:</span>
                  <span>
                    {" "}
                    Lat: {point.lat.toFixed(6)}, Lon: {point.lon.toFixed(6)}
                  </span>
                </div>
              ))
            ) : (
              <div className="bg-muted rounded p-3">
                <span>
                  No points selected yet. Click on the trace to select points.
                </span>
              </div>
            )}
          </div>
          {selectedPoints.length === 2 && (
            <div className="mb-4">
              <label className="block mb-2">
                <span>Routing Service</span>
                <select
                  className="select"
                  value={routingService}
                  onChange={(e) =>
                    setRoutingService(e.target.value as "osrm" | "ors")
                  }
                >
                  <option value="osrm">
                    OpenStreetMap Routing Machine (OSRM)
                  </option>
                  <option value="ors">OpenRouteService (ORS)</option>
                </select>
              </label>
              {routingService === "osrm" ? (
                <label className="block mb-2">
                  <span>OSRM Profile</span>
                  <select
                    className="select"
                    value={osrmProfile}
                    onChange={(e) => setOsrmProfile(e.target.value)}
                  >
                    <option value="walking">Walking</option>
                    <option value="cycling">Cycling</option>
                    <option value="driving">Driving</option>
                  </select>
                </label>
              ) : (
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <label className="block mb-2">
                    <span>ORS Profile</span>
                    <select
                      className="select"
                      value={orsProfile}
                      onChange={(e) => setOrsProfile(e.target.value)}
                    >
                      <option value="foot-walking">Foot - Walking</option>
                      <option value="foot-hiking">Foot - Hiking</option>
                      <option value="cycling-regular">Cycling - Regular</option>
                      <option value="cycling-mountain">
                        Cycling - Mountain
                      </option>
                      <option value="cycling-road">Cycling - Road</option>
                      <option value="driving-car">Driving - Car</option>
                    </select>
                  </label>
                  <label className="block mb-2">
                    <span>Route Preference</span>
                    <select
                      className="select"
                      value={orsPreference}
                      onChange={(e) => setOrsPreference(e.target.value)}
                    >
                      <option value="recommended">Recommended</option>
                      <option value="fastest">Fastest</option>
                      <option value="shortest">Shortest</option>
                    </select>
                  </label>
                </div>
              )}
            </div>
          )}
          {selectedPoints.length === 2 && (
            <div className="flex gap-2">
              {/* <Button
                variant="default"
                onClick={interpolateRoute}
                disabled={isInterpolating}
              >
                {isInterpolating ? "Calculating..." : "Interpolate Route"}
              </Button> */}
              <Button
                variant="outline"
                onClick={resetSelection}
                disabled={isInterpolating}
              >
                Reset Selection
              </Button>
            </div>
          )}
          {interpolationError && (
            <div className="bg-red-100 text-red-800 rounded p-3 mt-4">
              <span>{interpolationError}</span>
            </div>
          )}
          {routeResult && (
            <div className="bg-green-100 text-green-800 rounded p-3 mt-4">
              <div>
                <strong>Route calculated:</strong>
              </div>
              <div>Distance: {(routeResult.distance / 1000).toFixed(2)} km</div>
              <div>
                Duration: {Math.round(routeResult.duration / 60)} minutes
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </RightPanel>
  );
};
