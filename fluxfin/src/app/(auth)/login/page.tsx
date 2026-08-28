"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { User, Lock, LogIn, Shield, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao fazer login");
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setIsLoading(false);
    }
  };

  return (
    <div className="login-bg min-h-screen flex items-center justify-center p-4 relative">
      <div className="dot-pattern" />

      <div className="login-card w-full max-w-md rounded-2xl shadow-2xl p-8 relative z-10">
        {/* Badge Acesso Restrito */}
        <div className="flex justify-center mb-6">
          <div className="badge-acesso flex items-center gap-2 px-4 py-2 rounded-full">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold tracking-wider text-primary uppercase">
              Acesso Restrito
            </span>
          </div>
        </div>

        {/* Logo */}
        <div className="flex justify-center mb-4">
          <div className="logo-container w-24 h-24 rounded-full flex items-center justify-center overflow-hidden">
            <Image
              src="/logo.png"
              alt="INESC Brasil"
              width={80}
              height={80}
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Título */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Flux<span className="text-primary">Fin</span>
          </h1>
          <p className="text-sm text-gray-500 mt-2 tracking-wide">
            INFORME SUAS CREDENCIAIS DE ACESSO
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campo Email */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <User className="w-5 h-5" />
            </div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-50 text-gray-800 placeholder-gray-400 outline-none"
              required
            />
          </div>

          {/* Campo Senha */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-50 text-gray-800 placeholder-gray-400 outline-none"
              required
            />
          </div>

          {/* Mensagem de Erro */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}

          {/* Botão Entrar */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-3.5 rounded-xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Entrar
              </>
            )}
          </button>
        </form>

        {/* Rodapé */}
        <div className="mt-8 pt-4 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400 tracking-wider">
            V1.0.0 • FluxFin • INESC P&D Brasil
          </p>
        </div>
      </div>
    </div>
  );
}
