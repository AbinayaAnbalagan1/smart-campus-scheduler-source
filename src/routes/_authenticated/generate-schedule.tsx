import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { generateTimetable, listScheduleRuns } from "@/lib/campus.functions";

export const Route = createFileRoute("/_authenticated/generate-schedule")({
  head: () => ({
    meta: [
      { title: "Generate Schedule · Smart Campus Scheduler" },
      { name: "description", content: "Automatically build a conflict-free weekly campus timetable." },
      { property: "og:title", content: "Generate Schedule · Smart Campus Scheduler" },
      { property: "og:description", content: "One click conflict-free timetable generation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GenerateSchedulePage,
});

function GenerateSchedulePage() {
  const queryClient = useQueryClient();
  const run = useServerFn(generateTimetable);
  const fetchRuns = useServerFn(listScheduleRuns);
  const runsQuery = useQuery({ queryKey: ["schedule-runs"], queryFn: () => fetchRuns({}) });

  const mutation = useMutation({
    mutationFn: () => run({}),
    onSuccess: (result) => {
      queryClient.invalidateQueries();
      if (result.success) toast.success("Schedule generated successfully");
      else toast.error(result.error ?? "Could not generate schedule");
    },
    onError: () => toast.error("Could not generate schedule due to constraints"),
  });

  const result = mutation.data;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Generate Schedule</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Click the button to automatically generate a conflict-free schedule.
        </p>
      </div>

      <div className="surface-card space-y-4 p-6">
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} size="lg">
          {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {mutation.isPending ? "Generating schedule…" : "Generate Timetable"}
        </Button>

        {result && result.success ? (
          <div className="space-y-3">
            <p className="font-semibold text-accent">Schedule generated successfully.</p>
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-border">
                  <th scope="row" className="py-2 text-left font-medium">Total classes scheduled</th>
                  <td className="py-2 text-right font-bold">{result.classesScheduled}</td>
                </tr>
                <tr className="border-b border-border">
                  <th scope="row" className="py-2 text-left font-medium">Total rooms used</th>
                  <td className="py-2 text-right font-bold">{result.roomsUsed}</td>
                </tr>
                <tr>
                  <th scope="row" className="py-2 text-left font-medium">Total teachers assigned</th>
                  <td className="py-2 text-right font-bold">{result.teachersAssigned}</td>
                </tr>
              </tbody>
            </table>
            <Button asChild variant="outline">
              <Link to="/view-schedule">View Schedule</Link>
            </Button>
          </div>
        ) : null}

        {result && !result.success ? (
          <p className="text-sm text-destructive">
            Could not generate schedule due to constraints. {result.error}
          </p>
        ) : null}
      </div>

      <section>
        <h2 className="text-xl font-bold text-foreground">Recent generations</h2>
        <div className="surface-card mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th scope="col" className="px-4 py-2 text-left">When</th>
                <th scope="col" className="px-4 py-2 text-left">Status</th>
                <th scope="col" className="px-4 py-2 text-right">Classes</th>
                <th scope="col" className="px-4 py-2 text-right">Rooms</th>
                <th scope="col" className="px-4 py-2 text-right">Teachers</th>
              </tr>
            </thead>
            <tbody>
              {(runsQuery.data ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                    No schedule has been generated yet.
                  </td>
                </tr>
              ) : (
                (runsQuery.data ?? []).map((entry) => (
                  <tr key={entry.id} className="border-t border-border odd:bg-muted/40">
                    <td className="px-4 py-2">{new Date(entry.created_at).toLocaleString()}</td>
                    <td className="px-4 py-2 capitalize">{entry.status}</td>
                    <td className="px-4 py-2 text-right">{entry.classes_scheduled ?? 0}</td>
                    <td className="px-4 py-2 text-right">{entry.rooms_used ?? 0}</td>
                    <td className="px-4 py-2 text-right">{entry.teachers_assigned ?? 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
