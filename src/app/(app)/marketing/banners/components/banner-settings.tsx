"use client";

import { useState, useEffect } from "react";
import { getAppSettingsAction, updateAppSettingsAction, AppSettings } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Minus, Plus, Timer, Zap, CheckCircle2, Loader2 } from "lucide-react";

export function BannerSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingInterval, setSavingInterval] = useState(false);
  const [savingDuration, setSavingDuration] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      const result = await getAppSettingsAction();
      if (result.success && result.data) {
        setSettings(result.data);
      }
      setLoading(false);
    }
    fetchSettings();
  }, []);

  const handleUpdate = async (field: "banner_interval" | "banner_duration", value: number) => {
    if (!settings) return;
    
    if (field === "banner_interval") setSavingInterval(true);
    if (field === "banner_duration") setSavingDuration(true);

    try {
      const result = await updateAppSettingsAction({ 
        id: settings.id, 
        [field]: value 
      });
      if (result.success && result.data) {
        setSettings(result.data);
        toast.success("Configuração atualizada");
      } else {
        toast.error("Erro ao atualizar");
      }
    } finally {
      if (field === "banner_interval") setSavingInterval(false);
      if (field === "banner_duration") setSavingDuration(false);
    }
  };

  const adjustValue = (field: "banner_interval" | "banner_duration", delta: number) => {
    if (!settings) return;
    const currentValue = settings[field] || 0;
    const newValue = Math.max(0, parseFloat((currentValue + delta).toFixed(2)));
    setSettings({ ...settings, [field]: newValue });
  };

  if (loading) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Interval Setting */}
      <Card className="border-none bg-muted/20 backdrop-blur-sm rounded-[2rem] overflow-hidden group hover:ring-1 hover:ring-primary/20 transition-all duration-500">
        <CardContent className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl text-primary">
                <Timer className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-black text-lg tracking-tight">Tempo de Espera</h4>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">Banner estático</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 flex items-center bg-background rounded-2xl border border-primary/5 p-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={() => adjustValue("banner_interval", -0.5)}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="flex-1 text-center font-black text-xl tabular-nums">
                {settings?.banner_interval.toFixed(1)}s
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={() => adjustValue("banner_interval", 0.5)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button 
              className="h-14 px-6 rounded-2xl font-black active:scale-95 transition-all shadow-lg shadow-primary/10"
              onClick={() => settings && handleUpdate("banner_interval", settings.banner_interval)}
              disabled={savingInterval}
            >
              {savingInterval ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-5 w-5 mr-2" />}
              {savingInterval ? "" : "Aplicar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Duration Setting */}
      <Card className="border-none bg-muted/20 backdrop-blur-sm rounded-[2rem] overflow-hidden group hover:ring-1 hover:ring-primary/20 transition-all duration-500">
        <CardContent className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-black text-lg tracking-tight">Velocidade da Transição</h4>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">Tempo do deslize</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 flex items-center bg-background rounded-2xl border border-primary/5 p-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-xl hover:bg-amber-500/10 hover:text-amber-500 transition-colors"
                onClick={() => adjustValue("banner_duration", -0.1)}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="flex-1 text-center font-black text-xl tabular-nums">
                {settings?.banner_duration.toFixed(1)}s
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-xl hover:bg-amber-500/10 hover:text-amber-500 transition-colors"
                onClick={() => adjustValue("banner_duration", 0.1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button 
              className="h-14 px-6 rounded-2xl font-black bg-amber-500 hover:bg-amber-600 text-white active:scale-95 transition-all shadow-lg shadow-amber-500/10"
              onClick={() => settings && handleUpdate("banner_duration", settings.banner_duration)}
              disabled={savingDuration}
            >
              {savingDuration ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-5 w-5 mr-2" />}
              {savingDuration ? "" : "Aplicar"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
