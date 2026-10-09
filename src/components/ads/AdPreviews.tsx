import React from "react";
import { Globe, Heart, MessageCircle, Send, Bookmark, ThumbsUp, Share2, MoreHorizontal, ChevronRight } from "lucide-react";
import { KolLockup } from "../KolLockup";
import { GOOGLE_LIMITS, META_PRIMARY_VISIBLE_CHARS } from "./adChecks";
import { MetaFormat } from "../../types/marketing";
import { metaFormatInfo } from "../campaigns/assetLibrary";

/** Foto de perfil circular: solo la hoja (isotipo) de KOL. El lockup ancho no entra en un círculo. */
export const KolAvatar: React.FC<{ theme: "claro" | "oscuro"; size?: number }> = ({ theme, size = 36 }) => {
  const stroke = theme === "claro" ? "#161418" : "#FAF8F6";
  return (
    <div
      className="rounded-full shrink-0 flex items-center justify-center overflow-hidden border border-black/10"
      style={{ width: size, height: size, background: theme === "claro" ? "#FFFFFF" : "#161418" }}
      aria-hidden="true"
    >
      <svg viewBox="-10 -10 450 430" width="68%" height="68%">
        <g transform="translate(145,225) rotate(-24.5)">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M -32 -162 H 32 A 54 54 0 0 1 86 -108 V 108 A 54 54 0 0 1 32 162 H -32 A 54 54 0 0 1 -86 108 V -108 A 54 54 0 0 1 -32 -162 Z M -28 -130 H 28 A 26 26 0 0 1 54 -104 V 104 A 26 26 0 0 1 28 130 H -28 A 26 26 0 0 1 -54 104 V -104 A 26 26 0 0 1 -28 -130 Z"
            fill={stroke}
          />
        </g>
        <g transform="translate(123,224) rotate(21.5)">
          <path
            d="M 0 0 L 0 -184 A 56 56 0 0 1 56 -240 L 102 -240 A 56 56 0 0 1 158 -184 L 158 -136 L 230 -136 A 56 56 0 0 1 286 -80 L 286 -56 A 56 56 0 0 1 230 0 L 0 0 Z"
            fill="#EA1573"
          />
        </g>
      </svg>
    </div>
  );
};

function cut(text: string, n: number) {
  if (text.length <= n) return { shown: text, cut: false };
  return { shown: text.slice(0, n).replace(/\s+\S*$/, "") + "…", cut: true };
}

export interface MetaPreviewProps {
  placement: "instagram" | "facebook";
  format?: MetaFormat;
  pageName: string;
  avatarTheme: "claro" | "oscuro";
  primaryText: string;
  headline: string;
  description: string;
  callToAction: string;
  domain: string;
  mediaUrl: string;
  showSeal: boolean;
  sealVariant: "claro" | "oscuro";
}

const Media: React.FC<{ url: string; ratio: string; seal: boolean; sealVariant: "claro" | "oscuro" }> = ({ url, ratio, seal, sealVariant }) => (
  <div className="relative bg-[#E7E3DF] overflow-hidden" style={{ aspectRatio: ratio }}>
    {url ? (
      <img src={url} alt="Imagen del anuncio" className="absolute inset-0 w-full h-full object-cover" />
    ) : (
      <div className="absolute inset-0 grid place-items-center text-[13px] text-[#6A6460] text-center p-4">
        Elegí o subí una imagen para el anuncio
      </div>
    )}
    {seal && (
      <div className="absolute left-3 bottom-3 drop-shadow-md">
        <KolLockup variant={sealVariant} compact />
      </div>
    )}
  </div>
);

