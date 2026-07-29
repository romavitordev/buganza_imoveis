import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { generateSecret, generateURI, verifySync } from "otplib";
import { toDataURL } from "qrcode";

/**
 * 2FA por TOTP (Google Authenticator, Authy, 1Password…) para o painel.
 *
 * Fluxo: gerar segredo → mostrar QR → usuário confirma o 1º código →
 * `totpAtivadoEm` é gravado e o login passa a exigir o código de 6
 * dígitos além da senha. O segredo NUNCA sai do servidor depois da
 * configuração — o cliente só vê o QR na hora de ativar.
 */

const EMISSOR = "Buganza Imóveis";

/* ---------------- segredo cifrado em repouso ----------------------- */

/**
 * A senha vai para o banco com bcrypt (irreversível), mas o segredo do
 * TOTP NÃO pode ser hasheado: o servidor precisa dele em claro para
 * calcular o código esperado. Guardá-lo em texto puro significa que uma
 * cópia do banco (backup vazado, réplica de leitura, SQL injection de
 * leitura) permite gerar códigos válidos para sempre.
 *
 * Por isso ele é CIFRADO com AES-256-GCM, e a chave deriva do
 * AUTH_SECRET — que mora nas variáveis de ambiente, FORA do banco.
 * Assim um dump sozinho não serve: o atacante precisaria do banco E do
 * segredo do servidor.
 *
 * Formato: "v1:<iv>:<tag>:<dados>" em base64. Valores antigos em texto
 * puro continuam funcionando (migração sem quebra).
 */
const PREFIXO_CIFRADO = "v1:";

function chaveDeCifra(): Buffer {
  const segredo = process.env.AUTH_SECRET;
  if (!segredo) {
    throw new Error("AUTH_SECRET ausente — necessário para cifrar a 2FA.");
  }
  return createHash("sha256").update(segredo).digest();
}

export function cifrarSegredo(claro: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", chaveDeCifra(), iv);
  const dados = Buffer.concat([cipher.update(claro, "utf8"), cipher.final()]);
  return [
    PREFIXO_CIFRADO + iv.toString("base64"),
    cipher.getAuthTag().toString("base64"),
    dados.toString("base64"),
  ].join(":");
}

/**
 * Devolve o segredo em claro. Aceita o formato antigo (texto puro) para
 * não travar quem já tinha 2FA ativa. Null quando a decifragem falha —
 * o chamador trata como "não confere", NUNCA como "pode entrar".
 */
export function decifrarSegredo(guardado: string): string | null {
  if (!guardado.startsWith(PREFIXO_CIFRADO)) return guardado; // legado
  try {
    const [ivB64, tagB64, dadosB64] = guardado
      .slice(PREFIXO_CIFRADO.length)
      .split(":");
    const decipher = createDecipheriv(
      "aes-256-gcm",
      chaveDeCifra(),
      Buffer.from(ivB64, "base64")
    );
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    return (
      decipher.update(Buffer.from(dadosB64, "base64")).toString("utf8") +
      decipher.final("utf8")
    );
  } catch (e) {
    // Acontece se o AUTH_SECRET mudou depois da ativação — ver DEPLOY.md
    console.error("[totp] não foi possível decifrar o segredo:", e);
    return null;
  }
}

export function gerarSegredoTotp(): string {
  return generateSecret();
}

/**
 * Valida um código de 6 dígitos contra o segredo, tolerando o período
 * vizinho (±30s) para relógio levemente fora de hora. Nunca lança.
 */
export function verificarCodigoTotp(codigo: string, segredo: string): boolean {
  const token = codigo.replace(/\D/g, "");
  if (token.length !== 6) return false;
  const agora = Math.floor(Date.now() / 1000);
  for (const epoch of [agora, agora - 30, agora + 30]) {
    try {
      if (verifySync({ secret: segredo, token, epoch }).valid) return true;
    } catch {
      // segredo malformado etc. — segue para o próximo/false
    }
  }
  return false;
}

/** QR code (data URL PNG) do otpauth:// para o app autenticador. */
export async function qrCodeTotp(
  email: string,
  segredo: string
): Promise<string> {
  const otpauth = generateURI({
    issuer: EMISSOR,
    label: email,
    secret: segredo,
  });
  return toDataURL(otpauth, { margin: 1, width: 220 });
}
