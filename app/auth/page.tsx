// app/auth/page.tsx
"use client";
import { useEffect } from "react";
export default function EnokiAuthRedirect() {
  useEffect(() => {
    const t = setTimeout(() => {
      if (window.opener) window.close();
      else window.location.replace("/");
    }, 300);
    return () => clearTimeout(t);
  }, []);
  return <div className="p-6 text-sm text-muted-foreground">Finalizing Google sign-in…</div>;
}