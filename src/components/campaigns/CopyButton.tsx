import React from "react";
import { Check, Copy } from "lucide-react";

export const CopyButton: React.FC<{ text: string; id: string; copiedKey: string | null; onCopy: (t: string, id: string) => void; label?: string }> = ({
  text,
  id,
  copiedKey,
  onCopy,
  label = "Copiar",
}) => (
  <button
    type="button"
    onClick={() => onCopy(text, id)}
    className="text-[12px] font-bold text-[#C51172] hover:underline flex items-center gap-1 kol-focus rounded"
  >
    {copiedKey === id ? (
      <>
        <Check className="w-3.5 h-3.5 text-emerald-600" />
        <span className="text-emerald-700">Copiado</span>
      </>
    ) : (
      <>
        <Copy className="w-3.5 h-3.5" />
        <span>{label}</span>
      </>
    )}
  </button>
);
