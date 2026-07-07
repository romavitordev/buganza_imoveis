import type { ReactNode } from "react";

interface WhatsAppLinkProps {
  /** Caminho interno /api/contato — o servidor monta o número e redireciona. */
  href: string;
  className?: string;
  children: ReactNode;
}

/**
 * Link de contato do WhatsApp. Aponta para a rota interna /api/contato,
 * que redireciona ao WhatsApp no servidor (o número nunca vai ao cliente).
 * O clique é contabilizado no servidor — sem beacon, sem contagem dupla.
 */
export default function WhatsAppLink({
  href,
  className,
  children,
}: WhatsAppLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
    </a>
  );
}
