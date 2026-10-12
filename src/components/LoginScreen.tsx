import React from "react";
import { KolLockup } from "./KolLockup";

export const LoginScreen: React.FC<{ error?: string | null }> = ({ error }) => (
  <div className="min-h-screen bg-[#161418] text-[#FAF8F6] flex items-center justify-center p-6">
    <div className="w-full max-w-md space-y-6">
      <KolLockup variant="oscuro" compact />
      <h1 className="font-kol-display font-extrabold text-[26px] leading-tight">KOL Marketing Suite</h1>
      <p className="text-[16px] text-[#C9C3BE] leading-snug">
        Entrá con tu cuenta de Google. Solo pueden pasar las personas que tienen acceso: si todavía no tenés, pedíselo a quien administra la app.
      </p>
      {error && (
        <div className="p-3.5 border-2 border-[#FAF8F6] rounded-[10px] text-[14px] font-semibold flex items-start gap-2" role="alert">
          <span aria-hidden="true" className="font-bold">!</span>
          <span>{error}</span>
        </div>
      )}
      <a
        href="/auth/login"
        className="kol-btn-normal inline-flex items-center px-6 bg-[#FFBA00] text-[#161418] hover:bg-[#FFCB3D] font-bold kol-focus-dark"
      >
        Entrar con Google
      </a>
      <p className="text-[14px] text-[#C9C3BE]">No usamos contraseñas propias: la seguridad de tu cuenta es la de Google.</p>
    </div>
  </div>
);
