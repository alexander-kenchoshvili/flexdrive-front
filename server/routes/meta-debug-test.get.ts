import { defineEventHandler, setHeader } from "h3";

const debugImageUrl =
  "https://res.cloudinary.com/dbjebtzcm/image/upload/v1779872709/seo/ChatGPT_Image_May_27_2026_01_01_19_PM.png";

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event);
  const siteUrl = String(
    config.public.siteUrl || "https://flexdrive-front.vercel.app",
  ).replace(/\/+$/, "");
  const pageUrl = `${siteUrl}/meta-debug-test`;

  setHeader(event, "content-type", "text/html; charset=utf-8");
  setHeader(event, "cache-control", "no-store, max-age=0");

  return `<!doctype html>
<html lang="ka">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="index, follow">
    <title>FlexDrive Meta Debug Test</title>
    <meta name="description" content="FlexDrive social preview diagnostic page.">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="FlexDrive">
    <meta property="og:url" content="${pageUrl}">
    <meta property="og:title" content="FlexDrive Meta Debug Test">
    <meta property="og:description" content="ეს არის მარტივი სატესტო გვერდი Facebook/Messenger preview დიაგნოსტიკისთვის.">
    <meta property="og:image" content="${debugImageUrl}">
    <meta property="og:image:secure_url" content="${debugImageUrl}">
    <meta property="og:image:type" content="image/png">
    <meta property="og:image:width" content="1731">
    <meta property="og:image:height" content="909">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="FlexDrive Meta Debug Test">
    <meta name="twitter:description" content="FlexDrive social preview diagnostic page.">
    <meta name="twitter:image" content="${debugImageUrl}">
  </head>
  <body>
    <h1>FlexDrive Meta Debug Test</h1>
    <p>This page is generated without backend, CMS, Pinia, or Nuxt page rendering.</p>
  </body>
</html>`;
});
