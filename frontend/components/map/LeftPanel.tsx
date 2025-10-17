"use client";

import { PropsWithChildren, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export type SidePanelProps = {
  buttonContent?: React.ReactNode;
  headerContent?: React.ReactNode;
};

export function LeftPanel({
  children,
  buttonContent,
  headerContent,
}: PropsWithChildren<SidePanelProps>) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`absolute top-0 left-0 h-full transition-transform duration-300 z-10 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <Card className="h-full w-72 rounded-none border-r">
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
          className="absolute top-4 left-full rounded-l-none"
          onClick={() => setOpen(true)}
        >
          {buttonContent || ">"}
        </Button>
      )}
    </div>
  );
}
