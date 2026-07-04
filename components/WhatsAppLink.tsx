"use client";

import type { ReactNode } from "react";
import { enviarEvento } from "@/lib/track";

interface WhatsAppLinkProps {
  href: string;
  /** Slug do imóvel — quando presente, o clique é contabilizado no admin. */
  trackSlug?: string;
  className?: string;
  children: ReactNode;
}

/** Link de WhatsApp que registra o clique como evento de analytics. */
export default function WhatsAppLink({
  href,
  trackSlug,
  className,
  children,
}: WhatsAppLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => {
        if (trackSlug) enviarEvento(trackSlug, "clique_whatsapp");
      }}
    >
      {children}
    </a>
  );
}
