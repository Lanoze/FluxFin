"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function SplashPage() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        fetch("/api/auth/me")
          .then((res) => {
            if (res.ok) return router.push("/dashboard");
            router.push("/login");
          })
          .catch(() => router.push("/login"));
      }, 400);
    }, 2500);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [router]);

  return (
    <div
      className={`min-h-screen login-bg flex flex-col items-center justify-center transition-opacity duration-400 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Logo */}
      <div className="mb-6">
        <div className="w-32 h-32 rounded-full bg-white/80 border-2 border-primary/15 flex items-center justify-center shadow-lg">
          <Image
            src="/logo.png"
            alt="INESC Brasil"
            width={100}
            height={100}
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Título */}
      <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-800 mb-2">
        Flux<span className="text-primary">Fin</span>
      </h1>

      {/* Subtítulo */}
      <p className="text-sm sm:text-base text-gray-500 tracking-wider text-center max-w-md px-4 mt-2">
        Sistema de Controle Financeiro P&D+I
      </p>

      {/* Barra de progresso */}
      <div className="mt-10 w-48">
        <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary-dark rounded-full transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Créditos */}
      <div className="absolute bottom-6">
        <p className="text-xs text-gray-400 tracking-wider">
          V1.0.0 • INESC P&D Brasil
        </p>
      </div>
    </div>
  );
}
