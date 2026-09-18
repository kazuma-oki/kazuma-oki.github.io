#!/usr/bin/env node
/**
 * 静的サイトビルダー（Node標準モジュールのみ。npm install 不要）
 *
 *   node build.js
 *
 * data/works.json と data/site.json を読み、templates/ を使って
 * index.html / about.html / contact.html / works/<id>.html を出力する。
 */

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const DATA = path.join(ROOT, "data");
const TPL = path.join(ROOT, "templates");

const readJSON = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const readTPL = (name) => fs.readFileSync(path.join(TPL, name), "utf8");

const site = readJSON(path.join(DATA, "site.json"));
const works = readJSON(path.join(DATA, "works.json"));

/* ---------- ユーティリティ ---------- */

const esc = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** [表示文字](URL) をリンクに、改行を <br> に変換する */
const inline = (s = "") =>
  esc(s)
    .replace(
      /\[([^\]]+)\]\(([^)\s]+)\)/g,
      (_, label, url) =>
        `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`
    )
    .replace(/\n/g, "<br>");

/** {{key}} を values[key] で置き換える（未定義のキーは空文字にする） */
const fill = (tpl, values) =>
  tpl.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    values[key] === undefined || values[key] === null ? "" : String(values[key])
  );

const SOCIAL_ICONS = {
  X: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.9 2.3h3.4l-7.4 8.5L23.6 22h-6.8l-5.3-7-6.1 7H2l7.9-9.1L1.7 2.3h7l4.8 6.4 5.4-6.4Zm-1.2 17.6h1.9L7.4 4.3H5.4l12.3 15.6Z"/></svg>',
  Instagram:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.2.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.2.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4 1.2-.1 1.6-.1 4.8-.1Zm0 1.8c-3.1 0-3.5 0-4.7.1-1.1 0-1.7.2-2.1.3-.5.2-.9.4-1.2.8-.4.3-.6.7-.8 1.2-.1.4-.3 1-.3 2.1-.1 1.2-.1 1.6-.1 4.7s0 3.5.1 4.7c0 1.1.2 1.7.3 2.1.2.5.4.9.8 1.2.3.4.7.6 1.2.8.4.1 1 .3 2.1.3 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1.1 0 1.7-.2 2.1-.3.5-.2.9-.4 1.2-.8.4-.3.6-.7.8-1.2.1-.4.3-1 .3-2.1.1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c0-1.1-.2-1.7-.3-2.1-.2-.5-.4-.9-.8-1.2-.3-.4-.7-.6-1.2-.8-.4-.1-1-.3-2.1-.3-1.2-.1-1.6-.1-4.7-.1Zm0 3.1a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8Zm0 8.1a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Zm6.2-8.3a1.1 1.1 0 1 1-2.3 0 1.1 1.1 0 0 1 2.3 0Z"/></svg>',
};

/* ---------- 共通パーツ ---------- */

const navHTML = (items, base) =>
  items
    .map((i) => {
      const href = /^https?:/.test(i.href) ? i.href : base + i.href;
      return `<li><a href="${href}">${esc(i.label)}</a></li>`;
    })
    .join("\n      ");

const socialHTML = () =>
  site.social
    .map(
      (s) =>
        `<li><a href="${s.href}" target="_blank" rel="noopener noreferrer" aria-label="${esc(
          s.name
        )}">${SOCIAL_ICONS[s.name] || esc(s.name)}</a></li>`
    )
    .join("\n    ");

/** レイアウトに流し込んで1ページぶんのHTMLを作る */
function renderPage({ content, title, description, ogImage, ogType, base }) {
  return fill(readTPL("_layout.html"), {
    title: esc(title),
    description: esc(description || site.description),
    siteName: esc(site.siteName),
    ogType: ogType || "website",
    ogImage: ogImage || "",
    logo: esc(site.logo),
    base,
    nav: navHTML(site.nav, base),
    footerNav: navHTML(site.footerNav, base),
    social: socialHTML(),
    content,
  });
}

/* ---------- Top ---------- */

function buildIndex() {
  const base = "";
  let tpl = readTPL("index.html");

  const [eachAll, inner] = tpl.match(/<!-- @each works -->([\s\S]*?)<!-- @end -->/) || [];
  const cards = works
    .map((w) =>
      fill(inner, {
        base,
        id: w.id,
        thumb: w.thumb,
        title: esc(w.title),
        category: esc(w.category),
        tag: esc(w.tag),
      }).trim()
    )
    .join("\n      ");
  tpl = tpl.replace(eachAll, cards);

  const content = fill(tpl, {
    base,
    heroImage: site.heroImage,
    heroImageAlt: esc(site.heroImageAlt),
    heroTitleLines: site.heroTitle.map((l) => `<span>${esc(l)}</span>`).join("\n      "),
    heroSubtitle: esc(site.heroSubtitle),
    aboutBannerHref: site.aboutBanner.href,
    aboutBannerHeading: esc(site.aboutBanner.heading),
    aboutBannerSub: esc(site.aboutBanner.sub),
  });

  return renderPage({
    content,
    title: site.siteName,
    description: site.description,
    ogImage: site.heroImage,
    base,
  });
}

