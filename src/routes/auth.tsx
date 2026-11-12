import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarRange, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { claimRole } from "@/lib/auth.functions";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · Smart Campus Scheduler" },
      {
        name: "description",
        content:
          "Sign in or register as an admin, teacher, or student to manage college timetables and room bookings.",
      },
      { property: "og:title", content: "Sign in · Smart Campus Scheduler" },
      {
        property: "og:description",
        content: "Access the campus timetable generator and resource booking system.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const credentialsSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

const roles = [
  { value: "admin", label: "Admin" },
  { value: "teacher", label: "Teacher" },
  { value: "student", label: "Student" },
] as const;

function AuthPage() {
  const navigate = useNavigate();
  const claimRoleFn = useServerFn(claimRole);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<"admin" | "teacher" | "student">("admin");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const finishSignIn = async () => {
    await claimRoleFn({ data: { role } });
    navigate({ to: "/dashboard", replace: true });
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const parsed = credentialsSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid credentials");
      return;
    }
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (signInError) {
      setError("Invalid username or password. Please try again.");
      return;
    }
    toast.success("Signed in");
    await finishSignIn();
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const parsed = credentialsSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid details");
      return;
    }
    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (signUpError) {
      setLoading(false);
      setError(
        signUpError.message.includes("already")
          ? "An account with this email already exists. Try signing in."
          : signUpError.message,
      );
      return;
    }
    if (data.user && data.session) {
      await supabase
        .from("profiles")
        .upsert({ id: data.user.id, username: username.trim(), email: parsed.data.email });
      await claimRoleFn({ data: { role } });
      setLoading(false);
      toast.success("Account created");
      navigate({ to: "/dashboard", replace: true });
      return;
    }
    setLoading(false);
    toast.success("Check your email to confirm your account.");
  };

  const handleGoogle = async () => {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    await finishSignIn();
  };

  return (
    <div className="flex min-h-screen flex-col bg-secondary">
      <header className="bg-primary py-4 text-primary-foreground">
        <div className="campus-container flex items-center gap-2">
          <CalendarRange className="h-5 w-5" aria-hidden="true" />
          <span className="text-lg font-bold">Smart Campus Scheduler</span>
        </div>
      </header>

      <main className="campus-container flex flex-1 items-center justify-center py-12">
        <div className="surface-card w-full max-w-md p-6">
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to generate timetables and manage campus resources.
          </p>

          <Tabs defaultValue="login" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form className="space-y-4 pt-4" onSubmit={handleLogin} noValidate>
                <Field id="login-email" label="Email">
                  <Input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Field>
                <Field id="login-password" label="Password">
                  <Input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Field>
                <RoleField value={role} onChange={setRole} />
                {error ? <p className="text-sm text-destructive">{error}</p> : null}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Sign in
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form className="space-y-4 pt-4" onSubmit={handleRegister} noValidate>
                <Field id="reg-username" label="Username">
                  <Input
                    id="reg-username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    maxLength={40}
                    required
                  />
                </Field>
                <Field id="reg-email" label="Email">
                  <Input
                    id="reg-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Field>
                <Field id="reg-password" label="Password">
                  <Input
                    id="reg-password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Field>
                <RoleField value={role} onChange={setRole} />
                {error ? <p className="text-sm text-destructive">{error}</p> : null}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Create account
                </Button>
                <p className="text-xs text-muted-foreground">
                  The first account to register as Admin becomes the campus administrator. Later admin
                  requests are created as student accounts.
                </p>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>

          <Button type="button" variant="outline" className="w-full" onClick={handleGoogle}>
            Continue with Google
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link to="/" className="underline underline-offset-4">
              Back to home
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function RoleField({
  value,
  onChange,
}: {
  value: "admin" | "teacher" | "student";
  onChange: (value: "admin" | "teacher" | "student") => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="role">Role</Label>
      <Select value={value} onValueChange={(v) => onChange(v as typeof value)}>
        <SelectTrigger id="role">
          <SelectValue placeholder="Select role" />
        </SelectTrigger>
        <SelectContent>
          {roles.map((r) => (
            <SelectItem key={r.value} value={r.value}>
              {r.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
