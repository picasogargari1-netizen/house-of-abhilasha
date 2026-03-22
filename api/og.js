const SUPABASE_URL = "https://oxvkxbygniwgcahmmeea.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94dmt4Ynlnbml3Z2NhaG1tZWVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MzIwODYsImV4cCI6MjA4NzAwODA4Nn0.m52n5x3o5TKXWIWuCGiU0DImYFlknLbMlt71j6ZbtzQ";

const SITE_URL = "https://houseofabhilasha.in";
const FAVICON = `${SITE_URL}/favicon.jpg`;

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function buildHtml({ title, description, image, url, type }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />

  <meta property="og:site_name" content="House of Abhilasha" />
  <meta property="og:type" content="${type}" />
  <meta property="og:url" content="${escapeHtml(url)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:locale" content="en_IN" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />

  <meta http-equiv="refresh" content="0; url=${escapeHtml(url)}" />
</head>
<body>
  <a href="${escapeHtml(url)}">${escapeHtml(title)}</a>
</body>
</html>`;
}

export default async function handler(req, res) {
  const reqUrl = new URL(req.url, SITE_URL);
  const path = reqUrl.searchParams.get("path") || "/";

  let title = "House of Abhilasha | Ethnic Indian Clothing & Jewellery";
  let description =
    "Shop handcrafted ethnic Indian clothing and jewellery. Explore Co-Ords, Kurtis, Sarees, Dresses and more.";
  let image = FAVICON;
  let pageUrl = `${SITE_URL}${path}`;
  let type = "website";

  const productMatch = path.match(/^\/product\/([^/]+)$/);

  if (productMatch) {
    const productId = productMatch[1];
    try {
      const apiRes = await fetch(
        `${SUPABASE_URL}/rest/v1/products?id=eq.${encodeURIComponent(productId)}&select=name,description,short_description,price,discounted_price,image_url1,image_url2,image_url3`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
        }
      );
      const rows = await apiRes.json();
      if (Array.isArray(rows) && rows.length > 0) {
        const p = rows[0];
        const displayPrice = p.discounted_price ?? p.price;
        title = `${p.name} | House of Abhilasha`;
        const desc = p.short_description || p.description || "";
        description = desc
          ? `${desc} — ₹${displayPrice}`
          : `Shop ${p.name} at House of Abhilasha — ₹${displayPrice}`;
        const productImage = p.image_url1 || p.image_url2 || p.image_url3;
        if (productImage) image = productImage;
        type = "product";
      }
    } catch (_) {
    }
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.status(200).send(buildHtml({ title, description, image, url: pageUrl, type }));
}
