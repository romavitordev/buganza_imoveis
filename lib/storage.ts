import { randomUUID } from "crypto";
import path from "path";
import { mkdir, writeFile, unlink } from "fs/promises";

/**
 * Storage de fotos.
 *
 * Produção: Supabase Storage, bucket público "imoveis", upload server-side
 * com a SERVICE_ROLE_KEY (nunca exposta ao cliente).
 *
 * Desenvolvimento sem Supabase: fallback automático para public/uploads,
 * com aviso claro no console. Esse fallback NÃO funciona em produção na
 * Vercel (filesystem efêmero) — configure o Supabase antes do deploy.
 */

const BUCKET = "imoveis";
const LOCAL_PREFIX = "local:";

function supabaseConfig(): { url: string; serviceKey: string } | null {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return { url: url.replace(/\/$/, ""), serviceKey };
}

let avisoFallbackDado = false;

function avisarFallbackLocal() {
  if (avisoFallbackDado) return;
  avisoFallbackDado = true;
  console.warn(
    "\n⚠️  [storage] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY não definidas." +
      "\n   Usando fallback local em public/uploads — isso NÃO funciona em produção na Vercel." +
      "\n   Configure o Supabase Storage antes do deploy.\n"
  );
}

export interface UploadResult {
  url: string;
  storageKey: string;
}

/** Faz upload de uma foto e retorna URL pública + chave de storage. */
export async function uploadPropertyPhoto(
  propertyId: string,
  file: File
): Promise<UploadResult> {
  const ext = extensaoSegura(file);
  const key = `properties/${propertyId}/${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const config = supabaseConfig();

  if (!config) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Storage não configurado: defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY."
      );
    }
    avisarFallbackLocal();
    const localDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "properties",
      propertyId
    );
    await mkdir(localDir, { recursive: true });
    const fileName = path.basename(key);
    await writeFile(path.join(localDir, fileName), buffer);
    return {
      url: `/uploads/properties/${propertyId}/${fileName}`,
      storageKey: `${LOCAL_PREFIX}${key}`,
    };
  }

  const response = await fetch(
    `${config.url}/storage/v1/object/${BUCKET}/${key}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.serviceKey}`,
        "Content-Type": file.type || "application/octet-stream",
        "x-upsert": "false",
      },
      body: buffer,
    }
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Falha no upload para o Supabase (${response.status}): ${body}`
    );
  }

  return {
    url: `${config.url}/storage/v1/object/public/${BUCKET}/${key}`,
    storageKey: key,
  };
}

/** Remove uma foto do storage (Supabase ou fallback local). Não lança em caso de arquivo já ausente. */
export async function deletePropertyPhoto(storageKey: string): Promise<void> {
  // Fotos do seed não têm arquivo real no storage
  if (storageKey.startsWith("seed/")) return;

  if (storageKey.startsWith(LOCAL_PREFIX)) {
    const relative = storageKey.slice(LOCAL_PREFIX.length);
    const filePath = path.join(process.cwd(), "public", "uploads", relative);
    try {
      await unlink(filePath);
    } catch {
      // arquivo já não existe — ok
    }
    return;
  }

  const config = supabaseConfig();
  if (!config) {
    avisarFallbackLocal();
    return;
  }

  const response = await fetch(
    `${config.url}/storage/v1/object/${BUCKET}/${storageKey}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${config.serviceKey}` },
    }
  );

  // 404 = já foi removido; qualquer outro erro é registrado mas não interrompe o fluxo
  if (!response.ok && response.status !== 404) {
    console.error(
      `[storage] Falha ao excluir ${storageKey}: ${response.status}`
    );
  }
}

/** Remove várias fotos do storage, tolerando falhas individuais. */
export async function deletePropertyPhotos(
  storageKeys: string[]
): Promise<void> {
  await Promise.allSettled(storageKeys.map(deletePropertyPhoto));
}

const EXTENSOES_VALIDAS = new Set(["jpg", "jpeg", "png", "webp", "avif", "gif"]);

function extensaoSegura(file: File): string {
  const daMime = file.type.split("/")[1]?.toLowerCase() ?? "";
  if (EXTENSOES_VALIDAS.has(daMime)) return daMime === "jpeg" ? "jpg" : daMime;
  const doNome = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (EXTENSOES_VALIDAS.has(doNome)) return doNome === "jpeg" ? "jpg" : doNome;
  return "jpg";
}
