import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "teacher" | "student";

export function useAuth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const sessionQuery = useQuery({
    queryKey: ["auth", "session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
    staleTime: 30_000,
  });

  const user = sessionQuery.data?.user ?? null;

  const roleQuery = useQuery({
    queryKey: ["auth", "role", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .maybeSingle();
      return (data?.role ?? null) as AppRole | null;
    },
  });

  const profileQuery = useQuery({
    queryKey: ["auth", "profile", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("username, email")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return {
    user,
    role: roleQuery.data ?? null,
    username: profileQuery.data?.username ?? user?.email?.split("@")[0] ?? "",
    isAdmin: roleQuery.data === "admin",
    isLoading: sessionQuery.isLoading || (Boolean(user) && roleQuery.isLoading),
    signOut,
  };
}
