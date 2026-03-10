import { useQuery } from "@tanstack/react-query";
import {
    buscarContratacoes,
    buscarLicitacoesLegado,
    buscarPregoes,
    buscarArquivosPncp,
} from "@/integrations/comprasGov/comprasGovApi";
import type {
    FiltrosContratacao,
    FiltrosLicitacaoLegado,
    FiltrosPregao,
} from "@/integrations/comprasGov/types";

/**
 * Hook para buscar contratações PNCP (Lei 14.133/2021)
 */
export function useContratacoes(filtros: FiltrosContratacao | null) {
    return useQuery({
        queryKey: ["contratacoes", filtros],
        queryFn: () => buscarContratacoes(filtros!),
        enabled: !!filtros,
        staleTime: 5 * 60 * 1000, // 5 min cache
        retry: 2,
    });
}

/**
 * Hook para buscar licitações legado (Lei 8.666/1993)
 */
export function useLicitacoesLegado(filtros: FiltrosLicitacaoLegado | null) {
    return useQuery({
        queryKey: ["licitacoes-legado", filtros],
        queryFn: () => buscarLicitacoesLegado(filtros!),
        enabled: !!filtros,
        staleTime: 5 * 60 * 1000,
        retry: 2,
    });
}

/**
 * Hook para buscar pregões (Legado)
 */
export function usePregoes(filtros: FiltrosPregao | null) {
    return useQuery({
        queryKey: ["pregoes", filtros],
        queryFn: () => buscarPregoes(filtros!),
        enabled: !!filtros,
        staleTime: 5 * 60 * 1000,
        retry: 2,
    });
}

/**
 * Hook para buscar arquivos de uma contratação PNCP
 */
export function useArquivosPncp(cnpj: string | undefined, ano: number | undefined, sequencial: number | undefined, enabled: boolean) {
    return useQuery({
        queryKey: ["arquivos-pncp", cnpj, ano, sequencial],
        queryFn: () => buscarArquivosPncp(cnpj!, ano!, sequencial!),
        enabled: enabled && !!cnpj && !!ano && !!sequencial,
        staleTime: 15 * 60 * 1000, // 15 min cache
        retry: 1,
    });
}
