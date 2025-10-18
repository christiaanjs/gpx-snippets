import { useGpx } from "@/lib/gpx-context";
import { calculateStats, getStatsDisplayItems } from "@shared/stats";
import { useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";

export function GpxSummary() {
  const { gpx } = useGpx();
  const statItems = useMemo(() => {
    if (!gpx) return null;
    const stats = calculateStats(gpx.points);
    return getStatsDisplayItems(stats);
  }, [gpx]);
  return statItems ? (
    <Accordion type="single" collapsible>
      <AccordionItem value="gpx-summary">
        <AccordionTrigger>{gpx?.name}</AccordionTrigger>
        <AccordionContent>
          {statItems.map((item) => (
            <div key={item.label}>
              <strong>{item.label}:</strong> {item.value}
            </div>
          ))}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ) : null;
}
