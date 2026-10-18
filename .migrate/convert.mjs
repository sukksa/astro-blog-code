/**
 * 把 Hexo (_posts/**\/*.md) 转成 Firefly 的 Astro content posts。
 * 用法：node .migrate/convert.mjs [--dry]
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { pinyin } from "pinyin-pro";

const SRC = String.raw`D:\Blog\sukksa.github.io\source\_posts`;
const IMG_SRC = String.raw`D:\Blog\sukksa.github.io\source\images`;
const IMG_DEST = String.raw`D:\Blog\Firefly\public\images`;
const DEST = String.raw`D:\Blog\Firefly\src\content\posts`;

const dry = process.argv.includes("--dry");

// 原站复制粘贴写错的标题：文件内容与文件名都是「继承」，只是 title/H1 抄成了基本用法
const TITLE_FIXES = {
	"ES6/Class的继承.md": "Class的继承",
};

function walk(dir) {
	const out = [];
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) out.push(...walk(full));
		else if (/\.(md|markdown)$/i.test(entry.name)) out.push(full);
	}
	return out;
}

/** 与 scripts/new-post.js 一致的拼音 slug 规则 */
function slugify(raw) {
	const chars = [...raw];
	const parts = [];
	let buf = "";
	for (const ch of chars) {
		if (/[\u4e00-\u9fff]/.test(ch)) {
			if (buf) {
				parts.push(buf);
				buf = "";
			}
			parts.push(pinyin(ch, { toneType: "none", type: "array" })[0]);
		} else {
			buf += ch;
		}
	}
	if (buf) parts.push(buf);
	return parts
		.join("-")
		.toLowerCase()
		.replace(/[^a-z0-9-]/g, "")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
}

function fmtDate(value) {
	if (value instanceof Date) {
		const p = (n) => String(n).padStart(2, "0");
		return `${value.getFullYear()}-${p(value.getMonth() + 1)}-${p(value.getDate())} ${p(value.getHours())}:${p(value.getMinutes())}:${p(value.getSeconds())}`;
	}
	const text = String(value).trim().replace(/\//g, "-");
	const m = text.match(/^(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}(?::\d{2})?))?/);
	return m ? `${m[1]}${m[2] ? ` ${m[2].length === 5 ? `${m[2]}:00` : m[2]}` : " 00:00:00"}` : text;
}

function plain(text) {	return text
		.replace(/```[\s\S]*?```/g, " ")
		.replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
		.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
		.replace(/<[^>]+>/g, " ")
		.replace(/[*_`>#|~-]+/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function excerptOf(body) {
	const beforeMore = body.split("<!-- more -->")[0];
	// 去掉标题行
	const lines = beforeMore
		.split(/\r?\n/)
		.filter((l) => !/^\s*#{1,6}\s/.test(l) && !/^\s*$/.test(l));
	const text = plain(lines.join(" "));
	return text.length > 150 ? `${text.slice(0, 150).trim()}…` : text;
}

const files = walk(SRC);
const used = new Map();
const report = [];
const rows = [];

for (const file of files.sort()) {
	const raw = fs.readFileSync(file, "utf8");
	const { data, content } = matter(raw);

	if (!data.title) {
		report.push(`SKIP (no title): ${file}`);
		continue;
	}
	if (!data.date) {
		report.push(`SKIP (no date): ${file}`);
		continue;
	}

	const rel = path.relative(SRC, file).replace(/\\/g, "/");
	const originalTitle = String(data.title).trim();
	const title = TITLE_FIXES[rel] ?? originalTitle;

	// slug：标题里的中文转拼音，保留英文
	let slug = slugify(title);
	if (!slug) slug = slugify(path.basename(rel, path.extname(rel)));
	const base = slug;
	let n = 2;
	while (used.has(slug)) slug = `${base}-${n++}`;
	used.set(slug, title);

	// 分类：Hexo 里是字符串或数组，Firefly 只支持单分类
	let category = null;
	if (Array.isArray(data.categories)) category = data.categories.at(-1) ?? null;
	else if (data.categories) category = String(data.categories);
	// 原站有 4 篇没写 categories，用所在目录名兜底（react/ 等）
	if (!category && rel.includes("/")) category = rel.split("/")[0];
	if (category) category = String(category).trim();

	const tags = Array.isArray(data.tags)
		? data.tags.map((t) => String(t).trim()).filter(Boolean)
		: data.tags
			? [String(data.tags).trim()]
			: [];

	// 正文：去掉与标题重复的一级标题、去掉 more 标记、修 Windows 反斜杠图片路径
	let body = content
		.replace(/!\[([^\]]*)\]\(([^)]*)\)/g, (_m, alt, url) => {
			if (url.includes("\\") && !url.startsWith("http")) {
				return `![${alt}](/${url.replace(/^[\\/]+/, "").replace(/\\/g, "/")})`;
			}
			return `![${alt}](${url})`;
		})
		.replace(/<!--\s*more\s*-->/gi, "");

	const h1 = body.match(/^\s*#\s+(.+?)\s*#*\s*(?:\r?\n|$)/);
	if (h1) {
		const h1Text = h1[1].replace(/\s*#+$/, "").trim().toLowerCase();
		if ([title, originalTitle].some((t) => t.toLowerCase() === h1Text)) {
			body = body.slice(h1[0].length);
		}
	}
	body = body.replace(/^\s*\n+/, "");

	const description =
		(data.abstract && String(data.abstract).trim()) || excerptOf(content);

	const dateStr = fmtDate(data.date);

	const out = matter
		.stringify(`\n${body.trim()}\n`, {
			title,
			published: dateStr,
			description,
			tags,
			...(category ? { category } : {}),
			...(data.updated ? { updated: fmtDate(data.updated) } : {}),
		})
		// 日期必须保持 YAML 时间戳（不加引号），Astro 的 z.date() 才会解析成 Date
		.replace(/^(published|updated):\s*'([^']+)'$/gm, "$1: $2");

	const target = path.join(DEST, `${slug}.md`);
	if (!dry) fs.writeFileSync(target, out, "utf8");
	rows.push({ slug, title, category, date: dateStr, tags: tags.length, bytes: out.length });

	const stem = path.basename(file, path.extname(file));
	if (stem !== title && !TITLE_FIXES[rel]) {
		report.push(`NAME/TITLE DIFF: ${rel} -> title "${title}"`);
	}
}

// 图片：source/images -> public/images
let imgCount = 0;
if (!dry && fs.existsSync(IMG_SRC)) {
	fs.cpSync(IMG_SRC, IMG_DEST, { recursive: true });
	imgCount = walk(IMG_DEST).length;
}

console.log(`converted: ${rows.length} / ${files.length}`);
if (report.length) console.log(report.join("\n"));
console.log("\nslug | category | date | title");
for (const r of rows.sort((a, b) => (a.date < b.date ? -1 : 1))) {
	console.log(`${r.slug} | ${r.category ?? "-"} | ${r.date} | ${r.title}`);
}
const cats = [...new Set(rows.map((r) => r.category).filter(Boolean))].sort();
console.log(`\ncategories (${cats.length}): ${cats.join(", ")}`);
const dates = rows.map((r) => r.date).sort();
console.log(`date range: ${dates[0]} .. ${dates.at(-1)}`);
if (!dry) console.log(`images copied to public/images: ${imgCount}`);
