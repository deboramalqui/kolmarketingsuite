import React from "react";

interface KolLockupProps {
  variant?: "oscuro" | "claro";
  compact?: boolean;
  className?: string;
  showKolPrefix?: boolean;
}

/**
 * Lockup Oficial de KOL Franquicias (Guía de Marca v3, Lámina 2.1).
 * 
 * Regla canónica del manual de marca:
 * - Forma: "Hoja monocromo" (radios 0.75 y 0.2: esquina aguda abajo a la izquierda).
 * - Tipografía: Montserrat 600, letter-spacing 0.32em (tracking extendido).
 * - Relleno: 0.9em vertical, 1.40em horizontal.
 * - Sobre oscuro: caja blanco roto #FAF8F6 con texto negro #161418 (17,28:1 AAA).
 * - Sobre claro: caja negra #161418 con texto roto #FAF8F6 (17,28:1 AAA).
 * - Prohibido: píldora simétrica (óvalo), esquinas iguales o recuadros ordinarios.
 */
export const KolLockup: React.FC<KolLockupProps> = ({
  variant = "oscuro",
  compact = false,
  className = "",
  showKolPrefix = true,
}) => {
  const isDark = variant === "oscuro";

  return (
    <div
      className={`inline-flex items-center justify-center select-none ${className}`}
      role="img"
      aria-label="KOL FRANQUICIAS"
    >
      <div
        className={`font-kol-display font-semibold transition-all inline-flex items-center justify-center ${
          isDark
            ? "bg-[#FAF8F6] text-[#161418]"
            : "bg-[#161418] text-[#FAF8F6]"
        } ${
          compact
            ? "text-[11px] sm:text-[12px] px-[1.25em] py-[0.7em]"
            : "text-[13px] sm:text-[14px] px-[1.40em] py-[0.9em]"
        }`}
        style={{
          letterSpacing: "0.32em",
          borderTopLeftRadius: "0.75em",
          borderTopRightRadius: "0.75em",
          borderBottomRightRadius: "0.75em",
          borderBottomLeftRadius: "0.20em", // Hoja oficial: esquina aguda abajo a la izquierda
        }}
      >
        <span className="uppercase whitespace-nowrap leading-none pl-[0.32em]">
          {showKolPrefix ? "KOL FRANQUICIAS" : "FRANQUICIAS"}
        </span>
      </div>
    </div>
  );
};
