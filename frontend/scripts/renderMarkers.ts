import { CircleSmallIcon } from "@/components/ui/icons/circle-small";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";

const Icon = CircleSmallIcon;

const markerNames = ["marker", "selected-marker"] as const;
type MarkerName = (typeof markerNames)[number];

const getIcon = (markerName: MarkerName, size: number): React.ReactElement => {
  switch (markerName) {
    case "marker":
      return React.createElement(Icon, { size, color: "blue" });
    case "selected-marker":
      return React.createElement(Icon, { size, color: "red" });
  }
};

const sizes = [16, 32, 64];

const markersDir = "./public/markers";

const renderIcons = () => {
  // Ensure the markers directory exists
  mkdirSync(markersDir, { recursive: true });

  sizes.forEach((size) => {
    markerNames.forEach((markerName) => {
      const svgHtml = renderToStaticMarkup(getIcon(markerName, size));
      const fileName = `${markerName}-${size}.svg`;
      const filePath = join(markersDir, fileName);

      try {
        writeFileSync(filePath, svgHtml);
        console.log(`✓ Generated ${fileName}`);
      } catch (error) {
        console.error(`✗ Failed to generate ${fileName}:`, error);
      }
    });
  });
};

// Execute the script
console.log("Generating marker SVG files...");
renderIcons();
console.log("Marker generation complete!");
