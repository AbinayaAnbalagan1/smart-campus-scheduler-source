import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TimetableGrid, YearLegend, type ScheduleEntry } from "@/components/TimetableGrid";
import { listSchedules } from "@/lib/campus.functions";
import { YEARS } from "@/lib/scheduler";

export const Route = createFileRoute("/_authenticated/student-schedule")({
  head: () => ({
    meta: [
      { title: "Student Schedule · Smart Campus Scheduler" },
      { name: "description", content: "Full campus timetable with a filter for each year group." },
      { property: "og:title", content: "Student Schedule · Smart Campus Scheduler" },
      { property: "og:description", content: "Browse the weekly class timetable by year." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StudentSchedulePage,
});

function StudentSchedulePage() {
  const fetchSchedules = useServerFn(listSchedules);
  const query = useQuery({ queryKey: ["schedules"], queryFn: () => fetchSchedules({}) });
  const [year, setYear] = useState<string>("all");

  const all = (query.data ?? []) as unknown as ScheduleEntry[];
  const entries = year === "all" ? all : all.filter((entry) => entry.class?.year === year);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-foreground">Student Schedule</h1>
        <div className="flex items-center gap-2 print:hidden">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-40" aria-label="Filter by year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All years</SelectItem>
              {YEARS.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" aria-hidden="true" /> Print
          </Button>
        </div>
      </div>

      <YearLegend />

      {query.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading timetable…</p>
      ) : entries.length === 0 ? (
        <p className="surface-card p-6 text-sm text-muted-foreground">
          No classes are scheduled for this selection yet.
        </p>
      ) : (
        <div className="surface-card p-4">
          <TimetableGrid entries={entries} />
        </div>
      )}
    </div>
  );
}
