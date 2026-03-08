import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT || 4173);
const distDir = path.join(__dirname, "dist");

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^0\.0\.0\.0$/,
  /^::1$/,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
];

const isBlockedHostname = (hostname = "") => {
  const value = hostname.trim().toLowerCase();
  if (!value) return true;
  return PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(value));
};

app.get("/api/fetch-feed", async (req, res) => {
  const rawUrl = `${req.query.url || ""}`.trim();
  if (!rawUrl) {
    return res.status(400).json({ error: "Missing url query parameter" });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return res.status(400).json({ error: "Invalid URL" });
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return res.status(400).json({ error: "Only HTTP(S) URLs are allowed" });
  }

  if (isBlockedHostname(parsedUrl.hostname)) {
    return res.status(400).json({ error: "Blocked hostname" });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const upstream = await fetch(parsedUrl.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        Accept:
          "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.5",
        "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
      },
    });

    const body = await upstream.text();
    const upstreamType =
      upstream.headers.get("content-type") || "text/plain; charset=utf-8";

    res.status(upstream.status);
    res.setHeader("content-type", upstreamType);
    res.setHeader("cache-control", "no-store");
    return res.send(body);
  } catch (error) {
    const message =
      error?.name === "AbortError"
        ? "Upstream request timeout"
        : "Upstream request failed";
    return res.status(502).json({ error: message });
  } finally {
    clearTimeout(timeout);
  }
});

app.use(express.static(distDir));

app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
