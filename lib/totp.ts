import "server-only";
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
