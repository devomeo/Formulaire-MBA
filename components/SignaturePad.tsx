"use client";

import { useEffect, useRef } from "react";
import SignaturePadLib from "signature_pad";

type SignaturePadProps = {
  onChange: (dataUrl: string | null) => void;
  initialDataUrl?: string | null;
};

export default function SignaturePad({ onChange, initialDataUrl }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const padRef = useRef<SignaturePadLib | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const pad = new SignaturePadLib(canvasRef.current, {
      backgroundColor: "#ffffff"
    });
    padRef.current = pad;

    if (initialDataUrl) {
      const image = new Image();
      image.onload = () => {
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(image, 0, 0, canvasRef.current!.width, canvasRef.current!.height);
      };
      image.src = initialDataUrl;
    }

    const handle = () => {
      if (pad.isEmpty()) {
        onChange(null);
      } else {
        onChange(pad.toDataURL("image/png"));
      }
    };

    pad.onEnd = handle;
    return () => {
      pad.off();
    };
  }, [initialDataUrl, onChange]);

  const clear = () => {
    padRef.current?.clear();
    onChange(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <canvas
        ref={canvasRef}
        width={400}
        height={160}
        className="w-full rounded border border-slate-300 bg-white"
      />
      <button type="button" className="bg-slate-200 text-slate-700 hover:bg-slate-300" onClick={clear}>
        Effacer la signature
      </button>
    </div>
  );
}
