import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { redirect } from "next/navigation";
import { LoginForm } from "./components/login-form";
import { getQuoteOfTheDay } from "@/lib/quotes";
import { createClient } from "@/utils/supabase/server";
import { ForceLogout } from "./components/force-logout";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LoginPage({
  searchParams,
}: {
  // Next 15: searchParams pode ser assíncrono em rotas dinâmicas
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { text, author, obs } = getQuoteOfTheDay();
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const sp = (await searchParams) ?? {};
  const reason = Array.isArray(sp.reason) ? sp.reason[0] : sp.reason;

  // Quando o usuário foi bloqueado, a página de login deve derrubar a sessão em vez de redirecionar.
  if (session && reason !== "inactive") {
    redirect("/");
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background text-foreground p-6 md:p-10 relative">
      {reason === "inactive" ? <ForceLogout reason="inactive" /> : null}
      <span className="mb-4 text-xs text-muted-foreground">
        <blockquote className="hover:cursor-default">
          {`"${text}" - `}
          <Tooltip>
            <TooltipTrigger render={<span />}>
              {author}
            </TooltipTrigger>
            <TooltipContent>{obs}</TooltipContent>
          </Tooltip>
        </blockquote>
      </span>

      <div className="w-full max-w-sm md:max-w-3xl">
        <LoginForm />
      </div>
    </div>
  );
}