/* ---------- About ---------- */

function buildAbout() {
  const base = "";
  const a = site.about;
  const image = a.image
    ? `<img src="${base}${a.image}" alt="${esc(a.name)}" width="360" height="628">`
    : `<div class="about-placeholder">${esc(a.imagePlaceholder)}</div>`;

  const content = fill(readTPL("about.html"), {
    base,
    aboutHeading: esc(a.heading),
    aboutImage: image,
    aboutName: esc(a.name),
    aboutBody: a.body.map((p) => `<p class="about-body">${inline(p)}</p>`).join("\n        "),
  });

  return renderPage({
    content,
    title: `About me | ${site.siteName}`,
    description: a.body[0],
    ogImage: site.heroImage,
    base,
  });
}

/* ---------- Contact ---------- */

function buildContact() {
  const base = "";
  const c = site.contact;
  const gf = site.googleForm || {};
  const ready = Boolean(gf.actionUrl);

  const fields = c.fields
    .map((f) => {
      const entry = ready ? gf.entries[f.name] : "";
      const name = entry || f.name;
      const req = f.required ? '<span class="required" aria-hidden="true">*</span>' : "";
      const attrs = [
        `id="f-${f.name}"`,
        `name="${name}"`,
        `placeholder="${esc(f.placeholder)}"`,
        f.required ? "required" : "",
      ]
        .filter(Boolean)
        .join(" ");
      const control =
        f.type === "textarea"
          ? `<textarea ${attrs}></textarea>`
          : `<input type="${f.type}" ${attrs}>`;
      return `<div class="field">
        <label class="field-label" for="f-${f.name}">${esc(f.label)}${req}</label>
        ${control}
      </div>`;
    })
    .join("\n      ");

  const content = fill(readTPL("contact.html"), {
    base,
    formAction: ready ? gf.actionUrl : "",
    formFields: fields,
    submitLabel: esc(c.submitLabel),
    submitDisabled: ready ? "" : " disabled",
    formNotice: ready
      ? ""
      : '<p class="form-notice">※送信先が未設定です。data/site.json の googleForm を設定すると有効になります。</p>',
    thanksTitle: esc(c.thanksTitle),
    thanksText: esc(c.thanksText),
  });

  return renderPage({
    content,
    title: `Contact | ${site.siteName}`,
    description: "お問い合わせフォーム",
    ogImage: site.heroImage,
    base,
  });
}

/* ---------- Works詳細 ---------- */

function renderBlocks(blocks = [], base) {
  return blocks
    .map((b) => {
      if (b.sub) return `<p class="sub">${inline(b.sub)}</p>`;
      if (b.list) return `<ul>${b.list.map((li) => `<li>${inline(li)}</li>`).join("")}</ul>`;
      if (b.image)
        return `<figure><img src="${base}${b.image}" alt="${esc(b.alt || "")}" loading="lazy"></figure>`;
      if (b.text) return `<p>${inline(b.text)}</p>`;
      return "";
    })
    .filter(Boolean)
    .join("\n      ");
}

function buildWork(w) {
  const base = "../";
  const sections = w.sections
    .map(
      (s, i) =>
        `${i > 0 ? "<hr>\n      " : ""}<h2>${esc(s.heading)}</h2>\n      ${renderBlocks(
          s.blocks,
          base
        )}`
    )
    .join("\n      ");

  const mainImage = w.mainImage
    ? `<div class="detail-main-image"><img src="${base}${w.mainImage}" alt="${esc(
        w.title
      )}" width="800" height="600"></div>`
    : "";

  const content = fill(readTPL("work.html"), {
    base,
    category: esc(w.category),
    tag: esc(w.tag),
    date: esc(w.date),
    title: esc(w.title),
    mainImageBlock: mainImage,
    sections,
  });

  const firstText = (w.sections.find((s) => s.blocks.some((b) => b.text)) || { blocks: [] }).blocks
    .filter((b) => b.text)
    .map((b) => b.text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"))[0];

  return renderPage({
    content,
    title: `${w.title} | ${site.siteName}`,
    description: firstText || site.description,
    ogImage: w.mainImage || w.thumb,
    ogType: "article",
    base,
  });
}

/* ---------- 出力 ---------- */

function write(relPath, html) {
  const dest = path.join(ROOT, relPath);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, html, "utf8");
  console.log(`  ${relPath}`);
}

function main() {
  console.log("ビルド中...");
  write("index.html", buildIndex());
  write("about.html", buildAbout());
  write("contact.html", buildContact());
  works.forEach((w) => write(path.join("works", `${w.id}.html`), buildWork(w)));

  // GitHub Pages が _ 始まりのパスを無視しないようにする
  write(".nojekyll", "");

  console.log(`\n完了：${works.length}件の実績を含む ${works.length + 3} ページを出力しました。`);
}

main();
