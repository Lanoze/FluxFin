"use client";

import { useState, useEffect } from "react";
import {
  FolderKanban,
  DollarSign,
  TrendingDown,
  Wallet,
} from "lucide-react";

const stats = [
  {
    label: "Total de Projetos",
    value: "12",
    icon: FolderKanban,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    label: "Orçamento Global",
    value: "R$ 2.450.000",
    icon: DollarSign,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    label: "Despesas do Mês",
    value: "R$ 187.500",
    icon: TrendingDown,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    label: "Saldo Remanescente",
    value: "R$ 1.820.300",
    icon: Wallet,
    color: "text-primary",
    bg: "bg-primary/5",
  },
];

export default function DashboardPage() {
  const [userName, setUserName] = useState("...");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setUserName(data.nome || "..."))
      .catch(() => setUserName("..."));
  }, []);

  return (
    <div>
      {/* Hero Banner */}
      <div className="hero-banner relative overflow-hidden">
        {/* Background pattern */}
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
            {/* Network lines */}
            <line x1="100" y1="100" x2="250" y2="150" stroke="#0d9488" strokeWidth="1" opacity="0.4" />
            <line x1="250" y1="150" x2="400" y2="100" stroke="#0d9488" strokeWidth="1" opacity="0.4" />
            <line x1="400" y1="100" x2="550" y2="180" stroke="#0d9488" strokeWidth="1" opacity="0.4" />
            <line x1="550" y1="180" x2="700" y2="120" stroke="#0d9488" strokeWidth="1" opacity="0.4" />
            <line x1="150" y1="250" x2="300" y2="200" stroke="#0d9488" strokeWidth="1" opacity="0.4" />
            <line x1="300" y1="200" x2="500" y2="280" stroke="#0d9488" strokeWidth="1" opacity="0.4" />
            <line x1="500" y1="280" x2="650" y2="220" stroke="#0d9488" strokeWidth="1" opacity="0.4" />
            <line x1="200" y1="300" x2="350" y2="320" stroke="#0d9488" strokeWidth="1" opacity="0.3" />
            <line x1="350" y1="320" x2="550" y2="350" stroke="#0d9488" strokeWidth="1" opacity="0.3" />
            {/* Nodes */}
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

        {/* Floating words */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <span className="absolute top-8 left-[10%] text-primary/20 text-2xl font-bold rotate-[-8deg]">
            Tecnologia
          </span>
          <span className="absolute top-[40%] left-[5%] text-primary/15 text-xl font-bold rotate-[-5deg]">
            Projeto
          </span>
          <span className="absolute bottom-[20%] left-[8%] text-primary/20 text-lg font-bold rotate-[-3deg]">
            Contrato
          </span>
          <span className="absolute bottom-8 left-[35%] text-primary/20 text-2xl font-bold">
            Inovação
          </span>
          <span className="absolute top-[30%] right-[8%] text-primary/15 text-xl font-bold rotate-[5deg]">
            Ciência
          </span>
          <span className="absolute bottom-[30%] right-[12%] text-primary/10 text-lg font-bold rotate-[3deg]">
            P&D+I
          </span>
        </div>

        {/* Content */}
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

      {/* Cards de Resumo */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}
                >
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <p className="text-xl font-bold text-gray-800">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Seção inferior */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 sm:p-10 text-white">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            CONTROLE FINANCEIRO P&D+I
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Rede <span className="text-primary-light">INESC Brasil</span>
          </h2>

          <p className="text-white/70 max-w-3xl leading-relaxed">
            O <strong className="text-white">FluxFin</strong> é um sistema desenvolvido para{" "}
            <strong className="text-white">controle financeiro</strong> de projetos de{" "}
            <strong className="text-white">Pesquisa, Desenvolvimento e Inovação (P&D+I)</strong>,
            atendendo às exigências normativas da ANEEL para alocação e execução
            orçamentária por rubricas.
          </p>
        </div>
      </div>
    </div>
  );
}
