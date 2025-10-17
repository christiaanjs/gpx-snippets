import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGpx } from "@/lib/gpx-context";
import { Upload } from "lucide-react";
import { useRef } from "react";
import { parseGPX } from "@shared/gpx";
import { toast } from "sonner";
import { LeftPanel } from "./LeftPanel";

export function SidebarUpload() {
  const { setGpx } = useGpx();

  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      console.log("Parsing GPX file:", file.name);
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

  const header = <h2 className="text-lg font-semibold">Upload GPX Trace</h2>;
  return (
    <LeftPanel buttonContent={"Upload GPX"} headerContent={header}>
      <Input
        ref={inputRef}
        type="file"
        accept=".gpx,application/gpx+xml"
        onChange={handleFile}
      />
    </LeftPanel>
  );
}
