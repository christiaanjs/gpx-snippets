"use client";

import { useMyMap } from "@/lib/map-context";
import { PanelHeader } from "../panels/PanelHeader";
import { RightPanel } from "../panels/RightPanel";

import { useEffect, useState, useCallback } from "react";
import type { GPXPoint } from "@shared/types";
import type {
  ORSPreference,
  ORSRoutingProfile,
  OSRMRoutingProfile,
  RoutingResult,
} from "@shared/routing/types";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getRoute } from "@/app/api/getRoute";

const SelectedPointInfo = ({
  point,
  points,
}: {
  point: GPXPoint;
  points: GPXPoint[];
}) => {
  const index = points.findIndex(
    (pt) => pt.lat === point.lat && pt.lon === point.lon
  );
  return (
    <div className="bg-primary/10 rounded p-3">
      {`${index}/${points.length}`}
    </div>
  );
};

const NoData = () => <div>Load a GPX file to interpolate.</div>;

export const InterpolatePanel = () => {
  const header = <PanelHeader>Interpolate</PanelHeader>;
  const { gpx, upsertFeature, removeFeature } = useMyMap();

  const [selectedPoints, setSelectedPoints] = useState<GPXPoint[]>([]);
  const [routingService, setRoutingService] = useState<"osrm" | "ors">("ors");
  const [osrmProfile, setOsrmProfile] = useState("walking");
  const [orsProfile, setOrsProfile] = useState("foot-walking");
  const [orsPreference, setOrsPreference] = useState("recommended");
  const [routeResult, setRouteResult] = useState<RoutingResult | null>(null);
  const [isInterpolating, setIsInterpolating] = useState(false);
  const [interpolationError, setInterpolationError] = useState<string | null>(
    null
  );

  const handlePointSelection = useCallback(
    (point: GPXPoint, index: number) => {
      const indexOfPointInSelection = selectedPoints.findIndex(
        (p) => p.lat === point.lat && p.lon === point.lon
      );
      if (indexOfPointInSelection !== -1) {
        setSelectedPoints((prev) => [
          ...prev.slice(0, indexOfPointInSelection),
          ...prev.slice(indexOfPointInSelection + 1),
        ]);
      } else if (selectedPoints.length >= 2) {
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
        selectedPoints: selectedPoints,
        onPointSelect: handlePointSelection,
      });
    } else {
      removeFeature("selectable-gpx-trace");
    }
  }, [gpx, selectedPoints]);

  const interpolateRoute = useCallback(async () => {
    if (selectedPoints.length !== 2) return;
    setIsInterpolating(true);
    setInterpolationError(null);
    const [a, b] = selectedPoints;
    const indexA = gpx?.points.findIndex(
      (pt) => pt.lat === a.lat && pt.lon === a.lon
    );
    const indexB = gpx?.points.findIndex(
      (pt) => pt.lat === b.lat && pt.lon === b.lon
    );
    if (indexA === undefined || indexB === undefined) return;
    const [start, finish] = indexA < indexB ? [a, b] : [b, a];
    try {
      const result = await getRoute({
        start,
        finish,
        ...(routingService === "osrm"
          ? {
              service: "osrm",
              options: {
                profile: osrmProfile as OSRMRoutingProfile,
              },
            }
          : {
              service: "ors",
              options: {
                profile: orsProfile as ORSRoutingProfile,
                preference: orsPreference as ORSPreference,
              },
            }),
      });
      setRouteResult(result);
    } catch (error: any) {
      setInterpolationError(error?.message || "Unknown interpolation error");
    } finally {
      setIsInterpolating(false);
    }
  }, [selectedPoints]);

  useEffect(() => {
    if (routeResult) {
      const color = getComputedStyle(document.documentElement)
        .getPropertyValue("--chart-2")
        .trim();
      upsertFeature("interpolated-route", {
        id: "interpolated-route",
        type: "line",
        points: routeResult.route,
        options: { color },
      });
    } else {
      removeFeature("interpolated-route");
    }
  }, [routeResult]);

  const resetSelection = () => {
    setSelectedPoints([]);
    setRouteResult(null);
  };

  return (
    <RightPanel width={"xl"} headerContent={header} buttonContent="Interpolate">
      {gpx ? (
        <>
          <p className="mb-4">
            Select two points on the GPX trace to interpolate a route between
            them.
          </p>
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {selectedPoints.length > 0 ? (
              selectedPoints.map((point, i) => (
                <SelectedPointInfo key={i} point={point} points={gpx.points} />
              ))
            ) : (
              <div className="bg-muted rounded p-3">
                <span>
                  No points selected yet. Click on the trace to select points.
                </span>
              </div>
            )}
          </div>
        </>
      ) : (
        <NoData />
      )}
      {selectedPoints.length === 2 && (
        <Card className="mb-4 p-4 border border-muted bg-muted/40">
          <CardHeader className="pb-2">
            <h4 className="text-md font-semibold">Routing Options</h4>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Routing Service
              </label>
              <select
                className="select w-full"
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
            </div>
            {routingService === "osrm" ? (
              <div>
                <label className="block text-sm font-medium mb-1">
                  OSRM Profile
                </label>
                <select
                  className="select w-full"
                  value={osrmProfile}
                  onChange={(e) => setOsrmProfile(e.target.value)}
                >
                  <option value="walking">Walking</option>
                  <option value="cycling">Cycling</option>
                  <option value="driving">Driving</option>
                </select>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    ORS Profile
                  </label>
                  <select
                    className="select w-full"
                    value={orsProfile}
                    onChange={(e) => setOrsProfile(e.target.value)}
                  >
                    <option value="foot-walking">Foot - Walking</option>
                    <option value="foot-hiking">Foot - Hiking</option>
                    <option value="cycling-regular">Cycling - Regular</option>
                    <option value="cycling-mountain">Cycling - Mountain</option>
                    <option value="cycling-road">Cycling - Road</option>
                    <option value="driving-car">Driving - Car</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Route Preference
                  </label>
                  <select
                    className="select w-full"
                    value={orsPreference}
                    onChange={(e) => setOrsPreference(e.target.value)}
                  >
                    <option value="recommended">Recommended</option>
                    <option value="fastest">Fastest</option>
                    <option value="shortest">Shortest</option>
                  </select>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
      {selectedPoints.length === 2 && (
        <div className="flex gap-2">
          <Button
            variant="default"
            onClick={interpolateRoute}
            disabled={isInterpolating}
          >
            {isInterpolating ? "Calculating..." : "Interpolate Route"}
          </Button>
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
          <div>Duration: {Math.round(routeResult.duration / 60)} minutes</div>
        </div>
      )}
    </RightPanel>
  );
};
