const CRAWLERS = [
  "facebookexternalhit",
  "facebot",
  "whatsapp",
  "twitterbot",
  "linkedinbot",
  "slackbot",
  "telegrambot",
  "googlebot",
  "bingbot",
  "applebot",
  "ia_archiver",
  "vkshare",
  "w3c_validator",
  "discordbot",
  "embedly",
  "pinterest",
  "flipboard",
];

export const config = {
  matcher: ["/((?!api|_vercel|favicon\\.jpg|robots\\.txt|sitemap\\.xml|_next).*)"],
};

export default async function middleware(request) {
  const ua = (request.headers.get("user-agent") || "").toLowerCase();
  const isCrawler = CRAWLERS.some((bot) => ua.includes(bot));

  if (!isCrawler) return;

  const url = new URL(request.url);
  const ogEndpoint = new URL("/api/og", url.origin);
  ogEndpoint.searchParams.set("path", url.pathname);

  try {
    const ogRes = await fetch(ogEndpoint.toString());
    const html = await ogRes.text();
    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (_) {
    return;
  }
}
