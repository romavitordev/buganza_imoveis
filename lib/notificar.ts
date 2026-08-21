import "server-only";
import { siteUrl } from "@/lib/site-url";
import { MARCA } from "@/lib/marca";

/**
 * Notificação de lead novo por e-mail, via Resend (https://resend.com —
 * 3.000 e-mails/mês no plano gratuito). Sem SDK: a API é um POST simples.
 *
 * Configuração (.env):
 *   RESEND_API_KEY    — chave da conta Resend. Vazio = notificação desligada
 *                       (o lead continua sendo gravado normalmente).
 *   LEAD_NOTIFY_EMAIL — e-mail do corretor que recebe o aviso.
 *   LEAD_NOTIFY_FROM  — remetente (opcional). Sem domínio verificado no
 *                       Resend, use o padrão onboarding@resend.dev.
 *
 * REGRA DE OURO: notificar é acessório — nenhuma falha aqui pode impedir
 * o lead de ser salvo ou o visitante de receber o "ok".
 */

export interface LeadParaNotificar {
  nome: string;
  whatsapp: string;
  mensagem?: string | null;
  origem?: string | null;
  imovel?: { titulo: string; codigo: string; slug: string } | null;
}

/** Telefone do LEAD, para leitura no e-mail: "5511987654321" → "(11) 98765-4321". */
function formatarWhats(digitos: string): string {
  const local = digitos.startsWith("55") ? digitos.slice(2) : digitos;
  const ddd = local.slice(0, 2);
  const numero = local.slice(2);
  if (numero.length < 8) return digitos;
  return `(${ddd}) ${numero.slice(0, numero.length - 4)}-${numero.slice(-4)}`;
}

function escapeHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function corpoHtml(lead: LeadParaNotificar): string {
  const linhas: string[] = [
    `<p style="margin:0 0 4px"><strong>Nome:</strong> ${escapeHtml(lead.nome)}</p>`,
    `<p style="margin:0 0 4px"><strong>WhatsApp:</strong> ` +
      `<a href="https://wa.me/${lead.whatsapp.startsWith("55") ? lead.whatsapp : `55${lead.whatsapp}`}">` +
      `${formatarWhats(lead.whatsapp)}</a></p>`,
  ];
  if (lead.imovel) {
    linhas.push(
      `<p style="margin:0 0 4px"><strong>Imóvel:</strong> ` +
        `<a href="${siteUrl()}/imoveis/${lead.imovel.slug}">` +
        `${escapeHtml(lead.imovel.titulo)} (${escapeHtml(lead.imovel.codigo)})</a></p>`
    );
  }
  if (lead.mensagem) {
    linhas.push(
      `<p style="margin:12px 0 4px"><strong>Mensagem:</strong></p>` +
        `<blockquote style="margin:0;padding:8px 12px;background:#f4f4f4;border-radius:8px">` +
        `${escapeHtml(lead.mensagem)}</blockquote>`
    );
  }
  if (lead.origem) {
    linhas.push(
      `<p style="margin:12px 0 0;color:#777;font-size:13px">Origem: ${escapeHtml(lead.origem)}</p>`
    );
  }
  return (
    // Cores literais, não tokens do Tailwind: cliente de e-mail não roda CSS
    // do site — o marinho da marca precisa vir escrito no style inline.
    `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#14264A">` +
    `<h2 style="margin:0 0 12px">Novo lead no site 🏠</h2>` +
    linhas.join("") +
    `<p style="margin:16px 0 0"><a href="${siteUrl()}/admin/leads" ` +
    `style="display:inline-block;background:#14264A;color:#fff;padding:10px 18px;` +
    `border-radius:999px;text-decoration:none">Abrir caixa de leads</a></p>` +
    `</div>`
  );
}

/**
 * Envia o aviso de lead novo. Nunca lança: qualquer erro vira log.
 * Retorna true se o e-mail foi aceito pelo Resend.
 */
export async function notificarLeadNovo(
  lead: LeadParaNotificar
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const para = process.env.LEAD_NOTIFY_EMAIL;
  if (!apiKey || !para) {
    // Desligado por configuração — comportamento esperado em dev.
    console.info("[notificar] RESEND_API_KEY/LEAD_NOTIFY_EMAIL ausentes; aviso de lead não enviado.");
    return false;
  }

  const assunto = lead.imovel
    ? `Novo lead: ${lead.nome} — ${lead.imovel.codigo}`
    : `Novo lead: ${lead.nome}`;

  try {
    const resposta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from:
          process.env.LEAD_NOTIFY_FROM ??
          `${MARCA.nome} <onboarding@resend.dev>`,
        to: [para],
        subject: assunto,
        html: corpoHtml(lead),
      }),
      // Aviso não pode segurar a resposta ao visitante indefinidamente.
      signal: AbortSignal.timeout(5000),
    });
    if (!resposta.ok) {
      console.error("[notificar] Resend respondeu", resposta.status, await resposta.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("[notificar] falha ao enviar aviso de lead:", e);
    return false;
  }
}
