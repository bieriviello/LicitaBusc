import { useState, useEffect } from "react";
import { FileText, Search, AlertTriangle, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ComprasGovFilters } from "@/components/ComprasGovFilters";
import { ContratacaoCard } from "@/components/ContratacaoCard";
import { PaginationControls } from "@/components/PaginationControls";
import { useContratacoes } from "@/hooks/useComprasGov";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { FiltrosContratacao, ComprasGovContratacao, BaseEdital } from "@/integrations/comprasGov/types";
import type { Json } from "@/integrations/supabase/types";
import { useNavigate } from "react-router-dom";
import { useLicitacoesLegado, usePregoes } from "@/hooks/useComprasGov";
import { Trash2, Activity } from "lucide-react";

export default function Editais() {
  const { canCreate } = useAuth();
  const { toast } = useToast();

  const [filtros, setFiltros] = useState<FiltrosContratacao | any | null>(null);
  const [pagina, setPagina] = useState(1);
  const [palavraChave, setPalavraChave] = useState("");
  const [modulo, setModulo] = useState<'pncp' | 'legado' | 'pregao'>('pncp');
  const [monitoramentos, setMonitoramentos] = useState<any[]>([]);

  const currentFiltros = filtros ? { ...filtros, pagina } : null;
  
  const pncpQuery = useContratacoes(modulo === 'pncp' ? currentFiltros : null);
  const legadoQuery = useLicitacoesLegado(modulo === 'legado' ? currentFiltros : null);
  const pregaoQuery = usePregoes(modulo === 'pregao' ? currentFiltros : null);

  const activeQuery = modulo === 'pncp' ? pncpQuery : modulo === 'legado' ? legadoQuery : pregaoQuery;
  const { data, isLoading, isError, error } = activeQuery;

  useEffect(() => {
    fetchMonitoramentos();
  }, []);

  const fetchMonitoramentos = async () => {
    const { data } = await supabase.from("monitoramentos").select("*").order("created_at", { ascending: false });
    if (data) setMonitoramentos(data);
  };

  const handleSaveMonitoramento = async (nome: string, termo: string) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { error } = await supabase.from("monitoramentos").insert({
      user_id: userData.user.id,
      nome,
      palavra_chave: termo,
      filtros: { modulo }
    });

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Monitoramento salvo!", description: "Você será avisado sobre novos editais." });
      fetchMonitoramentos();
    }
  };

  const handleDeleteMonitoramento = async (id: string) => {
    const { error } = await supabase.from("monitoramentos").delete().eq("id", id);
    if (!error) fetchMonitoramentos();
  };

  const handleBuscar = (f: {
    dataInicial: string;
    dataFinal: string;
    modalidade: number;
    uf?: string;
    cnpjOrgao?: string;
    palavraChave?: string;
    modulo?: 'pncp' | 'legado' | 'pregao';
  }) => {
    setPagina(1);
    setPalavraChave(f.palavraChave || "");
    setModulo(f.modulo || 'pncp');
    
    if (f.modulo === 'pncp' || !f.modulo) {
        setFiltros({
            dataPublicacaoPncpInicial: f.dataInicial,
            dataPublicacaoPncpFinal: f.dataFinal,
            codigoModalidade: f.modalidade,
            unidadeOrgaoUfSigla: f.uf === "all" ? undefined : f.uf,
            orgaoEntidadeCnpj: f.cnpjOrgao,
            // A API do PNCP as vezes falha com ranges grandes e termo, 
            // mas vamos passar o termo se houver suporte futuro ou uso de outro campo
            tamanhoPagina: 50,
        });
    } else if (f.modulo === 'legado') {
        setFiltros({
            data_publicacao_inicial: f.dataInicial,
            data_publicacao_final: f.dataFinal,
            modalidade: f.modalidade,
            // O sistema legado permite buscar por objeto em alguns endpoints, 
            // aqui mantemos o padrão e filtramos no cliente.
            tamanhoPagina: 50,
        });
    } else {
         const hoje = new Date();
         const sessentaDiasAtras = new Date(hoje);
         sessentaDiasAtras.setDate(sessentaDiasAtras.getDate() - 60);
         
         setFiltros({
            dt_data_edital_inicial: sessentaDiasAtras.toISOString().split("T")[0],
            dt_data_edital_final: hoje.toISOString().split("T")[0],
            // Para pregões podemos tentar passar o termo no campo de objeto se API permitir
            tamanhoPagina: 50,
        });
    }
  };

  const navigate = useNavigate();

  const normalizeResult = (item: any): BaseEdital => {
    if (modulo === 'pncp') {
        const c = item as ComprasGovContratacao;
        return {
            id: c.idCompra,
            objeto: c.objetoCompra,
            orgao: c.unidadeOrgaoNomeUnidade,
            cnpj: c.orgaoEntidadeCnpj,
            modalidade: c.modalidadeNome,
            valor: c.valorTotalEstimado,
            dataPublicacao: c.dataPublicacaoPncp,
            dataAbertura: c.dataAberturaPropostaPncp || undefined,
            municipio: c.unidadeOrgaoMunicipioNome,
            uf: c.unidadeOrgaoUfSigla,
            portal: 'pncp',
            numeroControle: c.numeroControlePNCP,
            processo: c.processo,
            raw: c
        };
    } else if (modulo === 'legado') {
        const l = item as any;
        return {
            id: l.identificador,
            objeto: l.objeto,
            orgao: `UASG: ${l.uasg}`,
            modalidade: l.nome_modalidade,
            valor: l.valor_estimado_total,
            dataPublicacao: l.data_publicacao,
            dataAbertura: l.data_abertura_proposta,
            portal: 'comprasgov',
            link: `https://comprasnet.gov.br/livre/Licitacoes/consulta_filtro.asp?identificador=${l.identificador}`,
            raw: l
        };
    } else {
        const p = item as any;
        return {
            id: p.id_compra,
            objeto: p.tx_objeto,
            orgao: p.no_ausg || p.no_orgao,
            modalidade: p.ds_tipo_pregao || "Pregão",
            valor: p.vl_estimado_total ? parseFloat(p.vl_estimado_total) : null,
            dataPublicacao: p.dt_data_edital,
            dataAbertura: p.dt_inicio_proposta,
            portal: 'pregao',
            raw: p
        };
    }
  };

  const handleImportar = async (edital: BaseEdital) => {
    try {
      const { data: editalSalvo, error: insertError } = await supabase.from("editais").insert({
        numero: edital.numeroControle || edital.id,
        orgao: edital.orgao,
        objeto: edital.objeto || "Sem descrição",
        data_abertura: edital.dataAbertura?.split("T")[0] || null,
        status: "ativo",
        raw_json: edital.raw as unknown as Json,
      }).select("id").single();

      if (insertError) throw insertError;

      if (editalSalvo) {
        const numeroInterno = edital.processo || `PROC-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
        
        const { error: procError } = await supabase.from("processos").insert({
          edital_id: editalSalvo.id,
          numero_interno: numeroInterno,
          status: "em_andamento",
          observacoes: `Importado de ${edital.portal.toUpperCase()}`
        });

        if (procError) throw procError;
      }

      toast({
        title: "✅ Importação concluída!",
        description: `O edital e o processo foram criados.`,
      });

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
            Busque licitações em múltiplos portais e monitore palavras-chave para não perder oportunidades
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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <ComprasGovFilters 
            onBuscar={handleBuscar} 
            onSaveMonitoramento={handleSaveMonitoramento}
            loading={isLoading} 
          />
        </div>
        
        {/* Monitoramentos Sidebar */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Monitoramentos Agendados</h2>
          </div>
          <div className="bg-card border rounded-xl p-4 min-h-[100px] space-y-3">
            {monitoramentos.length === 0 ? (
               <p className="text-xs text-muted-foreground italic">Nenhum monitoramento salvo. Salve uma palavra-chave para receber alertas.</p>
            ) : (
                monitoramentos.map(m => (
                    <div key={m.id} className="group flex items-center justify-between p-2 bg-muted/30 rounded-lg hover:bg-primary/5 transition-colors border border-transparent hover:border-primary/20">
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{m.nome}</p>
                            <p className="text-[10px] text-muted-foreground">Termo: {m.palavra_chave}</p>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteMonitoramento(m.id)}
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                ))
            )}
          </div>
        </div>
      </div>

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
          <p className="text-sm">Consultando portal {modulo.toUpperCase()}...</p>
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
            {(error as any)?.message || "Não foi possível consultar a API. Tente novamente."}
          </p>
          {(error as any)?.details && (
            <pre className="mt-4 p-2 bg-muted rounded text-[10px] max-w-full overflow-auto text-left">
              {String((error as any).details)}
            </pre>
          )}
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
                  const resultadosFiltrados = data.resultado.filter((item: any) => {
                    const normalized = normalizeResult(item);
                    
                    // Se for Pregão, filtramos os vencidos (data fim proposta < hoje)
                    if (modulo === 'pregao' && item.dt_fim_proposta) {
                        const dataFim = new Date(item.dt_fim_proposta);
                        const hoje = new Date();
                        hoje.setHours(0, 0, 0, 0); 
                        if (dataFim < hoje) return false;
                    }

                    if (!palavraChave) return true;

                    return (normalized.objeto || "").toLowerCase().includes(palavraChave.toLowerCase()) ||
                           (normalized.orgao || "").toLowerCase().includes(palavraChave.toLowerCase());
                  });

                  if (resultadosFiltrados.length === 0) {
                    return (
                      <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <FileText className="h-8 w-8 opacity-30 mb-2" />
                        <p className="text-sm">Nenhum resultado para "{palavraChave}"</p>
                        <p className="text-xs mt-1">Tente outra palavra-chave</p>
                      </div>
                    );
                  }

                  return resultadosFiltrados.map((item: any) => {
                    const normalized = normalizeResult(item);
                    return (
                      <ContratacaoCard
                        key={normalized.id}
                        edital={normalized}
                        onImportar={handleImportar}
                      />
                    );
                  });
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
