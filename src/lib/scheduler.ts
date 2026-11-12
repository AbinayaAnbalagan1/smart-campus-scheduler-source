export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;
export const TIME_SLOTS = ["9-10", "10-11", "11-12", "12-1", "2-3", "3-4", "4-5"] as const;
export const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"] as const;
export const ROOM_TYPES = ["classroom", "lab", "auditorium"] as const;

export type Day = (typeof DAYS)[number];
export type TimeSlot = (typeof TIME_SLOTS)[number];

const SLOT_END: Record<string, string> = {
  "9-10": "10-11",
  "10-11": "11-12",
  "11-12": "12-1",
  "12-1": "1-2",
  "2-3": "3-4",
  "3-4": "4-5",
  "4-5": "5-6",
};

export function endSlotFor(start: string): string {
  return SLOT_END[start] ?? start;
}

export type SchedulableClass = {
  id: string;
  year: string;
  subject: string;
  hours_per_week: number;
  student_count: number;
  room_type: string;
  teacher_id: string;
};

export type SchedulableRoom = {
  id: string;
  room_number: string;
  capacity: number;
  room_type: string;
};

export type Assignment = {
  class_id: string;
  room_id: string;
  day: string;
  start_time: string;
  end_time: string;
};

export type SchedulingResult =
  | { ok: true; assignments: Assignment[] }
  | { ok: false; reason: string };

type Session = {
  classId: string;
  teacherId: string;
  year: string;
  size: number;
  roomType: string;
  candidateRooms: SchedulableRoom[];
  slotOrder: readonly string[];
};

export function generateSchedule(
  classes: SchedulableClass[],
  rooms: SchedulableRoom[],
): SchedulingResult {
  if (classes.length === 0) return { ok: false, reason: "No classes have been added yet." };
  if (rooms.length === 0) return { ok: false, reason: "No rooms have been added yet." };

  const sessions: Session[] = [];
  const classOffset = new Map<string, number>();
  const yearClassIndex = new Map<string, number>();
  for (const cls of classes) {
    if (!classOffset.has(cls.id)) {
      const idx = yearClassIndex.get(cls.year) ?? 0;
      yearClassIndex.set(cls.year, idx + 1);
      classOffset.set(cls.id, idx % TIME_SLOTS.length);
    }
    const off = classOffset.get(cls.id) ?? 0;
    const slotOrder = [...TIME_SLOTS.slice(off), ...TIME_SLOTS.slice(0, off)];

    const candidateRooms = rooms
      .filter((room) => room.room_type === cls.room_type && room.capacity >= cls.student_count)
      .sort((a, b) => a.capacity - b.capacity);

    if (candidateRooms.length === 0) {
      return {
        ok: false,
        reason: `No ${cls.room_type} with capacity for ${cls.student_count} students is available for "${cls.subject}" (${cls.year}).`,
      };
    }

    const hours = Math.max(1, Math.min(cls.hours_per_week, DAYS.length * TIME_SLOTS.length));
    for (let i = 0; i < hours; i += 1) {
      sessions.push({
        classId: cls.id,
        teacherId: cls.teacher_id,
        year: cls.year,
        size: cls.student_count,
        roomType: cls.room_type,
        candidateRooms,
        slotOrder,
      });
    }
  }

  sessions.sort((a, b) => a.candidateRooms.length - b.candidateRooms.length);

  const teacherBusy = new Set<string>();
  const roomBusy = new Set<string>();
  const yearBusy = new Set<string>();
  const classDayBusy = new Set<string>();
  const classSlotBusy = new Set<string>();
  const assignments: Assignment[] = [];

  let steps = 0;
  const MAX_STEPS = 400_000;

  const solve = (index: number): boolean => {
    if (index >= sessions.length) return true;
    if (steps++ > MAX_STEPS) return false;

    const session = sessions[index]!;

    for (const day of DAYS) {
      for (const slot of session.slotOrder) {
        const key = `${day}|${slot}`;
        if (teacherBusy.has(`${session.teacherId}|${key}`)) continue;
        if (yearBusy.has(`${session.year}|${key}`)) continue;
        if (classDayBusy.has(`${session.classId}|${day}`)) continue;
        if (classSlotBusy.has(`${session.classId}|${slot}`)) continue;

        for (const room of session.candidateRooms) {
          if (roomBusy.has(`${room.id}|${key}`)) continue;

          teacherBusy.add(`${session.teacherId}|${key}`);
          yearBusy.add(`${session.year}|${key}`);
          roomBusy.add(`${room.id}|${key}`);
          classDayBusy.add(`${session.classId}|${day}`);
          classSlotBusy.add(`${session.classId}|${slot}`);
          assignments.push({
            class_id: session.classId,
            room_id: room.id,
            day,
            start_time: slot,
            end_time: endSlotFor(slot),
          });

          if (solve(index + 1)) return true;

          assignments.pop();
          teacherBusy.delete(`${session.teacherId}|${key}`);
          yearBusy.delete(`${session.year}|${key}`);
          roomBusy.delete(`${room.id}|${key}`);
          classDayBusy.delete(`${session.classId}|${day}`);
          classSlotBusy.delete(`${session.classId}|${slot}`);
        }
      }
    }

    return false;
  };

  if (!solve(0)) {
    return {
      ok: false,
      reason:
        "Could not generate schedule due to constraints. Try adding more rooms, reducing weekly hours, or spreading subjects across more teachers.",
    };
  }

  return { ok: true, assignments };
}