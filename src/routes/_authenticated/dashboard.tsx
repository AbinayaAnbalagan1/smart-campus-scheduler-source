import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, DoorOpen, Sparkles, UserPlus } from "lucide-react";
import { getStats } from "@/lib/campus.functions";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · Smart Campus Scheduler" },
      { name: "description", content: "Campus statistics and quick actions for administrators." },
      { property: "og:title", content: "Dashboard · Smart Campus Scheduler" },
      { property: "og:description", content: "Campus statistics and quick actions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const actions = [
  { to: "/add-teacher", label: "Add Teacher", body: "Register faculty and the subjects they handle.", icon: UserPlus },
  { to: "/add-room", label: "Add Room", body: "Classrooms, labs and auditoriums with capacity.", icon: DoorOpen },
  { to: "/generate-schedule", label: "Generate Schedule", body: "Build a conflict-free weekly timetable.", icon: Sparkles },
] as const;

function Dashboard() {
  const { username, role, isAdmin } = useAuth();
  const fetchStats = useServerFn(getStats);
  const statsQuery = useQuery({ queryKey: ["stats"], queryFn: () => fetchStats({}) });
  const stats = statsQuery.data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Welcome{username ? `, ${username}` : ""}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          You are signed in as <strong>{role ?? "student"}</strong>.
        </p>
      </div>

      {isAdmin ? (
        <section>
          <h2 className="text-xl font-bold text-foreground">Quick actions</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {actions.map((action) => (
              <article key={action.to} className="surface-card flex flex-col p-6">
                <action.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                <h3 className="mt-3 text-lg font-semibold text-foreground">{action.label}</h3>
                <p className="mt-1 flex-1 text-sm text-muted-foreground">{action.body}</p>
                <Link
                  to={action.to}
                  className="mt-4 inline-flex w-fit items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Go <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link to="/add-class" className="underline underline-offset-4">
              Add a class
            </Link>
            <Link to="/view-schedule" className="underline underline-offset-4">
              View schedule
            </Link>
            <Link to="/bookings" className="underline underline-offset-4">
              Room bookings
            </Link>
          </div>
        </section>
      ) : (
        <p className="surface-card p-6 text-sm text-muted-foreground">
          Administrator tools are limited to admin accounts. You can still view the timetable and
          request room bookings.
        </p>
      )}

      <section>
        <h2 className="text-xl font-bold text-foreground">Statistics</h2>
        <div className="surface-card mt-4 overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              {[
                ["Total Teachers", stats?.teachers],
                ["Total Rooms", stats?.rooms],
                ["Total Classes", stats?.classes],
                ["Scheduled Classes", stats?.scheduled],
                ["Pending Bookings", stats?.pendingBookings],
              ].map(([label, value]) => (
                <tr key={String(label)} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <th scope="row" className="px-4 py-3 text-left font-medium text-foreground">
                    {label}
                  </th>
                  <td className="px-4 py-3 text-right font-bold text-primary">
                    {statsQuery.isLoading ? "…" : (value ?? 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
