import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import OpenAI from "openai";

// OpenAI instance will be created inside the route handler

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { vehicleId, action = 'generate' } = await request.json();

    if (!vehicleId) {
      return NextResponse.json({ error: "ID do veículo é obrigatório" }, { status: 400 });
    }

    // 1. Buscar dados do veículo para o prompt
    const { data: vehicle, error: vehicleError } = await supabase
      .from("vehicles")
      .select("*")
      .eq("id", vehicleId)
      .single();

    if (vehicleError || !vehicle) {
      return NextResponse.json({ error: "Veículo não encontrado" }, { status: 404 });
    }

    // 2. Verificar limite mensal e realizar auto-reset
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    // Buscar configurações atuais
    const { data: settings, error: settingsError } = await supabase
      .from("app_settings")
      .select("id, ai_description_monthly_limit, ai_description_usage_count, ai_description_last_reset")
      .limit(1)
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
      throw settingsError;
    }

    let limit = settings?.ai_description_monthly_limit ?? 30;
    let used = settings?.ai_description_usage_count ?? 0;
    const lastReset = settings?.ai_description_last_reset;

    // Lógica de Auto-Reset: Se o mês mudou, zera o contador
    if (!lastReset || lastReset !== currentMonth) {
      used = 0;
      if (settings?.id) {
        await supabase
          .from("app_settings")
          .update({ 
            ai_description_usage_count: 0,
            ai_description_last_reset: currentMonth,
            updated_at: new Date().toISOString()
          })
          .eq("id", settings.id);
      }
    }

    // ETAPA 6: Otimização do Controle de Cotas (Persistent Counter)
    // - [x] Adicionar colunas `ai_description_usage_count` e `ai_description_last_reset` na `app_settings`.
    // - [x] Implementar lógica de auto-reset mensal no Route Handler.
    // - [x] Atualizar incremento do contador no Route Handler.
    // - [x] Validar sincronização entre contador e logs.

    if (used >= limit) {
      return NextResponse.json({
        error: "O limite mensal de gerações de descrição com IA foi atingido.",
        used,
        limit,
        remaining: 0
      }, { status: 403 });
    }

    // 3. Gerar descrição com IA real via OpenAI
    const featuresList = (vehicle.features || []).join(", ");
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // ... rest of the OpenAI call ... (already updated by user previously)
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Você é um copywriter automotivo profissional especializado em vendas de veículos premium e populares. Seu objetivo é criar descrições curtas, curiosas, atrativas e organizadas."
        },
        {
          role: "user",
          content: `Gere um texto curto de curiosidade sobre este veículo para uma descrição em um ecommerce de veículos. A descrição deve ser curiosa e atrativa. Insira alguma curiosidade sobre ele. Comece sempre com a curiosidade. Dados:
          Marca: ${vehicle.brand}
          Modelo: ${vehicle.model}
          Versão: ${vehicle.version}
          Ano: ${vehicle.year}/${vehicle.year_model}
          Combustível: ${vehicle.fuel}
          Transmissão: ${vehicle.transmission}
          `
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const aiGeneratedText = response.choices[0].message.content || "";

    if (!aiGeneratedText) {
      throw new Error("Falha ao gerar texto com a OpenAI");
    }

    // 4. Salvar a descrição gerada no veículo
    const { error: updateError } = await supabase
      .from("vehicles")
      .update({
        ai_description: aiGeneratedText,
        updated_at: new Date().toISOString(),
        updated_by: user.id
      })
      .eq("id", vehicleId);

    if (updateError) {
      throw updateError;
    }

    // 5. Incrementar contador e registrar log
    // Usar update para garantir que o registro seja incrementado
    let settingsUpdateError = null;
    if (settings?.id) {
      const { error } = await supabase
        .from("app_settings")
        .update({ 
          ai_description_usage_count: used + 1,
          ai_description_last_reset: currentMonth,
          updated_at: new Date().toISOString()
        })
        .eq("id", settings.id);
      settingsUpdateError = error;
    }

    if (settingsUpdateError) {
      console.error("Erro ao atualizar contador:", settingsUpdateError);
    }

    // Registrar log para auditoria (opcional agora que temos contador, mas bom manter)
    const { error: logError } = await supabase
      .from("ai_generation_logs")
      .insert([{
        vehicle_id: vehicleId,
        user_id: user.id,
        month_reference: currentMonth,
        action_type: action,
        model_used: 'gpt-4o',
        generated_content: aiGeneratedText
      }]);

    if (logError) {
      console.error("Erro ao registrar log:", logError);
    }

    // Retornar sucesso com estatísticas atualizadas
    return NextResponse.json({
      success: true,
      description: aiGeneratedText,
      stats: {
        used: used + 1,
        limit,
        remaining: Math.max(0, limit - (used + 1))
      }
    });

  } catch (err: any) {
    console.error("Erro no endpoint de IA:", err);
    return NextResponse.json({ error: "Erro interno ao processar IA: " + err.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    // Buscar estatísticas do app_settings
    const { data: settings } = await supabase
      .from("app_settings")
      .select("id, ai_description_monthly_limit, ai_description_usage_count, ai_description_last_reset")
      .limit(1)
      .single();

    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    let used = settings?.ai_description_usage_count ?? 0;
    const limit = settings?.ai_description_monthly_limit ?? 30;

    // Se o mês mudou mas o contador ainda não foi resetado (ex: primeira visita no mês)
    if (settings?.ai_description_last_reset && settings.ai_description_last_reset !== currentMonth) {
      used = 0;
    }

    return NextResponse.json({
      used,
      limit,
      remaining: Math.max(0, limit - used)
    });

  } catch (err) {
    return NextResponse.json({ error: "Erro ao buscar estatísticas" }, { status: 500 });
  }
}
