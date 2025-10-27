"use client";

import { PropsWithChildren } from "react";
import { SidePanel, SidePanelProps } from "./SidePanel";

export function LeftPanel({
  buttonContent,
  ...props
}: PropsWithChildren<SidePanelProps>) {
  return (
    <SidePanel buttonContent={buttonContent || ">"} {...props} side="left" />
  );
}
