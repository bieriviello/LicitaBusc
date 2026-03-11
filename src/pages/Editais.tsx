import { useState } from "react";
import { FileText, Search, AlertTriangle, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ComprasGovFilters } from "@/components/ComprasGovFilters";
import { ContratacaoCard } from "@/components/ContratacaoCard";
import { PaginationControls } from "@/components/PaginationControls";
import { useContratacoes } from "@/hooks/useComprasGov";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { FiltrosContratacao, ComprasGovContratacao } from "@/integrations/comprasGov/types";
import type { Json } from "@/integrations/supabase/types";
import { useNavigate } from "react-router-dom";

export default function Editais() {
  const { canCreate } = useAuth();
  const { toast } = useToast();

  const [filtros, setFiltros] = useState<FiltrosContratacao | null>(null);
  const [pagina, setPagina] = useState(1);
  const [palavraChave, setPalavraChave] = useState("");

  const currentFiltros = filtros ? { ...filtros, pagina } : null;
  const { data, isLoading, isError, error } = useContratacoes(currentFiltros);

  const handleBuscar = (f: {
    dataInicial: string;
    dataFinal: string;
    modalidade: number;
    uf?: string;
    cnpjOrgao?: string;
    palavraChave?: string;
  }) => {
    setPagina(1);
    setPalavraChave(f.palavraChave || "");
    setFiltros({
      dataPublicacaoPncpInicial: f.dataInicial,
      dataPublicacaoPncpFinal: f.dataFinal,
      codigoModalidade: f.modalidade,
      unidadeOrgaoUfSigla: f.uf === "all" ? undefined : f.uf,
      orgaoEntidadeCnpj: f.cnpjOrgao,
      tamanhoPagina: 50, // Fetch more to allow client-side keyword filtering
    });
  };

  const navigate = useNavigate();

  const handleImportar = async (contratacao: ComprasGovContratacao) => {
    try {
      const { data: editalSalvo, error: insertError } = await supabase.from("editais").insert({
        numero: contratacao.numeroControlePNCP || contratacao.numeroCompra,
        orgao: contratacao.unidadeOrgaoNomeUnidade,
        objeto: contratacao.objetoCompra || "Sem descrição",
        data_abertura: contratacao.dataAberturaPropostaPncp?.split("T")[0] || null,
        status: "ativo",
        raw_json: contratacao as unknown as Json,
      }).select("id").single();

      if (insertError) throw insertError;

      if (editalSalvo) {
        const numeroInterno = contratacao.processo || `PROC-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
        
        const { error: procError } = await supabase.from("processos").insert({
          edital_id: editalSalvo.id,
          numero_interno: numeroInterno,
          status: "em_andamento",
          observacoes: "Processo importado automaticamente da busca."
        });

        if (procError) throw procError;
      }

      toast({
        title: "✅ Importação concluída!",
        description: `O edital e o processo foram criados. Redirecionando...`,
      });

      // Redireciona para a tela de Processos
      navigate(`/processos`);
      
    } catch (err: any) {
      toast({
        title: "Erro ao importar",
        description: err.message || "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const handleExportCsv = () => {
    if (!data || !data.resultado.length) return;

    // Convert logic simplistic
    const headers = ["Orgao", "CNPJ", "Modalidade", "Objeto", "Status", "Publicacao", "Valor Estimado"];
    const rows = data.resultado.map(c => [
      `"${c.unidadeOrgaoNomeUnidade || ""}"`,
      `"${c.orgaoEntidadeCnpj || ""}"`,
      `"${c.modalidadeNome || ""}"`,
      `"${(c.objetoCompra || "").replace(/"/g, '""')}"`,
      `"${c.situacaoCompraNomePncp || ""}"`,
      `"${c.dataPublicacaoPncp || ""}"`,
      `"${c.valorTotalEstimado || ""}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `licitacoes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Editais</h1>
          <p className="text-muted-foreground mt-1">
            Busque licitações do Portal Nacional de Contratações Públicas (PNCP) e importe para o sistema
          </p>
        </div>

        {data && data.resultado.length > 0 && (
          <Button variant="outline" className="gap-2" onClick={handleExportCsv}>
            <Download className="h-4 w-4" />
            Baixar CSV
          </Button>
        )}
      </div>

      {/* Filtros */}
      <ComprasGovFilters onBuscar={handleBuscar} loading={isLoading} />

      {/* Estado: nenhuma busca ainda */}
      {!filtros && !isLoading && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <div className="p-4 rounded-full bg-primary/5 mb-4">
            <Search className="h-10 w-10 opacity-40" />
          </div>
          <p className="text-base font-medium">Busque licitações para começar</p>
          <p className="text-sm mt-1">Use os filtros acima para consultar editais do PNCP</p>
        </div>
      )}

      {/* Estado: carregando */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-sm">Consultando portal do PNCP...</p>
        </div>
      )}

      {/* Estado: erro */}
      {isError && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <div className="p-4 rounded-full bg-destructive/10 mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <p className="text-base font-medium text-destructive">Erro na consulta</p>
          <p className="text-sm mt-1 max-w-md text-center">
            {(error as Error)?.message || "Não foi possível consultar a API. Tente novamente."}
          </p>
        </div>
      )}

      {/* Resultados */}
      {data && !isLoading && (
        <>
          {data.resultado.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FileText className="h-10 w-10 opacity-30 mb-3" />
              <p className="text-base font-medium">Nenhum resultado encontrado</p>
              <p className="text-sm mt-1">Tente ajustar os filtros de busca</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(() => {
                  const resultadosFiltrados = palavraChave
                    ? data.resultado.filter((c) =>
                      (c.objetoCompra || "").toLowerCase().includes(palavraChave.toLowerCase()) ||
                      (c.unidadeOrgaoNomeUnidade || "").toLowerCase().includes(palavraChave.toLowerCase())
                    )
                    : data.resultado;

                  if (resultadosFiltrados.length === 0) {
                    return (
                      <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <FileText className="h-8 w-8 opacity-30 mb-2" />
                        <p className="text-sm">Nenhum resultado para "{palavraChave}"</p>
                        <p className="text-xs mt-1">Tente outra palavra-chave</p>
                      </div>
                    );
                  }

                  return resultadosFiltrados.map((contratacao) => (
                    <ContratacaoCard
                      key={contratacao.idCompra}
                      contratacao={contratacao}
                      onImportar={handleImportar}
                    />
                  ));
                })()}
              </div>

              <PaginationControls
                pagina={pagina}
                totalPaginas={data.totalPaginas}
                totalRegistros={data.totalRegistros}
                onPaginaChange={setPagina}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
