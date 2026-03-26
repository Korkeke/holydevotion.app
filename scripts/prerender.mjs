/**
 * Post-build pre-rendering script.
 * Spins up a local preview server, visits each marketing route with Puppeteer,
 * and saves the fully-rendered HTML so crawlers get real content.
 */
import { preview } from "vite";
import puppeteer from "puppeteer";
import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, "..", "dist");

const ROUTES = ["/", "/features", "/churches", "/privacy", "/terms", "/contact"];

async function prerender() {
  // Start Vite preview server on the built dist folder
  const server = await preview({
    root: resolve(__dirname, ".."),
    preview: { port: 4567, strictPort: true },
  });

  const address = server.resolvedUrls.local[0] || `http://localhost:4567`;
  console.log(`Preview server running at ${address}`);

  // Launch Puppeteer
  const browser = await puppeteer.launch({ headless: true });

  for (const route of ROUTES) {
    const page = await browser.newPage();
    const url = `${address.replace(/\/$/, "")}${route}`;
    console.log(`Pre-rendering: ${url}`);

    await page.goto(url, { waitUntil: "networkidle0", timeout: 15000 });

    // Wait for react-helmet-async to inject meta tags
    await page.waitForFunction(() => {
      const title = document.querySelector("title");
      return title && title.textContent && !title.textContent.includes("Vite");
    }, { timeout: 5000 }).catch(() => {
      console.warn(`  Warning: Helmet meta tags may not have loaded for ${route}`);
    });

    // Additional settle time for animations/content
    await new Promise((r) => setTimeout(r, 1500));

    const html = await page.content();
    await page.close();

    // Write to dist/[route]/index.html
    const outDir = route === "/" ? distDir : resolve(distDir, route.slice(1));
    mkdirSync(outDir, { recursive: true });

    const outFile = resolve(outDir, "index.html");
    writeFileSync(outFile, html, "utf-8");
    console.log(`  Saved: ${outFile}`);
  }

  await browser.close();
  server.httpServer.close();
  console.log("\nPre-rendering complete!");
}

prerender().catch((err) => {
  console.error("Pre-rendering failed:", err);
  process.exit(1);
});
