import React from "react";

export interface DisplayPreviewProps {
  format: "nativo" | "rectangulo" | "banner";
  businessName: string;
  shortHeadline: string;
  longHeadline: string;
  description: string;
  callToAction: string;
  landscapeUrl?: string;
  squareUrl?: string;
  logoUrl?: string;
}

const Img: React.FC<{ url?: string; className?: string; label: string }> = ({ url, className = "", label }) =>
  url ? (
    <img src={url} alt="" className={`object-cover ${className}`} />
  ) : (
    <div className={`grid place-items-center bg-[#E7E3DF] text-[#6A6460] text-[11px] text-center p-2 ${className}`}>{label}</div>
  );

const Logo: React.FC<{ url?: string; name: string; size: number }> = ({ url, name, size }) =>
  url ? (
    <img src={url} alt="" className="object-contain bg-white rounded-full border border-black/10" style={{ width: size, height: size }} />
  ) : (
    <div
      className="rounded-full bg-[#F3F0ED] border border-black/10 grid place-items-center font-bold text-[#46413F] shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      {(name || "K").slice(0, 1).toUpperCase()}
    </div>
  );

/** Aproximaciones de cómo Google puede armar el anuncio. Google decide el formato final según el espacio. */
export const DisplayAdPreview: React.FC<DisplayPreviewProps> = (p) => {
  const cta = p.callToAction && p.callToAction !== "Automático" ? p.callToAction : "Más información";
  if (p.format === "nativo") {
    return (
      <div className="w-[360px] max-w-full mx-auto bg-white border border-[#dadce0] rounded-[8px] overflow-hidden text-[#202124]" style={{ fontFamily: "arial, sans-serif" }}>
        <Img url={p.landscapeUrl} label="Imagen horizontal 1,91:1" className="w-full aspect-[1.91/1]" />
        <div className="p-3">
          <div className="text-[15px] font-bold leading-tight">{p.longHeadline || p.shortHeadline || "Título"}</div>
          <div className="text-[13px] text-[#5f6368] mt-1">{p.description || "Descripción"}</div>
          <div className="flex items-center gap-2 mt-3">
            <Logo url={p.logoUrl} name={p.businessName} size={24} />
            <span className="text-[12px] text-[#5f6368] flex-1 truncate">{p.businessName || "Nombre de empresa"}</span>
            <span className="bg-[#1a73e8] text-white text-[12px] font-semibold rounded px-3 py-1.5">{cta}</span>
          </div>
        </div>
      </div>
    );
  }
  if (p.format === "rectangulo") {
    return (
      <div className="mx-auto bg-white border border-[#dadce0] overflow-hidden relative text-white" style={{ width: 300, height: 250, fontFamily: "arial, sans-serif" }}>
        <Img url={p.squareUrl || p.landscapeUrl} label="Imagen cuadrada 1:1" className="absolute inset-0 w-full h-full" />
        <div className="absolute inset-x-0 bottom-0 bg-[#161418]/90 p-3">
          <div className="text-[14px] font-bold leading-tight">{p.shortHeadline || p.longHeadline || "Título"}</div>
          <div className="flex items-center gap-2 mt-2">
            <Logo url={p.logoUrl} name={p.businessName} size={20} />
            <span className="text-[11px] flex-1 truncate">{p.businessName || "Nombre de empresa"}</span>
            <span className="bg-white text-[#161418] text-[11px] font-bold rounded px-2.5 py-1">{cta}</span>
          </div>
        </div>
        <span className="absolute top-1 right-1 text-[9px] bg-white/90 text-[#5f6368] px-1">Anuncio</span>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <div className="bg-white border border-[#dadce0] flex items-center gap-3 relative" style={{ width: 728, height: 90, fontFamily: "arial, sans-serif" }}>
        <Img url={p.squareUrl || p.landscapeUrl} label="Imagen 1:1" className="w-[90px] h-[90px] shrink-0" />
        <div className="flex-1 min-w-0 text-[#202124]">
          <div className="text-[15px] font-bold leading-tight truncate">{p.longHeadline || p.shortHeadline || "Título"}</div>
          <div className="text-[12px] text-[#5f6368] truncate">{p.description || "Descripción"}</div>
          <div className="flex items-center gap-1.5 mt-1">
            <Logo url={p.logoUrl} name={p.businessName} size={16} />
            <span className="text-[11px] text-[#5f6368] truncate">{p.businessName}</span>
          </div>
        </div>
        <span className="bg-[#1a73e8] text-white text-[13px] font-semibold rounded px-4 py-2 mr-4 whitespace-nowrap">{cta}</span>
        <span className="absolute top-0 right-0 text-[9px] bg-white/90 text-[#5f6368] px-1">Anuncio</span>
      </div>
    </div>
  );
};
