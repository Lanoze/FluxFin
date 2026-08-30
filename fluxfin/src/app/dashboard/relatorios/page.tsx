"use client";

import { useState, useEffect, useMemo } from "react";
import {
  FileBarChart,
  FileDown,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import type { Fluxo } from "@/lib/fluxo";
import { formatBRL } from "@/lib/format";
import { gerarRelatorioPDF } from "@/lib/generate-relatorio";

async function carregarLogoDataUrl(): Promise<string | null> {
  try {
    const resposta = await fetch("/logo.png");
    if (!resposta.ok) return null;
    const blob = await resposta.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export default function RelatoriosPage() {
  const [fluxo, setFluxo] = useState<Fluxo | null>(null);
  const [userName, setUserName] = useState("");
  const [selected, setSelected] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => (r.ok ? r.json() : Promise.resolve(null))),
      fetch("/api/fluxo").then((r) => (r.ok ? r.json() : Promise.resolve(null))),
      carregarLogoDataUrl(),
    ])
      .then(([me, fluxoData, logoData]) => {
        if (me?.nome) setUserName(me.nome);
        if (logoData) setLogo(logoData);
        if (fluxoData) setFluxo(fluxoData);
        else setError("Erro ao carregar os dados financeiros.");
      })
      .catch(() => setError("Erro ao carregar os dados financeiros."));
  }, []);

  const resumo = useMemo(() => {
    if (!fluxo) return null;

    const projeto =
      selected && fluxo.projetos.find((p) => p.id === Number(selected));

    if (projeto) {
      return {
        qtdProjetos: 1,
        orcamentoGlobal: projeto.orcamentoGlobal,
        saldoGeral: projeto.saldoProjeto,
      };
    }

    return {
      qtdProjetos: fluxo.projetos.length,
      orcamentoGlobal: fluxo.resumo.orcamentoGlobal,
      saldoGeral: fluxo.resumo.saldoGeral,
    };
  }, [fluxo, selected]);

  const handleDownload = () => {
    if (!fluxo || generating) return;

    setGenerating(true);
    setError("");

    try {
      gerarRelatorioPDF({
        fluxo,
        filtroProjetoId: selected ? Number(selected) : null,
        nomeUsuario: userName || "usuário",
        logoDataUrl: logo,
      });
    } catch {
      setError("Não foi possível gerar o PDF. Tente novamente.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      {/* Cabeçalho */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 px-6 py-10 text-white">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-semibold mb-4">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              RELATÓRIOS
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold">
              Relatórios{" "}
              <span className="text-primary-light">Prestação de Contas</span>
            </h1>
            <p className="text-white/70 mt-2 text-sm max-w-xl">
              Exporte relatórios gerenciais em PDF, consolidando os dados
              financeiros dos projetos P&amp;D+I para prestação de contas.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white/80 text-sm font-semibold">
              Formato: PDF
            </span>
          </div>
        </div>
      </div>

      {/* Mensagens */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-sm text-red-600">{error}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {!fluxo && !error ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-400">
            Carregando dados para o relatório...
          </div>
        ) : fluxo ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileBarChart className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">
                    Relatório Gerencial de Prestação de Contas
                  </h2>
                  <p className="text-sm text-gray-500">
                    Escolha o escopo e baixe o PDF
                  </p>
                </div>
              </div>

              {fluxo.projetos.length > 0 && (
                <select
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 text-sm outline-none"
                >
                  <option value="">Todos os projetos</option>
                  {fluxo.projetos.map((projeto) => (
                    <option key={projeto.id} value={projeto.id}>
                      {projeto.codigo} — {projeto.titulo}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="p-6 space-y-6">
              {resumo && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gray-50 border border-gray-100 rounded-xl px-5 py-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Projetos
                    </p>
                    <p className="text-xl font-bold text-gray-800 mt-1">
                      {resumo.qtdProjetos}
                    </p>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-xl px-5 py-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Orçamento Global
                    </p>
                    <p className="text-xl font-bold text-gray-800 mt-1">
                      {formatBRL(resumo.orcamentoGlobal)}
                    </p>
                  </div>
                  <div
                    className={`rounded-xl border px-5 py-4 ${
                      resumo.saldoGeral >= 0
                        ? "bg-green-50 border-green-200"
                        : "bg-orange-50 border-orange-200"
                    }`}
                  >
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Saldo Geral
                    </p>
                    <p
                      className={`text-xl font-bold mt-1 ${
                        resumo.saldoGeral >= 0
                          ? "text-green-700"
                          : "text-orange-600"
                      }`}
                    >
                      {formatBRL(resumo.saldoGeral)}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
                  Conteúdo do relatório
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    Resumo geral: projetos, orçamento global, total executado e
                    saldo.
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    Demonstrativo de saldo por rubrica (ANEEL) de cada projeto,
                    com realce para saldos negativos.
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    Fluxo de caixa mensal: entradas (previsto) × saídas
                    (executado), com acumulado e saldo.
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    Cabeçalho com marca da instituição, data de geração e
                    rodapé com paginação.
                  </li>
                </ul>
              </div>

              <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200">
                <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">
                  O PDF é gerado localmente no seu navegador com os dados mais
                  recentes do sistema, sem enviar informações a servidores
                  externos.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                <button
                  onClick={handleDownload}
                  disabled={
                    generating || fluxo.projetos.length === 0
                  }
                  className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <FileDown className="w-5 h-5" />
                  )}
                  {generating ? "Gerando..." : "Baixar PDF"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <FileBarChart className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-base font-bold text-gray-800 mb-1">
              Nenhum projeto disponível
            </h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Cadastre projetos e lance despesas para gerar o relatório
              gerencial de prestação de contas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}