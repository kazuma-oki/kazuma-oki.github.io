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

// アイコンのパスは Font Awesome Free 6（CC BY 4.0 / fontawesome.com）より
const SOCIAL_ICONS = {
  X: '<svg viewBox="0 0 512 512" aria-hidden="true"><path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"/></svg>',
  Instagram:
    '<svg viewBox="0 0 448 512" aria-hidden="true"><path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"/></svg>',
};

/* ---------- 共通パーツ ---------- */

const navHTML = (items, base) =>
  items
    .map((i) => {
      const href = /^https?:/.test(i.href) ? i.href : base + i.href;
      return `<li><a href="${href}"><span class="nav-label">${esc(
        i.label
      )}</span><span class="nav-underline" aria-hidden="true"></span></a></li>`;
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
      )}" width="800" height="600" fetchpriority="high" decoding="async"></div>`
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
