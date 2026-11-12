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
import { listSchedules, listTeachers } from "@/lib/campus.functions";
import { getMyTeacherId } from "@/lib/auth.functions";
import type { ScheduleEntry } from "@/components/TimetableGrid";
import { DAYS, TIME_SLOTS } from "@/lib/scheduler";

export const Route = createFileRoute("/_authenticated/teacher-schedule")({
  head: () => ({
    meta: [
      { title: "Teacher Schedule · Smart Campus Scheduler" },
      { name: "description", content: "The weekly classes assigned to a selected faculty member." },
      { property: "og:title", content: "Teacher Schedule · Smart Campus Scheduler" },
      { property: "og:description", content: "See each teacher's weekly class assignments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TeacherSchedulePage,
});

function TeacherSchedulePage() {
  const fetchSchedules = useServerFn(listSchedules);
  const fetchTeachers = useServerFn(listTeachers);
  const schedulesQuery = useQuery({ queryKey: ["schedules"], queryFn: () => fetchSchedules({}) });
  const teachersQuery = useQuery({ queryKey: ["teachers"], queryFn: () => fetchTeachers({}) });
  const fetchMyTeacherId = useServerFn(getMyTeacherId);
  const myTeacherQuery = useQuery({ queryKey: ["my-teacher-id"], queryFn: () => fetchMyTeacherId({}) });

  const teachers = teachersQuery.data ?? [];
  const matchedId = myTeacherQuery.data?.teacherId ?? null;
  const [selected, setSelected] = useState<string>("");
  const teacherId = selected || matchedId || teachers[0]?.id || "";

  const rows = ((schedulesQuery.data ?? []) as unknown as ScheduleEntry[])
    .filter((entry) => entry.class?.teacher?.id === teacherId)
    .sort(
      (a, b) =>
        DAYS.indexOf(a.day as never) - DAYS.indexOf(b.day as never) ||
        TIME_SLOTS.indexOf(a.start_time as never) - TIME_SLOTS.indexOf(b.start_time as never),
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-foreground">Teacher Schedule</h1>
        <div className="flex items-center gap-2 print:hidden">
          <Select value={teacherId} onValueChange={setSelected}>
            <SelectTrigger className="w-60" aria-label="Select teacher">
              <SelectValue placeholder="Select teacher" />
            </SelectTrigger>
            <SelectContent>
              {teachers.map((teacher) => (
                <SelectItem key={teacher.id} value={teacher.id}>
                  {teacher.name} ({teacher.subject})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" aria-hidden="true" /> Print
          </Button>
        </div>
      </div>

      <div className="surface-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-primary text-primary-foreground">
            <tr>
              <th scope="col" className="px-4 py-2 text-left">Class</th>
              <th scope="col" className="px-4 py-2 text-left">Year</th>
              <th scope="col" className="px-4 py-2 text-left">Day</th>
              <th scope="col" className="px-4 py-2 text-left">Time</th>
              <th scope="col" className="px-4 py-2 text-left">Room</th>
              <th scope="col" className="px-4 py-2 text-right">Students</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No classes are assigned to this teacher yet.
                </td>
              </tr>
            ) : (
              rows.map((entry) => (
                <tr key={entry.id} className="border-t border-border odd:bg-muted/40 hover:bg-muted">
                  <td className="px-4 py-2 font-medium">{entry.class?.subject}</td>
                  <td className="px-4 py-2">{entry.class?.year}</td>
                  <td className="px-4 py-2">{entry.day}</td>
                  <td className="px-4 py-2">{entry.start_time}</td>
                  <td className="px-4 py-2">{entry.room?.room_number}</td>
                  <td className="px-4 py-2 text-right">{entry.class?.student_count ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        The weekly pattern repeats every week, including the next two weeks.
      </p>
    </div>
  );
}