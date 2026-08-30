"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  FolderKanban,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
  Loader2,
} from "lucide-react";

interface Rubrica {
  id: number;
  codigoAneel: string;
  descricao: string;
  ordem: number;
}

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
  descricao: string | null;
  dataInicio: string;
  dataTermino: string;
  orcamentoGlobal: number;
  alocacoes: Alocacao[];
  createdAt: string;
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

export default function ProjetosPage() {
  const [rubricas, setRubricas] = useState<Rubrica[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [form, setForm] = useState({
    codigo: "",
    titulo: "",
    descricao: "",
    dataInicio: "",
    dataTermino: "",
    orcamentoGlobal: "",
  });

  const [alocacoes, setAlocacoes] = useState<Record<number, string>>({});

  const carregarDados = () => {
    return Promise.all([
      fetch("/api/projetos").then((r) => r.json()),
      fetch("/api/rubricas").then((r) => r.json()),
    ]);
  };

  useEffect(() => {
    carregarDados()
      .then(([projetosResult, rubricasResult]) => {
        if (Array.isArray(rubricasResult)) setRubricas(rubricasResult);
        if (Array.isArray(projetosResult)) setProjetos(projetosResult);
      })
      .catch(() => setError("Erro ao carregar os dados. Tente novamente."))
      .finally(() => setLoading(false));
  }, []);

  const totalAlocado = useMemo(
    () =>
      rubricas.reduce(
        (acc, r) => acc + parseMoeda(alocacoes[r.id] || ""),
        0
      ),
    [rubricas, alocacoes]
  );

  const orcamentoGlobal = parseMoeda(form.orcamentoGlobal);
  const diferenca = Math.round((totalAlocado - orcamentoGlobal) * 100) / 100;
  const alocacaoValida =
    orcamentoGlobal > 0 && Math.abs(diferenca) <= 0.01;

  const handleChange =
    (campo: keyof typeof form) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement
      >
    ) => {
      setForm((prev) => ({ ...prev, [campo]: e.target.value }));
    };

  const handleAlocacaoChange = (rubricaId: number, valor: string) => {
    setAlocacoes((prev) => ({ ...prev, [rubricaId]: valor }));
  };

  const distribuirAutomaticamente = () => {
    if (!rubricas.length || orcamentoGlobal <= 0) return;

    const valorPorRubrica = Math.floor((orcamentoGlobal / rubricas.length) * 100) / 100;
    const resto = Math.round((orcamentoGlobal - valorPorRubrica * rubricas.length) * 100) / 100;

    const novaAlocacao: Record<number, string> = {};
    rubricas.forEach((r, i) => {
      const valor = i === rubricas.length - 1 ? valorPorRubrica + resto : valorPorRubrica;
      novaAlocacao[r.id] = valor.toFixed(2).replace(".", ",");
    });

    setAlocacoes(novaAlocacao);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSucesso("");

    if (!form.titulo.trim() || !form.codigo.trim()) {
      setError("Preencha o título e o código do projeto.");
      return;
    }

    if (!form.dataInicio || !form.dataTermino) {
      setError("Informe as datas de início e término.");
      return;
    }

    if (new Date(form.dataTermino) < new Date(form.dataInicio)) {
      setError("A data de término deve ser posterior à data de início.");
      return;
    }

    if (orcamentoGlobal <= 0) {
      setError("Informe um orçamento global válido.");
      return;
    }

    if (!alocacaoValida) {
      setError(
        "A soma das rubricas deve ser igual ao orçamento global do projeto."
      );
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        editandoId ? `/api/projetos/${editandoId}` : "/api/projetos",
        {
          method: editandoId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            orcamentoGlobal,
            alocacoes: rubricas.map((r) => ({
              rubricaId: r.id,
              valorPrevisto: parseMoeda(alocacoes[r.id] || ""),
            })),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            (editandoId
              ? "Erro ao atualizar o projeto."
              : "Erro ao cadastrar o projeto.")
        );
        setSubmitting(false);
        return;
      }

      setSucesso(
        editandoId
          ? "Projeto atualizado com sucesso!"
          : "Projeto cadastrado com sucesso!"
      );
      setEditandoId(null);
      setForm({
        codigo: "",
        titulo: "",
        descricao: "",
        dataInicio: "",
        dataTermino: "",
        orcamentoGlobal: "",
      });
      setAlocacoes({});
      setShowForm(false);
      carregarDados().catch(() =>
        setError("Erro ao atualizar a lista de projetos.")
      );

      setTimeout(() => setSucesso(""), 4000);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (projeto: Projeto) => {
    if (!confirm(`Excluir o projeto "${projeto.titulo}"?`)) return;

    setDeletingId(projeto.id);
    setError("");

    try {
      const response = await fetch(`/api/projetos/${projeto.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Erro ao excluir o projeto.");
        return;
      }

      setProjetos((prev) => prev.filter((p) => p.id !== projeto.id));
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setDeletingId(null);
    }
  };

  const toDateInput = (iso: string) => iso.slice(0, 10);

  const handleEdit = (projeto: Projeto) => {
    setEditandoId(projeto.id);
    setForm({
      codigo: projeto.codigo,
      titulo: projeto.titulo,
      descricao: projeto.descricao ?? "",
      dataInicio: toDateInput(projeto.dataInicio),
      dataTermino: toDateInput(projeto.dataTermino),
      orcamentoGlobal: projeto.orcamentoGlobal.toFixed(2).replace(".", ","),
    });

    const valores: Record<number, string> = {};
    projeto.alocacoes.forEach(
      (a) => (valores[a.rubricaId] = a.valorPrevisto.toFixed(2).replace(".", ","))
    );
    setAlocacoes(valores);
    setExpandedId(null);
    setError("");
    setShowForm(true);
  };

  const totalAlocadoPorProjeto = (projeto: Projeto) =>
    projeto.alocacoes.reduce((acc, a) => acc + a.valorPrevisto, 0);

  return (
    <div>
      {/* Cabeçalho */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 px-6 py-10 text-white">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-semibold mb-4">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              CADASTRO E PARAMETRIZAÇÃO
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold">
              Projetos{" "}
              <span className="text-primary-light">P&D+I</span>
            </h1>
            <p className="text-white/70 mt-2 text-sm max-w-xl">
              Cadastre novos projetos e distribuia o orçamento global pelas
              rubricas padronizadas ANEEL.
            </p>
          </div>

          <button
            onClick={() => {
              if (showForm) {
                setShowForm(false);
                setEditandoId(null);
              } else {
                setEditandoId(null);
                setForm({
                  codigo: "",
                  titulo: "",
                  descricao: "",
                  dataInicio: "",
                  dataTermino: "",
                  orcamentoGlobal: "",
                });
                setAlocacoes({});
                setShowForm(true);
              }
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
                Novo Projeto
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

      {/* Modulos de cadastro */}
      {showForm && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  {editandoId ? "Edição de Projeto" : "Cadastro de Projeto"}
                </h2>
                <p className="text-sm text-gray-500">
                  Parametrize as informacoes gerais e a alocacao orcamentaria
                  por rubrica.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                <FolderKanban className="w-3.5 h-3.5" />
                {editandoId ? "Editando projeto" : "Novo projeto"}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">
                  Informacoes Gerais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">
                      Título do Projeto *
                    </label>
                    <input
                      type="text"
                      value={form.titulo}
                      onChange={handleChange("titulo")}
                      placeholder="Ex.: Desenvolvimento de Sistema de Otimização Energética"
                      className="input-field w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-800 placeholder-gray-400 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">
                      Código do Projeto *
                    </label>
                    <input
                      type="text"
                      value={form.codigo}
                      onChange={handleChange("codigo")}
                      placeholder="Ex.: PD-00001"
                      className="input-field w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-800 placeholder-gray-400 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">
                      Orçamento Global (R$) *
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={form.orcamentoGlobal}
                      onChange={handleChange("orcamentoGlobal")}
                      placeholder="Ex.: 1.500.000,00"
                      className="input-field w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-800 placeholder-gray-400 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">
                      Data de Início *
                    </label>
                    <input
                      type="date"
                      value={form.dataInicio}
                      onChange={handleChange("dataInicio")}
                      className="input-field w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-800 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">
                      Data de Término *
                    </label>
                    <input
                      type="date"
                      value={form.dataTermino}
                      onChange={handleChange("dataTermino")}
                      className="input-field w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-800 outline-none"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">
                      Descrição
                      <span className="text-gray-400 font-normal">
                        {" "}
                        (opcional)
                      </span>
                    </label>
                    <textarea
                      value={form.descricao}
                      onChange={handleChange("descricao")}
                      placeholder="Breve descricao do projeto, objetivos e resultados esperados..."
                      rows={3}
                      className="input-field w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-800 placeholder-gray-400 outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                    Alocação Orçamentária por Rubricas (ANEEL)
                  </h3>
                  <button
                    type="button"
                    onClick={distribuirAutomaticamente}
                    className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
                  >
                    Distribuir automaticamente
                  </button>
                </div>

                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        <th className="px-4 py-3 font-semibold text-gray-600">
                          Rubrica
                        </th>
                        <th className="px-4 py-3 font-semibold text-gray-600 text-right">
                          Valor Previsto (R$)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rubricas.map((rubrica) => (
                        <tr
                          key={rubrica.id}
                          className="border-t border-gray-100"
                        >
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-bold">
                                {rubrica.codigoAneel}
                              </span>
                              <span className="text-gray-700">
                                {rubrica.descricao}
                              </span>
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={alocacoes[rubrica.id] || ""}
                              onChange={(e) =>
                                handleAlocacaoChange(rubrica.id, e.target.value)
                              }
                              placeholder="0,00"
                              className="input-field w-full sm:w-48 text-right px-4 py-2.5 rounded-xl bg-gray-50 text-gray-800 placeholder-gray-400 outline-none"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div
                  className={`mt-4 px-5 py-4 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${
                    alocacaoValida
                      ? "bg-green-50 border-green-200"
                      : orcamentoGlobal > 0
                      ? "bg-orange-50 border-orange-200"
                      : "bg-gray-50 border-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {alocacaoValida && orcamentoGlobal > 0 ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle
                        className={`w-5 h-5 ${
                          orcamentoGlobal > 0
                            ? "text-orange-500"
                            : "text-gray-400"
                        }`}
                      />
                    )}
                    <div>
                      <p
                        className={`text-sm font-semibold ${
                          alocacaoValida && orcamentoGlobal > 0
                            ? "text-green-700"
                            : orcamentoGlobal > 0
                            ? "text-orange-700"
                            : "text-gray-600"
                        }`}
                      >
                        Total alocado:{" "}
                        <span className="font-bold">
                          {formatBRL(totalAlocado)}
                        </span>{" "}
                        / Orçamento global:{" "}
                        <span className="font-bold">
                          {formatBRL(orcamentoGlobal)}
                        </span>
                      </p>
                      {orcamentoGlobal > 0 && !alocacaoValida && (
                        <p className="text-xs text-orange-600 mt-0.5">
                          {diferenca > 0
                            ? `Faltam alocar ${formatBRL(diferenca)} para completar o orçamento.`
                            : `Há um excedente de ${formatBRL(Math.abs(diferenca))} em relação ao orçamento global.`}
                        </p>
                      )}
                    </div>
                  </div>

                  {orcamentoGlobal > 0 && alocacaoValida && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700 bg-white px-3 py-1 rounded-full border border-green-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Alocação completa
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditandoId(null);
                    setError("");
                  }}
                  className="px-5 py-3 rounded-xl text-gray-600 font-semibold hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !alocacaoValida}
                  className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {submitting ? "Salvando..." : "Salvar Projeto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabela de projetos */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              Projetos Cadastrados
            </h2>
            <p className="text-sm text-gray-500">
              {loading
                ? "Carregando projetos..."
                : projetos.length > 0
                ? `${projetos.length} projeto${projetos.length > 1 ? "s" : ""} cadastrado${projetos.length > 1 ? "s" : ""}`
                : "Nenhum projeto cadastrado ainda"}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Carregando projetos...</p>
          </div>
        ) : projetos.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <FolderKanban className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-base font-bold text-gray-800 mb-1">
              Nenhum projeto cadastrado
            </h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-5">
              Clique em &quot;Novo Projeto&quot; para cadastrar o primeiro
              projeto e distribuir seu orçamento pelas rubricas ANEEL.
            </p>
            <button
              onClick={() => {
                setShowForm(true);
                setError("");
              }}
              className="btn-primary inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white font-semibold"
            >
              <Plus className="w-5 h-5" />
              Cadastrar Projeto
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3 font-semibold text-gray-600 w-8">
                      <span className="sr-only">Expandir</span>
                    </th>
                    <th className="px-4 py-3 font-semibold text-gray-600">
                      Código
                    </th>
                    <th className="px-4 py-3 font-semibold text-gray-600">
                      Título
                    </th>
                    <th className="px-4 py-3 font-semibold text-gray-600">
                      Início
                    </th>
                    <th className="px-4 py-3 font-semibold text-gray-600">
                      Término
                    </th>
                    <th className="px-4 py-3 font-semibold text-gray-600 text-right">
                      Orçamento Global
                    </th>
                    <th className="px-4 py-3 font-semibold text-gray-600 text-right">
                      Alocado por Rubricas
                    </th>
                    <th className="px-4 py-3 font-semibold text-gray-600 text-center">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {projetos.map((projeto) => {
                    const totalAlocadoProjeto =
                      totalAlocadoPorProjeto(projeto);
                    const expanded = expandedId === projeto.id;

                    return (
                      <FragmentItem
                        key={projeto.id}
                        projeto={projeto}
                        totalAlocadoProjeto={totalAlocadoProjeto}
                        expanded={expanded}
                        deleting={deletingId === projeto.id}
                        onToggleExpand={() =>
                          setExpandedId(expanded ? null : projeto.id)
                        }
                        onEdit={() => handleEdit(projeto)}
                        onDelete={() => handleDelete(projeto)}
                      />
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

interface FragmentItemProps {
  projeto: Projeto;
  totalAlocadoProjeto: number;
  expanded: boolean;
  deleting: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function FragmentItem({
  projeto,
  totalAlocadoProjeto,
  expanded,
  deleting,
  onToggleExpand,
  onEdit,
  onDelete,
}: FragmentItemProps) {
  const percentualGlobal =
    projeto.orcamentoGlobal > 0
      ? (totalAlocadoProjeto / projeto.orcamentoGlobal) * 100
      : 0;

  const alocacaoCompleta =
    Math.abs(totalAlocadoProjeto - projeto.orcamentoGlobal) <= 0.01;

  return (
    <>
      <tr className="border-t border-gray-100 hover:bg-gray-50/60 transition-colors">
        <td className="px-4 py-3">
          <button
            onClick={onToggleExpand}
            className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
            title={expanded ? "Ocultar rubricas" : "Ver rubricas"}
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </td>
        <td className="px-4 py-3">
          <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-bold whitespace-nowrap">
            {projeto.codigo}
          </span>
        </td>
        <td className="px-4 py-3">
          <p className="font-semibold text-gray-800">{projeto.titulo}</p>
          {projeto.descricao && (
            <p className="text-xs text-gray-400 line-clamp-1 max-w-xs">
              {projeto.descricao}
            </p>
          )}
        </td>
        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
          {formatData(projeto.dataInicio)}
        </td>
        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
          {formatData(projeto.dataTermino)}
        </td>
        <td className="px-4 py-3 text-right font-bold text-gray-800 whitespace-nowrap">
          {formatBRL(projeto.orcamentoGlobal)}
        </td>
        <td className="px-4 py-3 text-right whitespace-nowrap">
          <div className="flex flex-col items-end gap-1">
            <span className="font-semibold text-gray-700">
              {formatBRL(totalAlocadoProjeto)}
            </span>
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                alocacaoCompleta
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-orange-50 text-orange-600 border border-orange-200"
              }`}
            >
              {alocacaoCompleta
                ? "Completa"
                : `${percentualGlobal.toFixed(1)}% alocado`}
            </span>
          </div>
        </td>
        <td className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={onEdit}
              className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
              title="Editar projeto"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              disabled={deleting}
              className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
              title="Excluir projeto"
            >
              {deleting ? (
                <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </td>
      </tr>

      {expanded && (
        <tr className="border-t border-gray-100 bg-gray-50/60">
          <td />
          <td colSpan={7}>
            <div className="px-4 py-4">
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-4 py-2.5 font-semibold text-gray-600">
                        Rubrica
                      </th>
                      <th className="px-4 py-2.5 font-semibold text-gray-600">
                        Código ANEEL
                      </th>
                      <th className="px-4 py-2.5 font-semibold text-gray-600 text-right">
                        Valor Previsto
                      </th>
                      <th className="px-4 py-2.5 font-semibold text-gray-600 text-right">
                        % do Orçamento
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {projeto.alocacoes.map((alocacao) => (
                      <tr
                        key={alocacao.rubricaId}
                        className="border-t border-gray-100"
                      >
                        <td className="px-4 py-2.5 text-gray-700">
                          {alocacao.rubricaDescricao}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-bold">
                            {alocacao.rubricaCodigo}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-gray-800">
                          {formatBRL(alocacao.valorPrevisto)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-500">
                          {projeto.orcamentoGlobal > 0
                            ? `${(
                                (alocacao.valorPrevisto /
                                  projeto.orcamentoGlobal) *
                                100
                              ).toFixed(1)}%`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td
                        className="px-4 py-2.5 font-bold text-gray-700"
                        colSpan={2}
                      >
                        Total
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-gray-800">
                        {formatBRL(totalAlocadoProjeto)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-gray-500">
                        {percentualGlobal.toFixed(1)}%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}