export const MetaAdPreview: React.FC<MetaPreviewProps> = (p) => {
  const text = cut(p.primaryText, META_PRIMARY_VISIBLE_CHARS);
  const name = p.pageName || "Nombre de la página";
  const ratio = metaFormatInfo(p.format).ratio;

  if (p.format === "stories_9x16") {
    return (
      <div className="relative w-[270px] max-w-full mx-auto rounded-[14px] overflow-hidden bg-[#161418] text-white" style={{ aspectRatio: "9 / 16", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        {p.mediaUrl ? (
          <img src={p.mediaUrl} alt="Imagen del anuncio" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-[12px] text-[#C9C3BE] text-center p-6">Elegí o subí una imagen vertical 9:16</div>
        )}
        <div className="absolute top-0 inset-x-0 p-3 bg-gradient-to-b from-black/50 to-transparent">
          <div className="h-[2px] bg-white/40 rounded mb-2"><div className="h-full w-1/3 bg-white rounded" /></div>
          <div className="flex items-center gap-2">
            <KolAvatar theme={p.avatarTheme} size={28} />
            <div className="leading-tight">
              <div className="text-[13px] font-semibold">{name}</div>
              <div className="text-[11px] text-white/80">Publicidad</div>
            </div>
          </div>
        </div>
        {p.showSeal && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 drop-shadow-md">
            <KolLockup variant={p.sealVariant} compact />
          </div>
        )}
        <div className="absolute bottom-0 inset-x-0 p-3 pt-10 bg-gradient-to-t from-black/60 to-transparent text-center">
          <div className="text-[11px] mb-1">⌃</div>
          <div className="inline-block bg-white text-[#161418] text-[12.5px] font-semibold rounded-full px-4 py-1.5">{p.callToAction}</div>
        </div>
      </div>
    );
  }

  if (p.placement === "instagram") {
    return (
      <div
        className="w-full max-w-[375px] mx-auto bg-white border border-[#dbdbdb] rounded-[4px] text-[#262626]"
        style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
      >
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          <KolAvatar theme={p.avatarTheme} size={34} />
          <div className="leading-tight">
            <div className="text-[14px] font-semibold">{name}</div>
            <div className="text-[12px] text-[#737373]">Publicidad</div>
          </div>
          <MoreHorizontal className="w-5 h-5 ml-auto" aria-hidden="true" />
        </div>
        <Media url={p.mediaUrl} ratio={ratio} seal={p.showSeal} sealVariant={p.sealVariant} />
        <div className="flex items-center justify-between bg-[#0095f6] text-white text-[14px] font-semibold px-3 py-2.5">
          <span>{p.callToAction}</span>
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </div>
        <div className="flex items-center gap-3.5 px-3 pt-2.5 pb-1" aria-hidden="true">
          <Heart className="w-6 h-6" />
          <MessageCircle className="w-6 h-6" />
          <Send className="w-6 h-6" />
          <Bookmark className="w-6 h-6 ml-auto" />
        </div>
        <p className="px-3 pb-3.5 pt-0.5 text-[14px] leading-snug">
          <span className="font-semibold">{name}</span> {text.shown}
          {text.cut && <span className="text-[#737373]"> más</span>}
        </p>
      </div>
    );
  }

  return (
    <div
      className="w-full max-w-[500px] mx-auto bg-white rounded-[8px] shadow text-[#050505]"
      style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
    >
      <div className="flex items-center gap-2.5 px-4 pt-3 pb-2">
        <KolAvatar theme={p.avatarTheme} size={40} />
        <div className="leading-tight">
          <div className="text-[15px] font-semibold">{name}</div>
          <div className="text-[13px] text-[#65676b] flex items-center gap-1">
            Publicidad · <Globe className="w-3 h-3" aria-hidden="true" />
          </div>
        </div>
        <MoreHorizontal className="w-5 h-5 ml-auto text-[#65676b]" aria-hidden="true" />
      </div>
      <p className="px-4 pb-3 text-[15px] leading-snug whitespace-pre-wrap">
        {text.shown}
        {text.cut && <span className="text-[#65676b] font-semibold"> Ver más</span>}
      </p>
      <Media url={p.mediaUrl} ratio={ratio} seal={p.showSeal} sealVariant={p.sealVariant} />
      <div className="flex items-center gap-3 bg-[#f0f2f5] px-4 py-2.5">
        <div className="flex-1 min-w-0">
          <div className="text-[12.5px] text-[#65676b] uppercase truncate">{p.domain}</div>
          <div className="text-[16px] font-semibold leading-tight truncate">{p.headline}</div>
          <div className="text-[14px] text-[#65676b] truncate">{p.description}</div>
        </div>
        <span className="bg-[#e4e6eb] text-[14px] font-semibold rounded-[6px] px-3.5 py-2 whitespace-nowrap">{p.callToAction}</span>
      </div>
      <div className="flex justify-around mx-4 border-t border-[#ced0d4] py-2 text-[14px] text-[#65676b] font-semibold" aria-hidden="true">
        <span className="flex items-center gap-1.5"><ThumbsUp className="w-4 h-4" /> Me gusta</span>
        <span className="flex items-center gap-1.5"><MessageCircle className="w-4 h-4" /> Comentar</span>
        <span className="flex items-center gap-1.5"><Share2 className="w-4 h-4" /> Compartir</span>
      </div>
      <div className="h-1.5" />
    </div>
  );
};

export interface GooglePreviewProps {
  domain: string;
  path1: string;
  path2: string;
  headlines: string[];
  descriptions: string[];
  sitelinks: Array<{ title: string; line1: string; line2: string }>;
  callouts: string[];
  device: "desktop" | "mobile";
  /** 0 = los primeros; otro valor = otra combinación, para ver cómo Google mezcla */
  seed: number;
}

function pick<T>(arr: T[], n: number, seed: number): T[] {
  if (seed === 0) return arr.slice(0, n);
  const r = arr.slice();
  let s = seed;
  for (let i = r.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r.slice(0, n);
}

export const GoogleSearchAdPreview: React.FC<GooglePreviewProps> = (p) => {
  const hs = pick(p.headlines.filter((h) => h.trim()), 3, p.seed);
  const ds = pick(p.descriptions.filter((d) => d.trim()), 2, p.seed);
  const sls = p.sitelinks.filter((s) => s.title.trim());
  const cos = p.callouts.filter((c) => c.trim());
  const url = `${p.domain}${p.path1 ? ` › ${p.path1}` : ""}${p.path2 ? ` › ${p.path2}` : ""}`;
  const mobile = p.device === "mobile";
  const withDesc = sls.some((s) => s.line1 || s.line2);

  return (
    <div
      className={`bg-white border border-[#dadce0] rounded-[12px] text-[#202124] ${mobile ? "max-w-[390px] p-3.5" : "p-5"} mx-auto`}
      style={{ fontFamily: "arial, sans-serif" }}
    >
      <div className="flex items-center gap-2.5 mb-1">
        <div className="w-7 h-7 rounded-full bg-[#f1f3f4] grid place-items-center text-[12px] font-bold shrink-0">K</div>
        <div className="leading-tight min-w-0">
          <div className="text-[14px]"><span className="font-bold text-[12px]">Patrocinado</span> · {p.domain}</div>
          <div className="text-[12px] text-[#4d5156] truncate">{url}</div>
        </div>
      </div>
      <div className={`text-[#1a0dab] leading-snug my-1 ${mobile ? "text-[18px]" : "text-[20px]"}`}>
        {hs.length ? hs.join(" | ") : "Tu título aparece acá"}
      </div>
      <div className="text-[14px] leading-relaxed text-[#4d5156]">
        {ds.length ? ds.join(" ") : "Tu descripción aparece acá."}
      </div>
      {cos.length > 0 && <div className="text-[13px] text-[#4d5156] mt-2">{cos.join(" · ")}</div>}
      {sls.length > 0 &&
        (withDesc && !mobile ? (
          <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 mt-2.5">
            {sls.slice(0, 4).map((s, i) => (
              <div key={i}>
                <div className="text-[14px] text-[#1a0dab]">{s.title}</div>
                <div className="text-[13px] text-[#4d5156]">{[s.line1, s.line2].filter(Boolean).join(" · ")}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-2.5">
            {sls.slice(0, mobile ? 3 : 4).map((s, i) => (
              <span key={i} className="text-[14px] text-[#1a0dab]">{s.title}</span>
            ))}
          </div>
        ))}
    </div>
  );
};

export { GOOGLE_LIMITS };
