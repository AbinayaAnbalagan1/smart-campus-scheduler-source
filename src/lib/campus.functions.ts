import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  bookingSchema,
  classSchema,
  roomSchema,
  teacherSchema,
  type BookingInput,
  type ClassInput,
  type RoomInput,
  type TeacherInput,
} from "./campus.schemas";
import { generateSchedule } from "./scheduler";

export const listTeachers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("teachers")
      .select("id, name, subject, years_handled")
      .order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const addTeacher = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: TeacherInput) => teacherSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("teachers").insert(data);
    if (error) {
      if (error.code === "23505") return { success: false, error: "That email is already registered." };
      if (error.code === "42501") return { success: false, error: "Admin access is required." };
      return { success: false, error: error.message };
    }
    return { success: true as const };
  });

export const listRooms = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("rooms")
      .select("id, room_number, capacity, room_type")
      .order("room_number");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const addRoom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: RoomInput) => roomSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("rooms").insert(data);
    if (error) {
      if (error.code === "23505") return { success: false, error: "That room number already exists." };
      if (error.code === "42501") return { success: false, error: "Admin access is required." };
      return { success: false, error: error.message };
    }
    return { success: true as const };
  });

export const listClasses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("classes")
      .select(
        "id, year, subject, hours_per_week, student_count, room_type, teacher_id, teacher:teachers(id, name, subject)",
      )
      .order("year");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const addClass = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ClassInput) => classSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("classes").insert(data);
    if (error) {
      if (error.code === "42501") return { success: false, error: "Admin access is required." };
      return { success: false, error: error.message };
    }
    return { success: true as const };
  });

export const listSchedules = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("schedules")
      .select(
        "id, day, start_time, end_time, room:rooms(id, room_number, room_type, capacity), class:classes(id, year, subject, student_count, teacher:teachers(id, name))",
      );
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [teachers, rooms, classes, schedules, bookings] = await Promise.all([
      context.supabase.from("teachers").select("id", { count: "exact", head: true }),
      context.supabase.from("rooms").select("id", { count: "exact", head: true }),
      context.supabase.from("classes").select("id", { count: "exact", head: true }),
      context.supabase.from("schedules").select("id", { count: "exact", head: true }),
      context.supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "pending"),
    ]);
    return {
      teachers: teachers.count ?? 0,
      rooms: rooms.count ?? 0,
      classes: classes.count ?? 0,
      scheduled: schedules.count ?? 0,
      pendingBookings: bookings.count ?? 0,
    };
  });

export const generateTimetable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roleRow } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return { success: false as const, error: "Only administrators can generate the timetable." };

    const [{ data: classes, error: classErr }, { data: rooms, error: roomErr }] = await Promise.all([
      context.supabase
        .from("classes")
        .select("id, year, subject, hours_per_week, student_count, room_type, teacher_id"),
      context.supabase.from("rooms").select("id, room_number, capacity, room_type"),
    ]);
    if (classErr) return { success: false as const, error: classErr.message };
    if (roomErr) return { success: false as const, error: roomErr.message };

    const result = generateSchedule(classes ?? [], rooms ?? []);
    if (!result.ok) {
      await context.supabase.from("schedule_runs").insert({
        generated_by: context.userId,
        status: "failed",
      });
      return { success: false as const, error: result.reason };
    }

    const { error: delErr } = await context.supabase.from("schedules").delete().neq("day", "__none__");
    if (delErr) return { success: false as const, error: delErr.message };

    const { error: insErr } = await context.supabase.from("schedules").insert(result.assignments);
    if (insErr) return { success: false as const, error: insErr.message };

    const roomsUsed = new Set(result.assignments.map((a) => a.room_id)).size;
    const teachersAssigned = new Set(
      result.assignments.map((a) => (classes ?? []).find((c) => c.id === a.class_id)?.teacher_id),
    ).size;

    await context.supabase.from("schedule_runs").insert({
      generated_by: context.userId,
      classes_scheduled: result.assignments.length,
      rooms_used: roomsUsed,
      teachers_assigned: teachersAssigned,
      status: "success",
    });

    return {
      success: true as const,
      classesScheduled: result.assignments.length,
      roomsUsed,
      teachersAssigned,
    };
  });

export const listScheduleRuns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("schedule_runs")
      .select("id, created_at, classes_scheduled, rooms_used, teachers_assigned, status")
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("bookings")
      .select("id, teacher_name, booking_date, start_time, end_time, purpose, status, room:rooms(id, room_number)")
      .order("booking_date", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const addBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: BookingInput) => bookingSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("bookings")
      .insert({ ...data, requested_by: context.userId, status: "pending" });
    if (error) return { success: false as const, error: error.message };
    return { success: true as const };
  });

export const setBookingStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; status: "pending" | "approved" }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("bookings")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) {
      if (error.code === "42501") return { success: false as const, error: "Admin access is required." };
      return { success: false as const, error: error.message };
    }
    return { success: true as const };
  });
export const deleteTeacher = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("teachers").delete().eq("id", data.id);
    if (error) {
      if (error.code === "23503") return { success: false, error: "This teacher still has classes. Delete those classes first." };
      return { success: false, error: error.message };
    }
    return { success: true as const };
  });

export const deleteRoom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("rooms").delete().eq("id", data.id);
    if (error) return { success: false, error: error.message };
    return { success: true as const };
  });

export const deleteClass = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    await context.supabase.from("schedules").delete().eq("class_id", data.id);
    const { error } = await context.supabase.from("classes").delete().eq("id", data.id);
    if (error) return { success: false, error: error.message };
    return { success: true as const };
  });