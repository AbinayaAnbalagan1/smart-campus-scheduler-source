import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarRange, CheckCircle2, DoorOpen, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart Campus Scheduler — Auto Timetables & Room Booking" },
      {
        name: "description",
        content:
          "Generate conflict-free college timetables and manage classroom, lab and auditorium bookings from one campus dashboard.",
      },
      { property: "og:title", content: "Smart Campus Scheduler" },
      {
        property: "og:description",
        content:
          "Automatic timetable generation, teacher and student schedules, and campus room bookings.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const features = [
  {
    icon: CalendarRange,
    title: "Conflict-free timetables",
    body: "A constraint solver assigns every weekly class hour to a free room, teacher and slot.",
  },
  {
    icon: Users,
    title: "Teacher & student views",
    body: "Teachers see only their own classes; students filter the full timetable by year.",
  },
  {
    icon: DoorOpen,
    title: "Room bookings",
    body: "Request classrooms, labs and auditoriums, with admin approval built in.",
  },
];

function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary py-4 text-primary-foreground">
        <div className="campus-container flex items-center justify-between gap-4">
          <span className="flex items-center gap-2 text-lg font-bold">
            <CalendarRange className="h-5 w-5" aria-hidden="true" /> Smart Campus Scheduler
          </span>
          <Button asChild variant="secondary" size="sm">
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="bg-secondary py-16">
          <div className="campus-container max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Campus timetables that build themselves
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Add your teachers, rooms and classes once. The scheduler places every session
              without clashing a teacher, a year group or a room.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/auth">Get started</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/student-schedule">View timetable</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="campus-container py-14">
          <h2 className="text-2xl font-bold text-foreground">What you can do</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.title} className="surface-card p-6">
                <feature.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                <h3 className="mt-3 text-lg font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-secondary py-14">
          <div className="campus-container">
            <h2 className="text-2xl font-bold text-foreground">How it works</h2>
            <ol className="mt-6 grid gap-3 md:grid-cols-4">
              {[
                "Add teachers and their subjects",
                "Add rooms with capacity and type",
                "Add classes with weekly hours",
                "Generate the timetable",
              ].map((step, i) => (
                <li key={step} className="surface-card flex gap-3 p-5">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
                  <span className="text-sm font-medium text-foreground">
                    {i + 1}. {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      <footer className="bg-primary py-6 text-primary-foreground">
        <div className="campus-container text-sm opacity-85">
          Smart Campus Scheduler — automated academic planning.
        </div>
      </footer>
    </div>
  );
}
