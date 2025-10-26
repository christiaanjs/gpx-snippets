"use client";

import { PropsWithChildren, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export type SidePanelProps = {
  buttonContent?: React.ReactNode;
  headerContent?: React.ReactNode;
  side?: "left" | "right";
  width?: "sm" | "md" | "lg" | "xl" | string;
};

export function SidePanel({
  children,
  buttonContent,
  headerContent,
  side = "left",
  width = "md",
}: PropsWithChildren<SidePanelProps>) {
  const [open, setOpen] = useState(false);
  const isLeft = side === "left";

  // Map predefined sizes to Tailwind classes
  const getWidthClass = (width: string) => {
    const predefinedSizes = {
      sm: "w-64",
      md: "w-72",
      lg: "w-80",
      xl: "w-96",
    };
    return predefinedSizes[width as keyof typeof predefinedSizes] || width;
  };

  const widthClass = getWidthClass(width);

  return (
    <div
      className={`absolute top-0 ${
        isLeft ? "left-0" : "right-0"
      } h-full transition-transform duration-300 z-10 ${
        open
          ? "translate-x-0"
          : isLeft
          ? "-translate-x-full"
          : "translate-x-full"
      }`}
    >
      <Card
        className={`h-full ${widthClass} rounded-none ${
          isLeft ? "border-r" : "border-l"
        }`}
      >
        <CardHeader className="flex justify-between items-center">
          {headerContent}
          <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
            ×
          </Button>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
      {!open && (
        <Button
          size="sm"
          className={`absolute top-4 ${
            isLeft ? "left-full rounded-l-none" : "right-full rounded-r-none"
          }`}
          onClick={() => setOpen(true)}
        >
          {buttonContent || "Open"}
        </Button>
      )}
    </div>
  );
}
