"use client";

import { useState, useEffect } from "react";
import {
  FolderKanban,
  DollarSign,
  TrendingDown,
  Wallet,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Receipt,
} from "lucide-react";
import type { Fluxo } from "@/lib/fluxo";
import { formatBRL, formatData, mesCurto } from "@/lib/format";

const badgeSaldo = (saldo: number) =>
  saldo >= 0
    ? "bg-green-50 text-green-700 border-green-200"
    : "bg-orange-50 text-orange-600 border-orange-200";

export default function DashboardPage() {
  const [userName, setUserName] = useState("...");
  const [fluxo, setFluxo] = useState<Fluxo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedProjeto, setSelectedProjeto] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) =>
        r.ok ? r.json() : Promise.resolve(null)
      ),
      fetch("/api/fluxo").then((r) =>
        r.ok ? r.json() : Promise.resolve(null)
      ),
    ])
      .then(([me, fluxoData]) => {
        if (me) setUserName(me.nome || "...");
        if (fluxoData) setFluxo(fluxoData);
        if (!fluxoData) setError("Erro ao carregar os dados financeiros.");
      })
      .catch(() => {
        setError("Erro ao carregar os dados financeiros.");
      })
      .finally(() => setLoading(false));
  }, []);

  const projetoAtivo = fluxo?.projetos.find(
    (p) => p.id === Number(selectedProjeto)
  );

  const fluxoVisivel = projetoAtivo?.fluxoMensal ?? fluxo?.fluxoConsolidado ?? [];
  const maxFluxo = Math.max(
    ...fluxoVisivel.flatMap((m) => [m.entradas, m.saidas]),
    1
  );

  const statCards = fluxo
    ? [
        {
          label: "Total de Projetos",
          value: String(fluxo.resumo.qtdProjetos),
          icon: FolderKanban,
          color: "text-blue-600",
          bg: "bg-blue-50",
        },
        {
          label: "Orçamento Global",
          value: formatBRL(fluxo.resumo.orcamentoGlobal),
          icon: DollarSign,
          color: "text-green-600",
          bg: "bg-green-50",
        },
        {
          label: "Total Executado",
          value: `${formatBRL(fluxo.resumo.totalExecutado)} (${fluxo.resumo.percentualGlobal.toFixed(1)}%)`,
          icon: TrendingDown,
          color: "text-orange-600",
          bg: "bg-orange-50",
        },
        {
          label: "Saldo Geral",
          value: formatBRL(fluxo.resumo.saldoGeral),
          icon: Wallet,
          color: "text-primary",
          bg: "bg-primary/5",
        },
      ]
    : Array.from({ length: 4 }, (_, i) => ({
        label: "Carregando...",
        value: "—",
        icon: (["FolderKanban", "DollarSign", "TrendingDown", "Wallet"] as const)[i] === "FolderKanban"
          ? FolderKanban
          : (["FolderKanban", "DollarSign", "TrendingDown", "Wallet"] as const)[i] === "DollarSign"
            ? DollarSign
            : (["FolderKanban", "DollarSign", "TrendingDown", "Wallet"] as const)[i] === "TrendingDown"
              ? TrendingDown
              : Wallet,
        color: "text-gray-400",
        bg: "bg-gray-50",
      }));

  return (
    <div>
      {/* Hero Banner */}
      <div className="hero-banner relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg
            className="w-full h-full"
            viewBox="0 0 800 400"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#0d9488" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#0d9488" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="400" cy="200" r="300" fill="url(#glow)" />
            <line x1="100" y1="100" x2="250" y2="150" stroke="#0d9488" strokeWidth="1" opacity="0.4" />
            <line x1="250" y1="150" x2="400" y2="100" stroke="#0d9488" strokeWidth="1" opacity="0.4" />
            <line x1="400" y1="100" x2="550" y2="180" stroke="#0d9488" strokeWidth="1" opacity="0.4" />
            <line x1="550" y1="180" x2="700" y2="120" stroke="#0d9488" strokeWidth="1" opacity="0.4" />
            <line x1="150" y1="250" x2="300" y2="200" stroke="#0d9488" strokeWidth="1" opacity="0.4" />
            <line x1="300" y1="200" x2="500" y2="280" stroke="#0d9488" strokeWidth="1" opacity="0.4" />
            <line x1="500" y1="280" x2="650" y2="220" stroke="#0d9488" strokeWidth="1" opacity="0.4" />
            <line x1="200" y1="300" x2="350" y2="320" stroke="#0d9488" strokeWidth="1" opacity="0.3" />
            <line x1="350" y1="320" x2="550" y2="350" stroke="#0d9488" strokeWidth="1" opacity="0.3" />
            <circle cx="100" cy="100" r="4" fill="#0d9488" opacity="0.5" />
            <circle cx="250" cy="150" r="5" fill="#0d9488" opacity="0.6" />
            <circle cx="400" cy="100" r="4" fill="#0d9488" opacity="0.5" />
            <circle cx="550" cy="180" r="6" fill="#0d9488" opacity="0.7" />
            <circle cx="700" cy="120" r="4" fill="#0d9488" opacity="0.5" />
            <circle cx="150" cy="250" r="3" fill="#0d9488" opacity="0.4" />
            <circle cx="300" cy="200" r="5" fill="#0d9488" opacity="0.6" />
            <circle cx="500" cy="280" r="4" fill="#0d9488" opacity="0.5" />
            <circle cx="650" cy="220" r="3" fill="#0d9488" opacity="0.4" />
            <circle cx="200" cy="300" r="3" fill="#0d9488" opacity="0.4" />
            <circle cx="350" cy="320" r="4" fill="#0d9488" opacity="0.5" />
            <circle cx="550" cy="350" r="3" fill="#0d9488" opacity="0.4" />
          </svg>
        </div>

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <span className="absolute text-primary/20 text-2xl font-bold rotate-[-8deg] animate-[float1_16s_ease-in-out_infinite]" style={{ top: "8%", left: "10%" }}>
            Tecnologia
          </span>
          <span className="absolute text-primary/15 text-xl font-bold rotate-[-5deg] animate-[float2_20s_ease-in-out_infinite]" style={{ top: "40%", left: "5%" }}>
            Projeto
          </span>
          <span className="absolute text-primary/20 text-lg font-bold rotate-[-3deg] animate-[float3_18s_ease-in-out_infinite]" style={{ bottom: "20%", left: "8%" }}>
            Contrato
          </span>
          <span className="absolute text-primary/20 text-2xl font-bold animate-[float1_14s_ease-in-out_infinite_reverse]" style={{ bottom: "8%", left: "35%" }}>
            Inovação
          </span>
          <span className="absolute text-primary/15 text-xl font-bold rotate-[5deg] animate-[float2_19s_ease-in-out_infinite]" style={{ top: "30%", right: "8%" }}>
            Ciência
          </span>
          <span className="absolute text-primary/10 text-lg font-bold rotate-[3deg] animate-[float3_16s_ease-in-out_infinite_reverse]" style={{ bottom: "30%", right: "12%" }}>
            P&D+I
          </span>
        </div>

        <div className="relative z-10 text-center px-4 py-16 sm:py-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-primary/20 text-primary text-xs font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Sistema de Gestão Financeira v1.0
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-800 mb-4">
            Flux<span className="text-primary">Fin</span>
          </h1>

          <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto mb-6 leading-relaxed">
            Sistema de controle financeiro e gestão orçamentária de projetos de
            pesquisa, desenvolvimento e inovação (P&D+I)
          </p>

          <p className="text-sm text-gray-500">
            Conectado como <span className="font-semibold text-gray-700">{userName}</span>
          </p>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-sm text-red-600">{error}</span>
          </div>
        </div>
      )}

      {/* Cards de Resumo */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <div
              key={`${stat.label}-${index}`}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}
                >
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <p className="text-lg font-bold text-gray-800 truncate">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Demonstrativo por rubrica */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              Demonstrativo de Saldo por Rubrica
            </h2>
            <p className="text-sm text-gray-500">
              Saldo remanescente calculado em tempo real para cada projeto
            </p>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-400">
            Carregando demonstrativo...
          </div>
        ) : !fluxo || fluxo.projetos.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <FolderKanban className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-base font-bold text-gray-800 mb-1">
              Nenhum projeto cadastrado
            </h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-5">
              Cadastre projetos e lance despesas para acompanhar o fluxo de
              caixa e o saldo por rubrica.
            </p>
            <a
              href="/dashboard/projetos"
              className="btn-primary inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white font-semibold"
            >
              <FolderKanban className="w-5 h-5" />
              Ir para Projetos
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {fluxo.projetos.map((projeto) => {
              const expanded = expandedId === projeto.id;

              return (
                <div
                  key={projeto.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedId(expanded ? null : projeto.id)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50/60 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-bold whitespace-nowrap">
                        {projeto.codigo}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 truncate">
                          {projeto.titulo}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatData(projeto.dataInicio)} —{" "}
                          {formatData(projeto.dataTermino)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 flex-shrink-0">
                      <div className="hidden sm:block w-40">
                        <div className="flex justify-between text-[11px] text-gray-500 mb-1">
                          <span>Execução</span>
                          <span className="font-semibold">
                            {projeto.percentualProjeto.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-primary-dark rounded-full"
                            style={{
                              width: `${Math.min(projeto.percentualProjeto, 100)}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-[11px] text-gray-400">Saldo</p>
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-lg border text-xs font-bold ${badgeSaldo(projeto.saldoProjeto)}`}
                        >
                          {formatBRL(projeto.saldoProjeto)}
                        </span>
                      </div>

                      {expanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {expanded && (
                    <div className="border-t border-gray-100">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 text-left">
                              <th className="px-5 py-2.5 font-semibold text-gray-600">
                                Rubrica
                              </th>
                              <th className="px-5 py-2.5 font-semibold text-gray-600 text-right">
                                Previsto
                              </th>
                              <th className="px-5 py-2.5 font-semibold text-gray-600 text-right">
                                Executado
                              </th>
                              <th className="px-5 py-2.5 font-semibold text-gray-600 text-right">
                                Saldo
                              </th>
                              <th className="px-5 py-2.5 font-semibold text-gray-600 w-48">
                                % de Execução
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {projeto.rubricas.map((rubrica) => (
                              <tr
                                key={rubrica.rubricaId}
                                className="border-t border-gray-100"
                              >
                                <td className="px-5 py-3">
                                  <span className="inline-flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-bold">
                                      {rubrica.rubricaCodigo}
                                    </span>
                                    <span className="text-gray-700">
                                      {rubrica.rubricaDescricao}
                                    </span>
                                  </span>
                                </td>
                                <td className="px-5 py-3 text-right text-gray-700 whitespace-nowrap">
                                  {formatBRL(rubrica.valorPrevisto)}
                                </td>
                                <td className="px-5 py-3 text-right text-gray-700 whitespace-nowrap">
                                  {formatBRL(rubrica.valorExecutado)}
                                </td>
                                <td className="px-5 py-3 text-right whitespace-nowrap">
                                  <span
                                    className={`inline-flex px-2 py-0.5 rounded-lg border text-xs font-bold ${badgeSaldo(rubrica.saldo)}`}
                                  >
                                    {formatBRL(rubrica.saldo)}
                                  </span>
                                </td>
                                <td className="px-5 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${
                                          rubrica.percentual > 100
                                            ? "bg-orange-400"
                                            : "bg-gradient-to-r from-primary to-primary-dark"
                                        }`}
                                        style={{
                                          width: `${Math.min(rubrica.percentual, 100)}%`,
                                        }}
                                      />
                                    </div>
                                    <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">
                                      {rubrica.percentual.toFixed(1)}%
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-gray-50">
                            <tr>
                              <td className="px-5 py-2.5 font-bold text-gray-700">
                                Total do projeto
                              </td>
                              <td className="px-5 py-2.5 text-right font-bold text-gray-800">
                                {formatBRL(projeto.orcamentoGlobal)}
                              </td>
                              <td className="px-5 py-2.5 text-right font-bold text-gray-800">
                                {formatBRL(projeto.totalExecutado)}
                              </td>
                              <td className="px-5 py-2.5 text-right font-bold text-gray-800">
                                {formatBRL(projeto.saldoProjeto)}
                              </td>
                              <td />
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      {projeto.saldoProjeto < 0 && (
                        <div className="flex items-center gap-2 px-5 py-2.5 bg-orange-50 border-t border-orange-100">
                          <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                          <p className="text-xs text-orange-600 font-semibold">
                            Atenção: as despesas ultrapassaram o orçamento
                            previsto deste projeto.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fluxo de Caixa */}
      {fluxo && fluxo.projetos.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">
                    Fluxo de Caixa
                  </h2>
                  <p className="text-sm text-gray-500">
                    Entradas (previsto) × saídas (executado) por mês
                  </p>
                </div>
              </div>

              <select
                value={selectedProjeto}
                onChange={(e) => setSelectedProjeto(e.target.value)}
                className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 text-sm outline-none"
              >
                <option value="">Todos os projetos</option>
                {fluxo.projetos.map((projeto) => (
                  <option key={projeto.id} value={projeto.id}>
                    {projeto.codigo} — {projeto.titulo}
                  </option>
                ))}
              </select>
            </div>

            {fluxoVisivel.length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-400">
                Sem período de fluxo para exibir.
              </div>
            ) : (
              <div className="p-6">
                <div className="flex gap-4 mb-6 px-1 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600">
                    <span className="w-2.5 h-2.5 rounded-sm bg-teal-500" />
                    Entradas (previsto)
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600">
                    <span className="w-2.5 h-2.5 rounded-sm bg-orange-400" />
                    Saídas (executado)
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <div className="flex items-end gap-3 min-w-max px-1 pb-1">
                    {fluxoVisivel.map((mes) => (
                      <div
                        key={mes.mes}
                        className="flex flex-col items-center gap-1.5 min-w-[56px]"
                        title={`${mes.mes}: entradas ${formatBRL(mes.entradas)} | saídas ${formatBRL(mes.saidas)}`}
                      >
                        <div className="flex items-end gap-1 h-28">
                          <div
                            className="w-3 rounded-t bg-teal-500 transition-all"
                            style={{
                              height: `${Math.max((mes.entradas / maxFluxo) * 96, 2)}px`,
                            }}
                          />
                          <div
                            className="w-3 rounded-t bg-orange-400 transition-all"
                            style={{
                              height: `${Math.max((mes.saidas / maxFluxo) * 96, 2)}px`,
                            }}
                          />
                        </div>
                        <span className="text-[10px] font-medium text-gray-500 whitespace-nowrap">
                          {mesCurto(mes.mes)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        <th className="px-4 py-2.5 font-semibold text-gray-600">
                          Mês
                        </th>
                        <th className="px-4 py-2.5 font-semibold text-gray-600 text-right">
                          Entradas
                        </th>
                        <th className="px-4 py-2.5 font-semibold text-gray-600 text-right">
                          Saídas
                        </th>
                        <th className="px-4 py-2.5 font-semibold text-gray-600 text-right">
                          Previsto Acumulado
                        </th>
                        <th className="px-4 py-2.5 font-semibold text-gray-600 text-right">
                          Saldo Acumulado
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {fluxoVisivel.map((mes) => (
                        <tr
                          key={mes.mes}
                          className="border-t border-gray-100"
                        >
                          <td className="px-4 py-2.5 text-gray-600 font-medium whitespace-nowrap">
                            {mes.mes}
                          </td>
                          <td className="px-4 py-2.5 text-right text-gray-700 whitespace-nowrap">
                            {formatBRL(mes.entradas)}
                          </td>
                          <td className="px-4 py-2.5 text-right text-gray-700 whitespace-nowrap">
                            {formatBRL(mes.saidas)}
                          </td>
                          <td className="px-4 py-2.5 text-right text-gray-500 whitespace-nowrap">
                            {formatBRL(mes.entradasAcumuladas)}
                          </td>
                          <td className="px-4 py-2.5 text-right whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-lg border text-xs font-bold ${badgeSaldo(mes.saldoAcumulado)}`}
                            >
                              {formatBRL(mes.saldoAcumulado)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex items-start gap-2 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200">
                  <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700">
                    Entradas = desembolso previsto distribuído uniformemente
                    pela duração do projeto (sem programação de desembolso
                    cadastrada). Saídas = despesas lançadas por data de
                    ocorrência.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Seção inferior */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 sm:p-10 text-white">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            CONTROLE FINANCEIRO P&D+I
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Rede <span className="text-primary-light">INESC Brasil</span>
          </h2>

          <p className="text-white/70 max-w-3xl leading-relaxed">
            O <strong className="text-white">FluxFin</strong> é um sistema
            desenvolvido para{" "}
            <strong className="text-white">controle financeiro</strong> de
            projetos de{" "}
            <strong className="text-white">
              Pesquisa, Desenvolvimento e Inovação (P&D+I)
            </strong>
            , atendendo às exigências normativas da ANEEL para alocação e
            execução orçamentária por rubricas.
          </p>
        </div>
      </div>
    </div>
  );
}