import { ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function AccessDenied() {
  return (
    <div className="flex h-[400px] w-full flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-muted/30 p-8 text-center">
      <div className="rounded-full bg-destructive/10 p-3 text-destructive">
        <ShieldAlert className="h-10 w-10" />
      </div>
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight">Acesso Restrito</h2>
        <p className="text-sm text-muted-foreground">
          Você não tem permissões suficientes para visualizar este módulo.
          <br /> Entre em contato com o administrador se considerar isso um erro.
        </p>
      </div>
      <Button render={<Link href="/" />} variant="outline" className="mt-2 rounded-xl">
        Voltar para o Início
      </Button>
    </div>
  )
}
