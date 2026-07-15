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
  "font-src 'self'",
  "connect-src 'self'",
  "frame-src https://maps.google.com https://www.google.com",
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

const nextConfig = {
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
