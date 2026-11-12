import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addTeacher } from "@/lib/campus.functions";
import { teacherSchema } from "@/lib/campus.schemas";

export const Route = createFileRoute("/_authenticated/add-teacher")({
  head: () => ({
    meta: [
      { title: "Add Teacher · Smart Campus Scheduler" },
      { name: "description", content: "Register a faculty member, their subject and years handled." },
      { property: "og:title", content: "Add Teacher · Smart Campus Scheduler" },
      { property: "og:description", content: "Register faculty for timetable generation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AddTeacherPage,
});

function AddTeacherPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const submit = useServerFn(addTeacher);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", subject: "", years_handled: "", email: "" });

  const mutation = useMutation({
    mutationFn: (data: typeof form) => submit({ data }),
    onSuccess: (result) => {
      if (!result.success) {
        setError(result.error ?? "Could not add teacher.");
        return;
      }
      queryClient.invalidateQueries();
      toast.success("Teacher added successfully");
      navigate({ to: "/dashboard" });
    },
    onError: () => setError("Something went wrong. Please try again."),
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const parsed = teacherSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }
    mutation.mutate(parsed.data);
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-3xl font-bold text-foreground">Add Teacher</h1>
      <form className="surface-card mt-6 space-y-4 p-6" onSubmit={handleSubmit} noValidate>
        <div className="space-y-2">
          <Label htmlFor="name">Teacher Name</Label>
          <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            placeholder="e.g. Cybersecurity"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="years">Years Handled</Label>
          <Input
            id="years"
            placeholder="e.g. 1st, 2nd"
            value={form.years_handled}
            onChange={(e) => setForm({ ...form, years_handled: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="flex gap-3">
          <Button type="submit" disabled={mutation.isPending}>
            Add Teacher
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/dashboard" })}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
