import { createFileRoute } from "@tanstack/react-router";
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
import { addBooking, listBookings, listRooms, setBookingStatus } from "@/lib/campus.functions";
import { bookingSchema } from "@/lib/campus.schemas";
import { TIME_SLOTS } from "@/lib/scheduler";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/bookings")({
  head: () => ({
    meta: [
      { title: "Room Bookings · Smart Campus Scheduler" },
      { name: "description", content: "Request and approve classroom, lab and auditorium bookings." },
      { property: "og:title", content: "Room Bookings · Smart Campus Scheduler" },
      { property: "og:description", content: "Manage campus room booking requests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BookingsPage,
});

function BookingsPage() {
  const queryClient = useQueryClient();
  const { isAdmin, username } = useAuth();
  const fetchRooms = useServerFn(listRooms);
  const fetchBookings = useServerFn(listBookings);
  const submit = useServerFn(addBooking);
  const updateStatus = useServerFn(setBookingStatus);

  const roomsQuery = useQuery({ queryKey: ["rooms"], queryFn: () => fetchRooms({}) });
  const bookingsQuery = useQuery({ queryKey: ["bookings"], queryFn: () => fetchBookings({}) });

  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    room_id: "",
    teacher_name: "",
    booking_date: "",
    start_time: TIME_SLOTS[0] as string,
    end_time: TIME_SLOTS[1] as string,
    purpose: "",
  });

  const create = useMutation({
    mutationFn: (data: typeof form) => submit({ data }),
    onSuccess: (result) => {
      if (!result.success) {
        setError(result.error ?? "Could not create booking.");
        return;
      }
      queryClient.invalidateQueries();
      toast.success("Booking requested");
      setForm({ ...form, purpose: "", booking_date: "" });
    },
    onError: () => setError("Something went wrong. Please try again."),
  });

  const approve = useMutation({
    mutationFn: (vars: { id: string; status: "pending" | "approved" }) => updateStatus({ data: vars }),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error ?? "Could not update booking");
        return;
      }
      queryClient.invalidateQueries();
      toast.success("Booking updated");
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const parsed = bookingSchema.safeParse({ ...form, teacher_name: form.teacher_name || username });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }
    create.mutate(parsed.data);
  };

  const bookings = bookingsQuery.data ?? [];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-foreground">Room Bookings</h1>

      <form className="surface-card grid gap-4 p-6 md:grid-cols-2" onSubmit={handleSubmit} noValidate>
        <div className="space-y-2">
          <Label htmlFor="room">Room</Label>
          <Select value={form.room_id} onValueChange={(v) => setForm({ ...form, room_id: v })}>
            <SelectTrigger id="room">
              <SelectValue placeholder="Select a room" />
            </SelectTrigger>
            <SelectContent>
              {(roomsQuery.data ?? []).map((room) => (
                <SelectItem key={room.id} value={room.id}>
                  {room.room_number} · {room.room_type} ({room.capacity})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="teacher-name">Requested by</Label>
          <Input
            id="teacher-name"
            value={form.teacher_name}
            placeholder={username || "Your name"}
            onChange={(e) => setForm({ ...form, teacher_name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={form.booking_date}
            onChange={(e) => setForm({ ...form, booking_date: e.target.value })}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="start">Start</Label>
            <Select value={form.start_time} onValueChange={(v) => setForm({ ...form, start_time: v })}>
              <SelectTrigger id="start">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {slot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="end">End</Label>
            <Select value={form.end_time} onValueChange={(v) => setForm({ ...form, end_time: v })}>
              <SelectTrigger id="end">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {slot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="purpose">Purpose</Label>
          <Input
            id="purpose"
            value={form.purpose}
            onChange={(e) => setForm({ ...form, purpose: e.target.value })}
            required
          />
        </div>
        {error ? <p className="text-sm text-destructive md:col-span-2">{error}</p> : null}
        <div className="md:col-span-2">
          <Button type="submit" disabled={create.isPending}>
            Request booking
          </Button>
        </div>
      </form>

      <section>
        <h2 className="text-xl font-bold text-foreground">Requests</h2>
        <div className="surface-card mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-primary text-primary-foreground">
              <tr>
                <th scope="col" className="px-4 py-2 text-left">Room</th>
                <th scope="col" className="px-4 py-2 text-left">Requested by</th>
                <th scope="col" className="px-4 py-2 text-left">Date</th>
                <th scope="col" className="px-4 py-2 text-left">Time</th>
                <th scope="col" className="px-4 py-2 text-left">Purpose</th>
                <th scope="col" className="px-4 py-2 text-left">Status</th>
                {isAdmin ? <th scope="col" className="px-4 py-2 text-right">Action</th> : null}
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-4 py-8 text-center text-muted-foreground">
                    No booking requests yet.
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id} className="border-t border-border odd:bg-muted/40 hover:bg-muted">
                    <td className="px-4 py-2">{booking.room?.room_number ?? "—"}</td>
                    <td className="px-4 py-2">{booking.teacher_name}</td>
                    <td className="px-4 py-2">{booking.booking_date}</td>
                    <td className="px-4 py-2">
                      {booking.start_time} – {booking.end_time}
                    </td>
                    <td className="px-4 py-2">{booking.purpose}</td>
                    <td className="px-4 py-2 capitalize">{booking.status}</td>
                    {isAdmin ? (
                      <td className="px-4 py-2 text-right">
                        <Button
                          size="sm"
                          variant={booking.status === "approved" ? "outline" : "default"}
                          onClick={() =>
                            approve.mutate({
                              id: booking.id,
                              status: booking.status === "approved" ? "pending" : "approved",
                            })
                          }
                        >
                          {booking.status === "approved" ? "Set pending" : "Approve"}
                        </Button>
                      </td>
                    ) : null}
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
