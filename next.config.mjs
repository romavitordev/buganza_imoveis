/** @type {import('next').NextConfig} */

const ehDev = process.env.NODE_ENV !== "production";

/**
 * Content-Security-Policy — a defesa mais forte contra XSS: diz ao
 * navegador de onde ele PODE carregar cada tipo de recurso.
 *
 * Notas do que o site usa:
 *  - script/style inline: Next injeta scripts de hidratação e há JSON-LD
 *    inline (dangerouslySetInnerHTML) → 'unsafe-inline'. Em dev, o HMR do
 *    Next usa eval → 'unsafe-eval' só fora de produção.
 *  - imagens: Supabase (bucket público), picsum (demo), blur em data: URI.
 *  - iframe: só o mapa do Google no detalhe do imóvel.
 *  - fontes: next/font self-hospeda a Inter → font-src 'self'.
 *  - fetch: tudo é same-origin (/api/*) → connect-src 'self'.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${ehDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  // Vídeo do imóvel vem do Supabase (https) ou de /uploads local ('self')
  "media-src 'self' blob: https:",
  "font-src 'self'",
  "connect-src 'self'",
  // Mapa do Google + player do YouTube (domínio nocookie) no detalhe
  "frame-src https://maps.google.com https://www.google.com https://www.youtube-nocookie.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Clickjacking: frame-ancestors (acima) é o moderno; X-Frame-Options
  // cobre navegadores antigos
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Desliga APIs sensíveis que o site não usa
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // HSTS: força HTTPS. Navegadores ignoram em http/localhost, então é
  // seguro deixar ligado sempre; vale de verdade em produção (Vercel)
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

/**
 * No Windows com Node 24+, os workers paralelos do build do Next 14
 * derrubam o processo com STATUS_STACK_BUFFER_OVERRUN (0xC0000409) —
 * `next build` falha antes de gerar as páginas. Rodar em processo único
 * resolve. A condição existe para NÃO penalizar o build da Vercel
 * (Linux + Node LTS), onde o paralelismo funciona e é mais rápido.
 */
const nodeMajor = Number(process.versions.node.split(".")[0]);
const workersInstaveis = process.platform === "win32" && nodeMajor >= 23;

const nextConfig = {
  ...(workersInstaveis
    ? { experimental: { workerThreads: false, cpus: 1 } }
    : {}),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "fastly.picsum.photos",
      },
    ],
  },
  async headers() {
    return [
      {
        // Aplica a todas as rotas
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
