import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { addRoom } from "@/lib/campus.functions";
import { roomSchema } from "@/lib/campus.schemas";
import { ROOM_TYPES } from "@/lib/scheduler";

export const Route = createFileRoute("/_authenticated/add-room")({
  head: () => ({
    meta: [
      { title: "Add Room · Smart Campus Scheduler" },
      { name: "description", content: "Add a classroom, lab or auditorium with its capacity." },
      { property: "og:title", content: "Add Room · Smart Campus Scheduler" },
      { property: "og:description", content: "Add campus rooms for scheduling and bookings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AddRoomPage,
});

function AddRoomPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const submit = useServerFn(addRoom);
  const [error, setError] = useState<string | null>(null);
  const [roomNumber, setRoomNumber] = useState("");
  const [capacity, setCapacity] = useState("50");
  const [roomType, setRoomType] = useState<(typeof ROOM_TYPES)[number]>("classroom");

  const mutation = useMutation({
    mutationFn: (data: { room_number: string; capacity: number; room_type: (typeof ROOM_TYPES)[number] }) =>
      submit({ data }),
    onSuccess: (result) => {
      if (!result.success) {
        setError(result.error ?? "Could not add room.");
        return;
      }
      queryClient.invalidateQueries();
      toast.success("Room added successfully");
      navigate({ to: "/dashboard" });
    },
    onError: () => setError("Something went wrong. Please try again."),
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const parsed = roomSchema.safeParse({ room_number: roomNumber, capacity, room_type: roomType });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }
    mutation.mutate(parsed.data);
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-3xl font-bold text-foreground">Add Room</h1>
      <form className="surface-card mt-6 space-y-4 p-6" onSubmit={handleSubmit} noValidate>
        <div className="space-y-2">
          <Label htmlFor="room-number">Room Number</Label>
          <Input
            id="room-number"
            placeholder="e.g. A101 or LAB-01"
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="capacity">Capacity</Label>
          <Input
            id="capacity"
            type="number"
            min={1}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="room-type">Room Type</Label>
          <Select value={roomType} onValueChange={(v) => setRoomType(v as typeof roomType)}>
            <SelectTrigger id="room-type">
              <SelectValue placeholder="Select type" />
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
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="flex gap-3">
          <Button type="submit" disabled={mutation.isPending}>
            Add Room
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/dashboard" })}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
