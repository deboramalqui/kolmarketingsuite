import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

/**
 * Confirmación accesible (reemplaza a window.confirm): rol alertdialog, foco atrapado, Escape cancela,
 * el foco vuelve al botón que la abrió. Se usa con: const confirm = useConfirm(); if (!(await confirm({ message }))) return;
 */
export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}
type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn>(async () => false);
export const useConfirm = () => useContext(ConfirmContext);

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pending, setPending] = useState<{ opts: ConfirmOptions; resolve: (v: boolean) => void } | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const okRef = useRef<HTMLButtonElement>(null);

  const confirm = useCallback<ConfirmFn>(
    (opts) =>
      new Promise<boolean>((resolve) => {
        opener.current = document.activeElement as HTMLElement | null;
        setPending({ opts, resolve });
      }),
    []
  );

  const close = (value: boolean) => {
    pending?.resolve(value);
    setPending(null);
    setTimeout(() => opener.current?.focus?.(), 0);
  };

  useEffect(() => {
    if (!pending) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close(false);
      } else if (e.key === "Tab") {
        const order = [cancelRef.current, okRef.current].filter(Boolean) as HTMLElement[];
        const i = order.indexOf(document.activeElement as HTMLElement);
        e.preventDefault();
        order[(i + (e.shiftKey ? order.length - 1 : 1)) % order.length]?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#161418]/70" onClick={() => close(false)} aria-hidden="true" />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="kol-confirm-title"
            aria-describedby="kol-confirm-msg"
            className="relative w-full max-w-md bg-[#FFFFFF] border border-[#C9C3BE] rounded-[12px] p-6 space-y-5 shadow-xl"
          >
            <h2 id="kol-confirm-title" className="font-kol-display font-bold text-[18px] text-[#161418]">
              {pending.opts.title ?? "Confirmá la acción"}
            </h2>
            <p id="kol-confirm-msg" className="text-[16px] text-[#46413F] leading-snug">
              {pending.opts.message}
            </p>
            <div className="flex flex-wrap justify-end gap-3">
              <button
                ref={cancelRef}
                type="button"
                onClick={() => close(false)}
                className="kol-btn-normal px-5 bg-[#FFFFFF] text-[#161418] border border-[#8C8580] hover:bg-[#F3F0ED]"
              >
                {pending.opts.cancelLabel ?? "Cancelar"}
              </button>
              <button
                ref={okRef}
                type="button"
                onClick={() => close(true)}
                className="kol-btn-normal px-5 bg-[#C51172] text-[#FFFFFF] hover:bg-[#A40F5F]"
              >
                {pending.opts.confirmLabel ?? "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};
