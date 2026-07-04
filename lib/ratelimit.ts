/**
 * Rate limit em memória para o login do admin:
 * 5 tentativas por IP a cada 15 minutos.
 *
 * Suficiente para um app de instância única (Vercel serverless reinicia
 * a memória com frequência, mas ainda barra ataques de força bruta simples).
 */

const JANELA_MS = 15 * 60 * 1000;
const MAX_TENTATIVAS = 5;

interface Registro {
  tentativas: number;
  inicioJanela: number;
}

const registros = new Map<string, Registro>();

export interface RateLimitResult {
  permitido: boolean;
  restantes: number;
  liberaEmSegundos: number;
}

export function verificarRateLimit(ip: string): RateLimitResult {
  const agora = Date.now();
  const registro = registros.get(ip);

  // Limpeza oportunista de registros expirados
  if (registros.size > 1000) {
    Array.from(registros.entries()).forEach(([chave, valor]) => {
      if (agora - valor.inicioJanela > JANELA_MS) registros.delete(chave);
    });
  }

  if (!registro || agora - registro.inicioJanela > JANELA_MS) {
    registros.set(ip, { tentativas: 1, inicioJanela: agora });
    return { permitido: true, restantes: MAX_TENTATIVAS - 1, liberaEmSegundos: 0 };
  }

  registro.tentativas++;

  if (registro.tentativas > MAX_TENTATIVAS) {
    const liberaEm = Math.ceil(
      (registro.inicioJanela + JANELA_MS - agora) / 1000
    );
    return { permitido: false, restantes: 0, liberaEmSegundos: liberaEm };
  }

  return {
    permitido: true,
    restantes: MAX_TENTATIVAS - registro.tentativas,
    liberaEmSegundos: 0,
  };
}

/** Zera o contador de um IP após login bem-sucedido. */
export function limparRateLimit(ip: string): void {
  registros.delete(ip);
}

export function ipDaRequisicao(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "ip-desconhecido";
}
