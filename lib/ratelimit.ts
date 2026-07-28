/**
 * Rate limit com dois backends:
 *
 *  - Upstash Redis (REST) quando UPSTASH_REDIS_REST_URL/TOKEN existem —
 *    DURÁVEL: sobrevive a reinício e vale entre todas as instâncias
 *    serverless (o que a Vercel exige para o limite ser real).
 *  - Memória (Map) como fallback — suficiente em desenvolvimento.
 *
 * Uso: `await limitar("login:" + ip, 5, 15 * 60_000)`.
 * Falha do Redis NUNCA derruba a rota: loga e deixa passar (fail-open) —
 * indisponibilidade não pode virar negação de serviço para visitantes.
 */

export interface RateLimitResult {
  permitido: boolean;
  restantes: number;
  liberaEmSegundos: number;
}

/* ---------------------- backend: memória (dev) ---------------------- */

interface Registro {
  total: number;
  inicioJanela: number;
}

const registros = new Map<string, Registro>();

function limitarMemoria(
  chave: string,
  max: number,
  janelaMs: number
): RateLimitResult {
  const agora = Date.now();

  // Limpeza oportunista de registros expirados
  if (registros.size > 1000) {
    Array.from(registros.entries()).forEach(([k, v]) => {
      if (agora - v.inicioJanela > janelaMs) registros.delete(k);
    });
  }

  const registro = registros.get(chave);
  if (!registro || agora - registro.inicioJanela > janelaMs) {
    registros.set(chave, { total: 1, inicioJanela: agora });
    return { permitido: true, restantes: max - 1, liberaEmSegundos: 0 };
  }

  registro.total++;
  if (registro.total > max) {
    const liberaEm = Math.ceil(
      (registro.inicioJanela + janelaMs - agora) / 1000
    );
    return { permitido: false, restantes: 0, liberaEmSegundos: liberaEm };
  }
  return {
    permitido: true,
    restantes: max - registro.total,
    liberaEmSegundos: 0,
  };
}

/* ---------------------- backend: Upstash (prod) --------------------- */

function upstashConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

async function limitarUpstash(
  chave: string,
  max: number,
  janelaMs: number,
  cfg: { url: string; token: string }
): Promise<RateLimitResult> {
  // Pipeline atômico o bastante para rate limit:
  //   INCR conta a tentativa; PEXPIRE ... NX arma o TTL só na primeira
  //   (Redis >= 7, padrão no Upstash); PTTL informa quanto falta.
  const resposta = await fetch(`${cfg.url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", chave],
      ["PEXPIRE", chave, String(janelaMs), "NX"],
      ["PTTL", chave],
    ]),
    signal: AbortSignal.timeout(3000),
    cache: "no-store",
  });
  if (!resposta.ok) {
    throw new Error(`Upstash ${resposta.status}`);
  }
  const corpo = (await resposta.json()) as { result?: unknown }[];
  const total = Number(corpo[0]?.result ?? 1);
  const ttlMs = Number(corpo[2]?.result ?? janelaMs);

  if (total > max) {
    return {
      permitido: false,
      restantes: 0,
      liberaEmSegundos: Math.max(1, Math.ceil(ttlMs / 1000)),
    };
  }
  return {
    permitido: true,
    restantes: Math.max(0, max - total),
    liberaEmSegundos: 0,
  };
}

/* ----------------------------- API ---------------------------------- */

/**
 * Conta uma tentativa para `chave` e diz se ela é permitida dentro da
 * janela. Chaves têm o formato "contexto:ip" (ex.: "login:1.2.3.4").
 */
export async function limitar(
  chave: string,
  max: number,
  janelaMs: number
): Promise<RateLimitResult> {
  const cfg = upstashConfig();
  if (!cfg) return limitarMemoria(chave, max, janelaMs);
  try {
    return await limitarUpstash(chave, max, janelaMs, cfg);
  } catch (e) {
    // Fail-open: Redis fora do ar não pode bloquear visitantes legítimos
    console.error("[ratelimit] Upstash indisponível; liberando:", e);
    return { permitido: true, restantes: 1, liberaEmSegundos: 0 };
  }
}

/** Zera o contador (ex.: login bem-sucedido). Nunca lança. */
export async function liberar(chave: string): Promise<void> {
  registros.delete(chave);
  const cfg = upstashConfig();
  if (!cfg) return;
  try {
    await fetch(`${cfg.url}/del/${encodeURIComponent(chave)}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.token}` },
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
    });
  } catch (e) {
    console.error("[ratelimit] falha ao liberar chave:", e);
  }
}

export function ipDaRequisicao(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "ip-desconhecido";
}
