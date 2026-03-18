import { supabase } from "@/integrations/supabase/client";
import { ComprasGovContratacao } from "@/integrations/comprasGov/types";

export const monitoramentoService = {
    async checkAllKeywords() {
        // 1. Get all active monitoramentos
        const { data: keywords, error: kError } = await supabase
            .from("monitoramentos")
            .select("*")
            .eq("ativo", true);

        if (kError || !keywords) return [];

        const allMatches: { title: string; message: string; link: string }[] = [];

        // 2. For each keyword, search the API (Simulation)
        // In a real scenario, this would be a CRON job in a Supabase Edge Function
        for (const m of keywords) {
            // We'll simulate finding 1 new match if it's the first time in the session
            // or based on some random logic for demo purposes
            if (Math.random() > 0.7) {
                const match = {
                    title: `Nova oportunidade: ${m.nome}`,
                    message: `Encontramos um edital que coincide com o seu monitoramento '${m.palavra_chave}'.`,
                    link: `/editais?q=${m.palavra_chave}`
                };
                
                // 3. Create a notification in the database
                await supabase.from("notifications").insert({
                    user_id: m.user_id,
                    title: match.title,
                    message: match.message,
                    link: match.link,
                    type: 'opportunity'
                });

                allMatches.push(match);
            }
        }

        return allMatches;
    }
};
