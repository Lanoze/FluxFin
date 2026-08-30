export const formatBRL = (valor: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);

export const formatData = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { timeZone: "UTC" });

export const mesCurto = (mes: string) => {
  const [ano, indice] = mes.split("-").map(Number);
  const label = new Date(ano, indice - 1, 1)
    .toLocaleDateString("pt-BR", { month: "short" })
    .replace(".", "");
  return `${label}/${String(ano).slice(2)}`;
};

export const dataAtualPorExtenso = () =>
  new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });