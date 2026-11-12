import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  listTeachers,
  listRooms,
  listClasses,
  deleteTeacher,
  deleteRoom,
  deleteClass,
} from "@/lib/campus.functions";

export const Route = createFileRoute("/_authenticated/manage-data")({
  component: ManageDataPage,
});

function ManageDataPage() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);

  const fetchTeachers = useServerFn(listTeachers);
  const fetchRooms = useServerFn(listRooms);
  const fetchClasses = useServerFn(listClasses);
  const removeTeacher = useServerFn(deleteTeacher);
  const removeRoom = useServerFn(deleteRoom);
  const removeClass = useServerFn(deleteClass);

  const teachers = useQuery({ queryKey: ["teachers"], queryFn: () => fetchTeachers({}) });
  const rooms = useQuery({ queryKey: ["rooms"], queryFn: () => fetchRooms({}) });
  const classes = useQuery({ queryKey: ["classes"], queryFn: () => fetchClasses({}) });

  const handleDelete = async (
    label: string,
    run: () => Promise<{ success: boolean; error?: string }>,
    queryKey: string,
  ) => {
    if (!window.confirm(`Delete this ${label}? This cannot be undone.`)) return;
    const result = await run();
    if (!result.success) {
      setMessage(result.error ?? "Delete failed.");
      return;
    }
    setMessage(`${label} deleted. Click Generate Timetable to rebuild the schedule.`);
    await queryClient.invalidateQueries({ queryKey: [queryKey] });
    await queryClient.invalidateQueries({ queryKey: ["schedules"] });
  };

  const sectionClass = "surface-card overflow-x-auto mb-8";
  const thClass = "px-4 py-2 text-left";
  const tdClass = "px-4 py-2";

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-foreground">Manage Data</h1>

      {message && (
        <div className="rounded-md bg-muted p-3 text-sm">{message}</div>
      )}

      <h2 className="text-xl font-semibold">Teachers</h2>
      <div className={sectionClass}>
        <table className="w-full text-sm">
          <thead className="bg-primary text-primary-foreground">
            <tr>
              <th className={thClass}>Name</th>
              <th className={thClass}>Subject</th>
              <th className={thClass}></th>
            </tr>
          </thead>
          <tbody>
            {(teachers.data ?? []).map((t) => (
              <tr key={t.id} className="border-t">
                <td className={tdClass}>{t.name}</td>
                <td className={tdClass}>{t.subject}</td>
                <td className={tdClass}>
                  <Button
                    variant="destructive"
                    onClick={() =>
                      handleDelete("teacher", () => removeTeacher({ data: { id: t.id } }), "teachers")
                    }
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-xl font-semibold">Rooms</h2>
      <div className={sectionClass}>
        <table className="w-full text-sm">
          <thead className="bg-primary text-primary-foreground">
            <tr>
              <th className={thClass}>Room</th>
              <th className={thClass}>Type</th>
              <th className={thClass}>Capacity</th>
              <th className={thClass}></th>
            </tr>
          </thead>
          <tbody>
            {(rooms.data ?? []).map((r) => (
              <tr key={r.id} className="border-t">
                <td className={tdClass}>{r.room_number}</td>
                <td className={tdClass}>{r.room_type}</td>
                <td className={tdClass}>{r.capacity}</td>
                <td className={tdClass}>
                  <Button
                    variant="destructive"
                    onClick={() =>
                      handleDelete("room", () => removeRoom({ data: { id: r.id } }), "rooms")
                    }
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-xl font-semibold">Classes</h2>
      <div className={sectionClass}>
        <table className="w-full text-sm">
          <thead className="bg-primary text-primary-foreground">
            <tr>
              <th className={thClass}>Subject</th>
              <th className={thClass}>Year</th>
              <th className={thClass}>Teacher</th>
              <th className={thClass}></th>
            </tr>
          </thead>
          <tbody>
            {(classes.data ?? []).map((c) => (
              <tr key={c.id} className="border-t">
                <td className={tdClass}>{c.subject}</td>
                <td className={tdClass}>{c.year}</td>
                <td className={tdClass}>{c.teacher?.name ?? "—"}</td>
                <td className={tdClass}>
                  <Button
                    variant="destructive"
                    onClick={() =>
                      handleDelete("class", () => removeClass({ data: { id: c.id } }), "classes")
                    }
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}