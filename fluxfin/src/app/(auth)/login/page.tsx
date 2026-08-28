"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { User, Lock, LogIn, Shield, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    <div className="login-bg min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dots decorativos animados */}
      <div className="absolute inset-0 pointer-events-none">
        {[
          { top: "10%", left: "8%", size: 6, delay: "0s", opacity: 0.15 },
          { top: "25%", left: "15%", size: 4, delay: "1s", opacity: 0.1 },
          { top: "70%", left: "5%", size: 5, delay: "2s", opacity: 0.12 },
          { top: "85%", left: "12%", size: 4, delay: "0.5s", opacity: 0.1 },
          { top: "15%", right: "10%", size: 5, delay: "1.5s", opacity: 0.12 },
          { top: "60%", right: "8%", size: 6, delay: "0.8s", opacity: 0.15 },
          { top: "40%", right: "15%", size: 4, delay: "2.5s", opacity: 0.1 },
          { top: "80%", right: "20%", size: 5, delay: "1.2s", opacity: 0.12 },
          { top: "50%", left: "20%", size: 3, delay: "3s", opacity: 0.08 },
          { top: "35%", left: "3%", size: 4, delay: "0.3s", opacity: 0.1 },
        ].map((dot, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-primary animate-pulse"
            style={{
              top: dot.top,
              left: dot.left,
              right: dot.right,
              width: dot.size,
              height: dot.size,
              opacity: dot.opacity,
              animationDelay: dot.delay,
              animationDuration: "3s",
            }}
          />
        ))}
      </div>

      <div
        className={`login-card w-full max-w-md rounded-2xl shadow-2xl p-8 relative z-10 transition-all duration-700 ease-out ${
          mounted
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8"
        }`}
      >
        {/* Badge Acesso Restrito */}
        <div className="flex justify-center mb-6">
          <div
            className={`badge-acesso flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-500 delay-200 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
            }`}
          >
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold tracking-wider text-primary uppercase">
              Acesso Restrito
            </span>
          </div>
        </div>

        {/* Logo */}
        <div className="flex justify-center mb-4">
          <div
            className={`logo-container w-24 h-24 rounded-full flex items-center justify-center overflow-hidden transition-all duration-700 delay-300 ${
              mounted ? "opacity-100 scale-100" : "opacity-0 scale-75"
            }`}
          >
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
        <div
          className={`text-center mb-6 transition-all duration-600 delay-400 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
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
          <div
            className={`relative transition-all duration-500 delay-500 ${
              mounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6"
            }`}
          >
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
          <div
            className={`relative transition-all duration-500 delay-[600ms] ${
              mounted ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6"
            }`}
          >
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
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 animate-[shake_0.3s_ease-in-out]">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}

          {/* Botão Entrar */}
          <div
            className={`transition-all duration-500 delay-700 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
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
          </div>
        </form>

        {/* Rodapé */}
        <div
          className={`mt-8 pt-4 border-t border-gray-100 text-center transition-all duration-500 delay-[800ms] ${
            mounted ? "opacity-100" : "opacity-0"
          }`}
        >
          <p className="text-xs text-gray-400 tracking-wider">
            V1.0.0 • FluxFin • INESC P&D Brasil
          </p>
        </div>
      </div>
    </div>
  );
}
