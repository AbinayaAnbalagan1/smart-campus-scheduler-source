import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TimetableGrid, YearLegend, type ScheduleEntry } from "@/components/TimetableGrid";
import { listSchedules } from "@/lib/campus.functions";

export const Route = createFileRoute("/_authenticated/view-schedule")({
  head: () => ({
    meta: [
      { title: "View Schedule · Smart Campus Scheduler" },
      { name: "description", content: "The generated weekly campus timetable by day and time slot." },
      { property: "og:title", content: "View Schedule · Smart Campus Scheduler" },
      { property: "og:description", content: "Weekly campus timetable across all year groups." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ViewSchedulePage,
});

function ViewSchedulePage() {
  const fetchSchedules = useServerFn(listSchedules);
  const query = useQuery({ queryKey: ["schedules"], queryFn: () => fetchSchedules({}) });
  const entries = (query.data ?? []) as unknown as ScheduleEntry[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-foreground">Weekly Timetable</h1>
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" aria-hidden="true" /> Download PDF
          </Button>
          <Button asChild variant="ghost">
            <Link to="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </div>

      <YearLegend />

      {query.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading timetable…</p>
      ) : entries.length === 0 ? (
        <p className="surface-card p-6 text-sm text-muted-foreground">
          No schedule has been generated yet.{" "}
          <Link to="/generate-schedule" className="underline underline-offset-4">
            Generate one now
          </Link>
          .
        </p>
      ) : (
        <div className="surface-card p-4">
          <TimetableGrid entries={entries} />
        </div>
      )}
    </div>
  );
}
