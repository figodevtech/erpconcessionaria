"use client"

import { useEffect, useMemo, useState } from "react"
import { AppSettings, getAppSettingsAction, updateAppSettingsAction } from "@/actions/settings"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { usePermissions } from "@/hooks/use-permissions"
import { cn } from "@/lib/utils"
import { CheckCircle2, Loader2, Palette, RotateCcw, Save } from "lucide-react"
import { toast } from "sonner"

type ColorKey = "primary_color" | "secondary_color"

type ColorField = {
  key: ColorKey
  label: string
  description: string
}

const COLOR_FIELDS: ColorField[] = [
  {
    key: "primary_color",
    label: "Cor principal",
    description: "Botões, links e chamadas de destaque.",
  },
  {
    key: "secondary_color",
    label: "Cor secundária",
    description: "Fundos, blocos de apoio e áreas de contraste.",
  },
]

const DEFAULT_COLORS: Record<ColorKey, string> = {
  primary_color: "#1A2744",
  secondary_color: "#F1F3F7",
}

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/

function normalizeHex(value: string) {
  const trimmed = value.trim()
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`
  return withHash.toUpperCase()
}

export function SiteColorSettings() {
  const { hasPermission } = usePermissions()
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [colors, setColors] = useState<Record<ColorKey, string>>(DEFAULT_COLORS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const canUpdate = hasPermission("settings:view") || hasPermission("settings:site:update")

  useEffect(() => {
    async function fetchSettings() {
      const result = await getAppSettingsAction()

      if (result.success && result.data) {
        setSettings(result.data)
        setColors({
          primary_color: normalizeHex(result.data.primary_color || DEFAULT_COLORS.primary_color),
          secondary_color: normalizeHex(result.data.secondary_color || DEFAULT_COLORS.secondary_color),
        })
      } else {
        toast.error("Erro ao carregar configurações do site")
      }

      setLoading(false)
    }

    fetchSettings()
  }, [])

  const hasInvalidColor = useMemo(
    () => Object.values(colors).some((color) => !HEX_COLOR_REGEX.test(color)),
    [colors],
  )

  const hasChanges = useMemo(() => {
    if (!settings) return false

    return COLOR_FIELDS.some(({ key }) => colors[key] !== normalizeHex(settings[key] || DEFAULT_COLORS[key]))
  }, [colors, settings])

  const updateColor = (key: ColorKey, value: string) => {
    if (!canUpdate) return

    setColors((current) => ({
      ...current,
      [key]: normalizeHex(value),
    }))
  }

  const resetColors = () => {
    if (!canUpdate) return

    setColors(DEFAULT_COLORS)
  }

  const saveColors = async () => {
    if (!settings || hasInvalidColor || !canUpdate) return

    setSaving(true)

    try {
      const result = await updateAppSettingsAction({
        id: settings.id,
        ...colors,
      })

      if (result.success && result.data) {
        setSettings(result.data)
        toast.success("Cores do site atualizadas")
      } else {
        toast.error("Erro ao salvar configurações")
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Skeleton className="h-[320px]" />
        <Skeleton className="h-[320px]" />
      </div>
    )
  }

  return (
    <div className="grid gap-6 ">
      <Card>
        <CardHeader className="border-b">
          
              <CardTitle>Definir</CardTitle>
              <CardDescription>Defina as cores do site. </CardDescription>
          
        </CardHeader>
        <CardContent className="space-y-5 p-6">
          {COLOR_FIELDS.map((field) => {
            const isInvalid = !HEX_COLOR_REGEX.test(colors[field.key])

            return (
              <div
                key={field.key}
                className="grid gap-4 rounded-lg border bg-card p-4 sm:grid-cols-[1fr_210px]"
              >
                <div className="space-y-1.5">
                  <Label htmlFor={field.key} className="text-sm font-semibold">
                    {field.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">{field.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    aria-label={field.label}
                    className="h-11 w-14 shrink-0 cursor-pointer p-1"
                    type="color"
                    disabled={!canUpdate}
                    value={HEX_COLOR_REGEX.test(colors[field.key]) ? colors[field.key] : DEFAULT_COLORS[field.key]}
                    onChange={(event) => updateColor(field.key, event.target.value)}
                  />
                  <Input
                    id={field.key}
                    value={colors[field.key]}
                    onChange={(event) => updateColor(field.key, event.target.value)}
                    className={cn("font-mono uppercase", isInvalid && "border-destructive focus-visible:ring-destructive")}
                    disabled={!canUpdate}
                    maxLength={7}
                  />
                </div>
              </div>
            )
          })}

          <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={resetColors} disabled={saving || !canUpdate}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Restaurar padrão
            </Button>
            <Button onClick={saveColors} disabled={saving || hasInvalidColor || !hasChanges || !canUpdate}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar cores
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle>Preview</CardTitle>
          <CardDescription>Visual aproximado com as duas cores do site.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div
            className="min-h-[320px] p-6"
            style={{
              backgroundColor: colors.secondary_color,
              color: colors.primary_color,
            }}
          >
            <div className="space-y-3">
              <h3 className="text-3xl font-black leading-tight">Veículos selecionados para o seu site</h3>
              <p className="text-sm opacity-75">
                A paleta usa primary_color e secondary_color da tabela app_settings.
              </p>
            </div>
            <div className="mt-8 rounded-lg border bg-white/70 p-4" style={{ borderColor: colors.primary_color }}>
              <div className="mb-4 h-28 rounded-md" style={{ backgroundColor: colors.primary_color }} />
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold">Sedan automático</p>
                  <p className="text-sm opacity-70">Publicado na vitrine</p>
                </div>
                <div
                  className="flex h-10 items-center rounded-md px-4 text-sm font-bold"
                  style={{
                    backgroundColor: colors.primary_color,
                    color: colors.secondary_color,
                  }}
                >
                  Ver detalhes
                </div>
              </div>
            </div>
            {!hasInvalidColor && hasChanges && (
              <div className="mt-5 flex items-center gap-2 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Alterações prontas para salvar
              </div>
            )}
          </div>
        </CardContent>
      </Card> */}
    </div>
  )
}
