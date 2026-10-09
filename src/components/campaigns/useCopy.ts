import { useState } from "react";

/** Copia al portapapeles y avisa "Copiado" unos segundos */
export function useCopy() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copy = (text: string, key: string) => {
    try {
      navigator.clipboard.writeText(text);
    } catch {}
    setCopiedKey(key);
    setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 2200);
  };
  return { copiedKey, copy };
}
