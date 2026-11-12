import { DAYS, TIME_SLOTS } from "@/lib/scheduler";
import { cn } from "@/lib/utils";

export type ScheduleEntry = {
  id: string;
  day: string;
  start_time: string;
  end_time: string;
  room: { id: string; room_number: string } | null;
  class: {
    id: string;
    year: string;
    subject: string;
    student_count?: number;
    teacher: { id: string; name: string } | null;
  } | null;
};

const yearClasses: Record<string, string> = {
  "1st Year": "bg-year-1 text-year-1-foreground",
  "2nd Year": "bg-year-2 text-year-2-foreground",
  "3rd Year": "bg-year-3 text-year-3-foreground",
  "4th Year": "bg-year-4 text-year-4-foreground",
};

export function TimetableGrid({ entries }: { entries: ScheduleEntry[] }) {
  const lookup = new Map<string, ScheduleEntry[]>();
  for (const entry of entries) {
    const key = `${entry.day}|${entry.start_time}`;
    lookup.set(key, [...(lookup.get(key) ?? []), entry]);
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] border-collapse text-sm">
        <caption className="sr-only">Weekly campus timetable</caption>
        <thead>
          <tr className="bg-primary text-primary-foreground">
            <th scope="col" className="w-24 border border-border px-3 py-2 text-left">
              Time
            </th>
            {DAYS.map((day) => (
              <th key={day} scope="col" className="border border-border px-3 py-2 text-left">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TIME_SLOTS.map((slot) => (
            <tr key={slot} className="odd:bg-muted/40">
              <th scope="row" className="border border-border px-3 py-2 text-left font-semibold">
                {slot}
              </th>
              {DAYS.map((day) => {
                const cell = lookup.get(`${day}|${slot}`) ?? [];
                return (
                  <td key={day} className="border border-border p-1 align-top">
                    {cell.length === 0 ? (
                      <span className="block px-2 py-3 text-xs text-muted-foreground">—</span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {cell.map((entry) => (
                          <div
                            key={entry.id}
                            className={cn(
                              "rounded-md px-2 py-2 text-xs leading-snug",
                              yearClasses[entry.class?.year ?? ""] ?? "bg-muted text-foreground",
                            )}
                          >
                            <p className="font-bold">{entry.class?.subject}</p>
                            <p>{entry.class?.year}</p>
                            <p>
                              {entry.room?.room_number} · {entry.class?.teacher?.name}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function YearLegend() {
  return (
    <ul className="flex flex-wrap gap-2 text-xs">
      {Object.entries(yearClasses).map(([year, klass]) => (
        <li key={year} className={cn("rounded-md px-3 py-1 font-semibold", klass)}>
          {year}
        </li>
      ))}
    </ul>
  );
}
