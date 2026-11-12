import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const roleSchema = z.object({ role: z.enum(["admin", "teacher", "student"]) });

/** Assigns the requested role to the signed-in user. Admin is only granted to the first user. */
export const claimRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { role: "admin" | "teacher" | "student" }) => roleSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (existing?.role) return { role: existing.role };

    let role = data.role;
    if (role === "admin") {
      const { count } = await supabaseAdmin
        .from("user_roles")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin");
      if ((count ?? 0) > 0) role = "student";
    }

    await supabaseAdmin.from("user_roles").insert({ user_id: context.userId, role });
    return { role };
  });

/** Returns the teacher record id that matches the signed-in user's email, if any. */
export const getMyTeacherId = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = (context.claims as { email?: string } | undefined)?.email;
    if (!email) return { teacherId: null as string | null };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("teachers")
      .select("id")
      .ilike("email", email)
      .maybeSingle();
    return { teacherId: data?.id ?? null };
  });
