import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { LoginFormClient } from "./login-form-client";
import NextImage from "next/image";

async function urlExiste(url: string): Promise<boolean> {
    try {
        const head = await fetch(url, { method: "HEAD", cache: "no-store" });
        if (head.ok) return true;

        // Alguns servidores não suportam HEAD
        if (head.status === 405) {
            const get = await fetch(url, { method: "GET", cache: "no-store" });
            return get.ok;
        }

        return false;
    } catch {
        return false;
    }
}

function safeUrl(base: string, path: string) {
    try {
        return new URL(path, base).toString();
    } catch {
        return "";
    }
}

export async function LoginForm({
    className,
    ...props
}: React.ComponentProps<"div">) {

    const supabaseBaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();

    const logoSupabase = supabaseBaseUrl
        ? safeUrl(
            supabaseBaseUrl,
            "/storage/v1/object/public/empresa/images/logo/logo.png"
        )
        : "";

    const bgSupabase = supabaseBaseUrl
        ? safeUrl(
            supabaseBaseUrl,
            "/storage/v1/object/public/empresa/images/login/login.jpg"
        )
        : "";

    // ✅ fallback local SOMENTE para background
    // Coloque em: /public/images/login-fallback.jpg
    const bgFallback = "/images/login-fallback.jpg";

    // Decide TUDO no server (sem swap no client)
    const [logoOk, bgOk] = await Promise.all([
        logoSupabase ? urlExiste(logoSupabase) : Promise.resolve(false),
        bgSupabase ? urlExiste(bgSupabase) : Promise.resolve(false),
    ]);

    const finalLogo = logoOk ? logoSupabase : null;
    const finalBg = bgOk ? bgSupabase : bgFallback;

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card className="overflow-hidden p-0">
                <CardContent className="grid p-0 md:grid-cols-2">
                    {/* Esquerda: client component (form + forgot dialog) */}
                    <LoginFormClient />

                    {/* Direita: server component (imagens já decididas) */}
                    <div className="bg-muted relative hidden overflow-hidden md:block group">
                        {/* Logo: SEM fallback — só aparece se existir */}
                        {finalLogo && (
                            <div className="w-full absolute z-20 h-full flex p-6 justify-center">
                                <NextImage
                                    width={480}
                                    height={480}
                                    src={finalLogo}
                                    alt="logo"
                                    className="absolute object-cover w-[120px] opacity-85 group-hover:opacity-95 transition-all"
                                    priority
                                    sizes="(min-width: 768px) 120px, 0px"
                                />
                            </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-b from-blue-800/50 to-cyan-300/10 z-10" />

                        {/* Background: Supabase OU fallback (já decidido no server) */}
                        <NextImage
                            width={720}
                            height={720}
                            src={finalBg}
                            alt="imagem_login"
                            className="absolute h-full w-full object-cover scale-110"
                            priority
                            sizes="(min-width: 768px) 50vw, 0vw"
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="text-muted-foreground text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
                Ao continuar você concorda com os <a href="#">Termos de Serviço</a> e a{" "}
                <a href="#">Política de Privacidade</a>.
            </div>
        </div>
    );
}