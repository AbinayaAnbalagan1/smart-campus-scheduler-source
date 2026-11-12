import { z } from "zod";
import { ROOM_TYPES, YEARS } from "./scheduler";

export const teacherSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100),
  subject: z.string().trim().min(2, "Subject is required").max(100),
  years_handled: z.string().trim().min(1, "Years handled is required").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
});
export type TeacherInput = z.infer<typeof teacherSchema>;

export const roomSchema = z.object({
  room_number: z.string().trim().min(1, "Room number is required").max(30),
  capacity: z.coerce.number().int().min(1, "Capacity must be at least 1").max(2000),
  room_type: z.enum(ROOM_TYPES),
});
export type RoomInput = z.infer<typeof roomSchema>;

export const classSchema = z.object({
  year: z.enum(YEARS),
  subject: z.string().trim().min(2, "Subject is required").max(100),
  hours_per_week: z.coerce.number().int().min(1, "At least 1 hour").max(20),
  student_count: z.coerce.number().int().min(1).max(2000),
  room_type: z.enum(ROOM_TYPES),
  teacher_id: z.string().uuid("Select a teacher"),
});
export type ClassInput = z.infer<typeof classSchema>;

export const bookingSchema = z.object({
  room_id: z.string().uuid("Select a room"),
  teacher_name: z.string().trim().min(2, "Name is required").max(100),
  booking_date: z.string().min(1, "Pick a date"),
  start_time: z.string().min(1, "Start time is required").max(20),
  end_time: z.string().min(1, "End time is required").max(20),
  purpose: z.string().trim().min(2, "Purpose is required").max(300),
});
export type BookingInput = z.infer<typeof bookingSchema>;
