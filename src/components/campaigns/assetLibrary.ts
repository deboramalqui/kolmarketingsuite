import { GalleryAsset } from "../../types/marketing";

const KEY = "kol_campaign_assets_v2";

export function loadAssets(): GalleryAsset[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

/** Devuelve false si no pudo guardar (por ejemplo, espacio del navegador lleno). */
export function saveAssets(assets: GalleryAsset[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(assets));
    return true;
  } catch {
    return false;
  }
}

function readImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen"));
    };
    img.src = url;
  });
}

/**
 * Convierte un archivo en un recurso de la galería. Reduce las fotos grandes
 * (máximo 1600 px de lado) para que entren en el almacenamiento del navegador.
 * Los logos se guardan en PNG para conservar la transparencia.
 */
export async function fileToAsset(file: File, kind: "foto" | "logo"): Promise<GalleryAsset> {
  const img = await readImage(file);
  const maxSide = kind === "foto" ? 1600 : 1200;
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen");
  if (kind === "foto") {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, w, h);
  }
  ctx.drawImage(img, 0, 0, w, h);
  const url = kind === "foto" ? canvas.toDataURL("image/jpeg", 0.85) : canvas.toDataURL("image/png");
  return {
    id: `asset-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: file.name.replace(/\.[^/.]+$/, "") || "Imagen",
    url,
    kind,
    width: w,
    height: h,
    permission: false,
    addedAt: new Date().toISOString().split("T")[0],
  };
}

export type MetaSlot = "meta_191" | "meta_1x1" | "meta_4x5" | "meta_9x16";
export type AssetSlot = "landscape" | "square" | "logoSquare" | "logoWide" | MetaSlot;

interface Fit {
  ok: boolean;
  reason: string;
}

const near = (value: number, target: number, tol: number) => Math.abs(value / target - 1) <= tol;

/** Requisitos de imagen de Google (anuncio de display adaptable) y de Meta. */
export function assetFits(a: GalleryAsset, slot: AssetSlot): Fit {
  const r = a.width / a.height;
  switch (slot) {
    case "landscape":
      if (!near(r, 1.91, 0.06)) return { ok: false, reason: "No es horizontal 1,91:1" };
      if (a.width < 600 || a.height < 314) return { ok: false, reason: "Menor a 600×314" };
      return { ok: true, reason: "Horizontal 1,91:1 correcta" };
    case "square":
      if (!near(r, 1, 0.04)) return { ok: false, reason: "No es cuadrada 1:1" };
      if (a.width < 300) return { ok: false, reason: "Menor a 300×300" };
      return { ok: true, reason: "Cuadrada 1:1 correcta" };
    case "logoSquare":
      if (!near(r, 1, 0.04)) return { ok: false, reason: "No es cuadrada 1:1" };
      if (a.width < 128) return { ok: false, reason: "Menor a 128×128" };
      return { ok: true, reason: "Logo cuadrado correcto" };
    case "logoWide":
      if (!near(r, 4, 0.06)) return { ok: false, reason: "No es 4:1" };
      if (a.width < 512 || a.height < 128) return { ok: false, reason: "Menor a 512×128" };
      return { ok: true, reason: "Logo 4:1 correcto" };
    case "meta_191":
      if (!near(r, 1.91, 0.06)) return { ok: false, reason: "No es horizontal 1,91:1" };
      if (a.width < 600) return { ok: false, reason: "Conviene al menos 600 px de ancho" };
      return { ok: true, reason: "Horizontal 1,91:1 correcta" };
    case "meta_1x1":
      if (!near(r, 1, 0.04)) return { ok: false, reason: "No es cuadrada 1:1" };
      if (a.width < 600) return { ok: false, reason: "Conviene al menos 600×600" };
      return { ok: true, reason: "Cuadrada 1:1 correcta" };
    case "meta_4x5":
      if (!near(r, 0.8, 0.04)) return { ok: false, reason: "No es vertical 4:5" };
      if (a.width < 600) return { ok: false, reason: "Conviene al menos 600 px de ancho" };
      return { ok: true, reason: "Vertical 4:5 correcta" };
    case "meta_9x16":
      if (!near(r, 0.5625, 0.04)) return { ok: false, reason: "No es vertical 9:16" };
      if (a.width < 500) return { ok: false, reason: "Conviene al menos 500 px de ancho" };
      return { ok: true, reason: "Vertical 9:16 correcta" };
  }
}

export function ratioLabel(a: GalleryAsset): string {
  const r = a.width / a.height;
  if (near(r, 1, 0.04)) return "1:1";
  if (near(r, 1.91, 0.06)) return "1,91:1";
  if (near(r, 4, 0.06)) return "4:1";
  if (near(r, 0.8, 0.04)) return "4:5";
  if (near(r, 0.5625, 0.04)) return "9:16";
  return `${r.toFixed(2).replace(".", ",")}:1`;
}

export const META_FORMATS: Array<{ id: "feed_191" | "feed_1x1" | "feed_4x5" | "stories_9x16"; label: string; slot: MetaSlot; ratio: string; hint: string }> = [
  { id: "feed_1x1", label: "Feed cuadrado 1:1", slot: "meta_1x1", ratio: "1 / 1", hint: "Instagram y Facebook · 1080×1080 recomendado" },
  { id: "feed_4x5", label: "Feed vertical 4:5", slot: "meta_4x5", ratio: "4 / 5", hint: "Ocupa más pantalla en el celular · 1080×1350" },
  { id: "feed_191", label: "Feed horizontal 1,91:1", slot: "meta_191", ratio: "1.91 / 1", hint: "Típico de Facebook con enlace · 1200×628" },
  { id: "stories_9x16", label: "Historias y reels 9:16", slot: "meta_9x16", ratio: "9 / 16", hint: "Pantalla completa · 1080×1920" },
];

export const metaFormatInfo = (id?: string) => META_FORMATS.find((f) => f.id === id) ?? META_FORMATS[0];

/** Acciones sobre la galería que se pueden usar sin salir de lo que se está haciendo */
export interface AssetActions {
  add: (file: File, kind: "foto" | "logo") => Promise<{ asset: GalleryAsset; saved: boolean }>;
  update: (id: string, patch: Partial<GalleryAsset>) => void;
}
