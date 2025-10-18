"use client";

import { PropsWithChildren } from "react";
import { SidePanel, SidePanelProps } from "./SidePanel";

export function RightPanel({
  buttonContent,
  ...props
}: PropsWithChildren<SidePanelProps>) {
  return (
    <SidePanel buttonContent={buttonContent || "<"} {...props} side="right" />
  );
}
