import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addClass, listTeachers } from "@/lib/campus.functions";
import { classSchema } from "@/lib/campus.schemas";
import { ROOM_TYPES, YEARS } from "@/lib/scheduler";

export const Route = createFileRoute("/_authenticated/add-class")({
  head: () => ({
    meta: [
      { title: "Add Class · Smart Campus Scheduler" },
      { name: "description", content: "Add a subject with weekly hours, student count and teacher." },
      { property: "og:title", content: "Add Class · Smart Campus Scheduler" },
      { property: "og:description", content: "Define classes for automatic timetable generation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AddClassPage,
});

function AddClassPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const submit = useServerFn(addClass);
  const fetchTeachers = useServerFn(listTeachers);
  const teachersQuery = useQuery({ queryKey: ["teachers"], queryFn: () => fetchTeachers({}) });

  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState<(typeof YEARS)[number]>("1st Year");
  const [subject, setSubject] = useState("");
  const [hours, setHours] = useState("3");
  const [students, setStudents] = useState("50");
  const [roomType, setRoomType] = useState<(typeof ROOM_TYPES)[number]>("classroom");
  const [teacherId, setTeacherId] = useState("");

  const mutation = useMutation({
    mutationFn: (data: Parameters<typeof submit>[0]["data"]) => submit({ data }),
    onSuccess: (result) => {
      if (!result.success) {
        setError(result.error ?? "Could not add class.");
        return;
      }
      queryClient.invalidateQueries();
      toast.success("Class added successfully");
      navigate({ to: "/dashboard" });
    },
    onError: () => setError("Something went wrong. Please try again."),
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const parsed = classSchema.safeParse({
      year,
      subject,
      hours_per_week: hours,
      student_count: students,
      room_type: roomType,
      teacher_id: teacherId,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }
    mutation.mutate(parsed.data);
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-3xl font-bold text-foreground">Add Class</h1>
      <form className="surface-card mt-6 space-y-4 p-6" onSubmit={handleSubmit} noValidate>
        <div className="space-y-2">
          <Label htmlFor="year">Year</Label>
          <Select value={year} onValueChange={(v) => setYear(v as typeof year)}>
            <SelectTrigger id="year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hours">Hours Per Week</Label>
          <Input
            id="hours"
            type="number"
            min={1}
            max={20}
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="students">Student Count</Label>
          <Input
            id="students"
            type="number"
            min={1}
            value={students}
            onChange={(e) => setStudents(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="class-room-type">Room Type Required</Label>
          <Select value={roomType} onValueChange={(v) => setRoomType(v as typeof roomType)}>
            <SelectTrigger id="class-room-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROOM_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="teacher">Teacher</Label>
          <Select value={teacherId} onValueChange={setTeacherId}>
            <SelectTrigger id="teacher">
              <SelectValue placeholder="Select a teacher" />
            </SelectTrigger>
            <SelectContent>
              {(teachersQuery.data ?? []).map((teacher) => (
                <SelectItem key={teacher.id} value={teacher.id}>
                  {teacher.name} ({teacher.subject})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="flex gap-3">
          <Button type="submit" disabled={mutation.isPending}>
            Add Class
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/dashboard" })}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
