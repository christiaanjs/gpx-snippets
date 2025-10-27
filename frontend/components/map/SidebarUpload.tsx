import { Input } from "@/components/ui/input";
import { useMyMap } from "@/lib/map-context";
import { useRef } from "react";
import { parseGPX } from "@shared/gpx";
import { toast } from "sonner";
import { LeftPanel } from "./panels/LeftPanel";
import { GpxSummary } from "./GpxSummary";
import { PanelHeader } from "./panels/PanelHeader";

export function SidebarUpload() {
  const { setGpx } = useMyMap();

  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      parseGPX(file)
        .then((data) => {
          setGpx(data);
          toast.success("GPX file uploaded successfully");
        })
        .catch((error) => {
          toast.error(`Failed to read GPX file: ${error.message}`);
        });
    }
  }

  const header = <PanelHeader>Upload GPX File</PanelHeader>;
  return (
    <LeftPanel buttonContent={"Upload GPX"} headerContent={header}>
      <div className="flex flex-col gap-2">
        <Input
          ref={inputRef}
          type="file"
          accept=".gpx,application/gpx+xml"
          onChange={handleFile}
        />
        <GpxSummary />
      </div>
    </LeftPanel>
  );
}
