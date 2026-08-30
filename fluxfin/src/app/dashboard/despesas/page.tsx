"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  ReceiptText,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
  ExternalLink,
} from "lucide-react";

interface Alocacao {
  rubricaId: number;
  rubricaCodigo: string;
  rubricaDescricao: string;
  valorPrevisto: number;
}

interface Projeto {
  id: number;
  codigo: string;
  titulo: string;
  orcamentoGlobal: number;
  alocacoes: Alocacao[];
}

interface Despesa {
  id: number;
  projetoId: number;
  rubricaId: number;
  projetoCodigo: string;
  projetoTitulo: string;
  rubricaCodigo: string;
  rubricaDescricao: string;
  dataDespesa: string;
  valorExecutado: number;
  valorPrevisto: number;
  descricao: string;
  comprovanteUrl: string | null;
}

const formatBRL = (valor: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);

const parseMoeda = (valor: string) => {
  const numero = parseFloat(valor.replace(/\./g, "").replace(",", "."));
  return isNaN(numero) ? 0 : numero;
};

const formatData = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { timeZone: "UTC" });

const chaveRubrica = (projetoId: number, rubricaId: number) =>
  `${projetoId}:${rubricaId}`;

export default function DespesasPage() {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [filtroProjeto, setFiltroProjeto] = useState("");

  const [form, setForm] = useState({
    projetoId: "",
    rubricaId: "",
    dataDespesa: "",
    valor: "",
    descricao: "",
    comprovanteUrl: "",
  });

  const carregarDados = () => {
    return Promise.all([
      fetch("/api/projetos").then((r) => r.json()),
      fetch("/api/despesas").then((r) => r.json()),
    ]);
  };

  useEffect(() => {
    carregarDados()
      .then(([projetosResult, despesasResult]) => {
        if (Array.isArray(projetosResult)) setProjetos(projetosResult);
        if (Array.isArray(despesasResult)) setDespesas(despesasResult);
      })
      .catch(() => setError("Erro ao carregar os dados. Tente novamente."));
  }, []);

  const projetoSelecionado = useMemo(
    () =>
      projetos.find((p) => p.id === Number(form.projetoId)) ?? null,
    [projetos, form.projetoId]
  );

  const rubricasDisponiveis = useMemo(
    () => projetoSelecionado?.alocacoes ?? [],
    [projetoSelecionado]
  );

  const handleChange =
    (campo: keyof typeof form) =>
    (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
      const valor = e.target.value;
      setForm((prev) => ({
        ...prev,
        [campo]: valor,
        ...(campo === "projetoId" ? { rubricaId: "" } : {}),
      }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSucesso("");

    if (!form.projetoId) {
      setError("Selecione o projeto da despesa.");
      return;
    }

    if (!form.rubricaId) {
      setError("Selecione a rubrica correspondente.");
      return;
    }

    if (!form.dataDespesa) {
      setError("Informe a data da ocorrência.");
      return;
    }

    const valor = parseMoeda(form.valor);

    if (valor <= 0) {
      setError("Informe um valor válido para a despesa.");
      return;
    }

    if (!form.descricao.trim()) {
      setError("Descreva a despesa lançada.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/despesas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projetoId: Number(form.projetoId),
          rubricaId: Number(form.rubricaId),
          dataDespesa: form.dataDespesa,
          valorExecutado: valor,
          descricao: form.descricao.trim(),
          comprovanteUrl: form.comprovanteUrl.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao lançar a despesa.");
        setSubmitting(false);
        return;
      }

      setSucesso("Despesa lançada com sucesso!");
      setForm({
        projetoId: "",
        rubricaId: "",
        dataDespesa: "",
        valor: "",
        descricao: "",
        comprovanteUrl: "",
      });
      setShowForm(false);
      carregarDados().catch(() =>
        setError("Erro ao atualizar a lista de despesas.")
      );

      setTimeout(() => setSucesso(""), 4000);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (despesa: Despesa) => {
    if (!confirm("Excluir este lançamento de despesa?")) return;

    setDeletingId(despesa.id);
    setError("");

    try {
      const response = await fetch(`/api/despesas/${despesa.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Erro ao excluir a despesa.");
        return;
      }

      setDespesas((prev) => prev.filter((d) => d.id !== despesa.id));
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setDeletingId(null);
    }
  };

  const totaisPorRubrica = useMemo(() => {
    const totais = new Map<string, number>();

    for (const despesa of despesas) {
      const chave = chaveRubrica(despesa.projetoId, despesa.rubricaId);
      totais.set(chave, (totais.get(chave) ?? 0) + despesa.valorExecutado);
    }

    return totais;
  }, [despesas]);

  const despesasFiltradas = useMemo(() => {
    if (!filtroProjeto) return despesas;
    return despesas.filter(
      (d) => d.projetoId === Number(filtroProjeto)
    );
  }, [despesas, filtroProjeto]);

  const resumo = useMemo(() => {
    let previsto = 0;
    let executado = 0;
    const grupos = new Map<string, number>();

    for (const despesa of despesasFiltradas) {
      const chave = chaveRubrica(despesa.projetoId, despesa.rubricaId);

      if (!grupos.has(chave)) grupos.set(chave, despesa.valorPrevisto);
      executado += despesa.valorExecutado;
    }

    for (const valorPrevisto of grupos.values()) previsto += valorPrevisto;

    return {
      previsto,
      executado,
      saldo: previsto - executado,
    };
  }, [despesasFiltradas]);

  return (
    <div>
      {/* Cabeçalho */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 px-6 py-10 text-white">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-semibold mb-4">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              EXECUÇÃO FINANCEIRA
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold">
              Despesas{" "}
              <span className="text-primary-light">P&amp;D+I</span>
            </h1>
            <p className="text-white/70 mt-2 text-sm max-w-xl">
              Lance as despesas executadas dos projetos, vinculando cada
              lançamento obrigatoriamente a um projeto e a uma rubrica ANEEL.
            </p>
          </div>

          <button
            onClick={() => {
              setShowForm((prev) => !prev);
              setError("");
            }}
            className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all ${
              showForm
                ? "bg-white/10 border border-white/30 text-white hover:bg-white/20"
                : "btn-primary text-white"
            }`}
          >
            {showForm ? (
              <>
                <X className="w-5 h-5" />
                Cancelar
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Nova Despesa
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mensagens */}
      {(error || sucesso) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 animate-[shake_0.3s_ease-in-out]">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}
          {sucesso && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 border border-green-200">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-sm text-green-700">{sucesso}</span>
            </div>
          )}
        </div>
      )}

      {/* Resumo */}
      {despesasFiltradas.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Previsto
              </p>
              <p className="text-xl font-bold text-gray-800 mt-1">
                {formatBRL(resumo.previsto)}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Executado
              </p>
              <p className="text-xl font-bold text-gray-800 mt-1">
                {formatBRL(resumo.executado)}
              </p>
            </div>
            <div
              className={`rounded-2xl border shadow-sm px-5 py-4 ${
                resumo.saldo >= 0
                  ? "bg-green-50 border-green-200"
                  : "bg-orange-50 border-orange-200"
              }`}
            >
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Saldo
              </p>
              <p
                className={`text-xl font-bold mt-1 ${
                  resumo.saldo >= 0 ? "text-green-700" : "text-orange-600"
                }`}
              >
                {formatBRL(resumo.saldo)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modulo de lançamento */}
      {showForm && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Novo Lançamento de Despesa
                </h2>
                <p className="text-sm text-gray-500">
                  Vincule a despesa a um projeto e à rubrica correspondente.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                <ReceiptText className="w-3.5 h-3.5" />
                Despesa
              </span>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">
                    Projeto *
                  </label>
                  <select
                    value={form.projetoId}
                    onChange={handleChange("projetoId")}
                    className="input-field w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-800 outline-none"
                    required
                  >
                    <option value="">Selecione o projeto...</option>
                    {projetos.map((projeto) => (
                      <option key={projeto.id} value={projeto.id}>
                        {projeto.codigo} — {projeto.titulo}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">
                    Rubrica (ANEEL) *
                  </label>
                  <select
                    value={form.rubricaId}
                    onChange={handleChange("rubricaId")}
                    className="input-field w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-800 outline-none disabled:opacity-50"
                    required
                    disabled={!projetoSelecionado}
                  >
                    <option value="">
                      {projetoSelecionado
                        ? "Selecione a rubrica..."
                        : "Selecione um projeto primeiro"}
                    </option>
                    {rubricasDisponiveis.map((alocacao) => (
                      <option
                        key={alocacao.rubricaId}
                        value={alocacao.rubricaId}
                      >
                        {alocacao.rubricaCodigo} — {alocacao.rubricaDescricao}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">
                    Data da Ocorrência *
                  </label>
                  <input
                    type="date"
                    value={form.dataDespesa}
                    onChange={handleChange("dataDespesa")}
                    className="input-field w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-800 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">
                    Valor Executado (R$) *
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.valor}
                    onChange={handleChange("valor")}
                    placeholder="Ex.: 12.500,00"
                    className="input-field w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-800 placeholder-gray-400 outline-none"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">
                    Descrição *
                  </label>
                  <input
                    type="text"
                    value={form.descricao}
                    onChange={handleChange("descricao")}
                    placeholder="Ex.: Nota fiscal de equipamento de medição"
                    className="input-field w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-800 placeholder-gray-400 outline-none"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">
                    Comprovante (URL)
                    <span className="text-gray-400 font-normal">
                      {" "}
                      (opcional)
                    </span>
                  </label>
                  <input
                    type="url"
                    value={form.comprovanteUrl}
                    onChange={handleChange("comprovanteUrl")}
                    placeholder="https://drive.google.com/..."
                    className="input-field w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-800 placeholder-gray-400 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200">
                <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">
                  Lançamentos não bloqueiam o saldo: valores acima do previsto
                  da rubrica são registrados e sinalizados na listagem.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setError("");
                  }}
                  className="px-5 py-3 rounded-xl text-gray-600 font-semibold hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {submitting ? "Lançando..." : "Lançar Despesa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Listagem */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              Despesas Lançadas
            </h2>
            <p className="text-sm text-gray-500">
              {despesas.length > 0
                ? `${despesas.length} lançamento${despesas.length > 1 ? "s" : ""}`
                : "Nenhuma despesa lançada ainda"}
            </p>
          </div>

          {despesas.length > 0 && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-500">
                Projeto:
              </label>
              <select
                value={filtroProjeto}
                onChange={(e) => setFiltroProjeto(e.target.value)}
                className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 text-sm outline-none"
              >
                <option value="">Todos</option>
                {projetos
                  .filter((p) => despesas.some((d) => d.projetoId === p.id))
                  .map((projeto) => (
                    <option key={projeto.id} value={projeto.id}>
                      {projeto.codigo} — {projeto.titulo}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        {projetos.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <ReceiptText className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-base font-bold text-gray-800 mb-1">
              Nenhum projeto disponível
            </h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-5">
              Cadastre um projeto e distribua seu orçamento pelas rubricas
              antes de lançar as despesas executadas.
            </p>
            <a
              href="/dashboard/projetos"
              className="btn-primary inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white font-semibold"
            >
              <Plus className="w-5 h-5" />
              Ir para Projetos
            </a>
          </div>
        ) : despesasFiltradas.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <ReceiptText className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-base font-bold text-gray-800 mb-1">
              Nenhuma despesa {filtroProjeto ? "para este projeto" : "lançada"}
            </h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-5">
              Clique em &quot;Nova Despesa&quot; para registrar o primeiro
              lançamento da execução financeira.
            </p>
            <button
              onClick={() => {
                setShowForm(true);
                setError("");
              }}
              className="btn-primary inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white font-semibold"
            >
              <Plus className="w-5 h-5" />
              Lançar Despesa
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3 font-semibold text-gray-600">
                      Data
                    </th>
                    <th className="px-4 py-3 font-semibold text-gray-600">
                      Projeto
                    </th>
                    <th className="px-4 py-3 font-semibold text-gray-600">
                      Rubrica
                    </th>
                    <th className="px-4 py-3 font-semibold text-gray-600">
                      Descrição
                    </th>
                    <th className="px-4 py-3 font-semibold text-gray-600 text-right">
                      Valor Executado
                    </th>
                    <th className="px-4 py-3 font-semibold text-gray-600 text-right">
                      Saldo da Rubrica
                    </th>
                    <th className="px-4 py-3 font-semibold text-gray-600 text-center">
                      Comprovante
                    </th>
                    <th className="px-4 py-3 font-semibold text-gray-600 text-center">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {despesasFiltradas.map((despesa) => {
                    const saldo =
                      despesa.valorPrevisto -
                      (totaisPorRubrica.get(
                        chaveRubrica(despesa.projetoId, despesa.rubricaId)
                      ) ?? 0);
                    const ultrapassou = saldo < 0;

                    return (
                      <tr
                        key={despesa.id}
                        className="border-t border-gray-100 hover:bg-gray-50/60 transition-colors"
                      >
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {formatData(despesa.dataDespesa)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-bold whitespace-nowrap">
                            {despesa.projetoCodigo}
                          </span>
                          <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[180px]">
                            {despesa.projetoTitulo}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-bold whitespace-nowrap">
                            {despesa.rubricaCodigo}
                          </span>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {despesa.rubricaDescricao}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-gray-700 max-w-[260px]">
                          {despesa.descricao}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-800 whitespace-nowrap">
                          {formatBRL(despesa.valorExecutado)}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span
                            className={`inline-flex flex-col items-end gap-0.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${
                              ultrapassou
                                ? "bg-orange-50 text-orange-600 border-orange-200"
                                : "bg-green-50 text-green-700 border-green-200"
                            }`}
                          >
                            <span>{formatBRL(saldo)}</span>
                            {ultrapassou && (
                              <span className="font-bold">
                                excede previsto
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {despesa.comprovanteUrl ? (
                            <a
                              href={despesa.comprovanteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100 transition-colors"
                              title="Ver comprovante"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Ver
                            </a>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDelete(despesa)}
                            disabled={deletingId === despesa.id}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                            title="Excluir despesa"
                          >
                            {deletingId === despesa.id ? (
                              <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}