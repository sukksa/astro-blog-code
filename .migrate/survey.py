"""Survey the old Hexo blog: frontmatter keys, image refs, hexo tags, math delimiters."""

import os
import re
import collections

SRC = r"D:\Blog\sukksa.github.io\source\_posts"

keys = collections.Counter()
key_samples = {}
value_types = collections.Counter()
image_refs = collections.Counter()
hexo_tags = collections.Counter()
math_delims = collections.Counter()
files = []

html_imgs = []

for root, _dirs, names in os.walk(SRC):
    for name in names:
        if not name.lower().endswith((".md", ".markdown")):
            continue
        path = os.path.join(root, name)
        files.append(path)
        text = open(path, encoding="utf-8").read()
        m = re.match(r"^---\r?\n(.*?)\r?\n---\r?\n?(.*)$", text, re.S)
        if not m:
            print("NO FRONTMATTER:", path)
            continue
        fm_raw, body = m.group(1), m.group(2)

        current_key = None
        for line in fm_raw.splitlines():
            km = re.match(r"^([A-Za-z_][\w-]*):\s*(.*)$", line)
            if km:
                current_key = km.group(1)
                keys[current_key] += 1
                val = km.group(2).strip()
                if val:
                    value_types[f"{current_key}=scalar"] += 1
                    key_samples.setdefault(current_key, val[:60])
            elif line.strip().startswith("-"):
                if current_key:
                    value_types[f"{current_key}=list"] += 1

        for ref in re.findall(r"!\[[^\]]*\]\(([^)]+)\)", body):
            if ref.startswith("http"):
                image_refs["absolute"] += 1
            elif ref.startswith("/"):
                image_refs["root-relative"] += 1
            else:
                image_refs["relative"] += 1
            if "images/" not in ref and not ref.startswith("http"):
                html_imgs.append((os.path.basename(path), ref))

        for tag in re.findall(r"\{%\s*([a-zA-Z_]+)", body):
            hexo_tags[tag] += 1

        if "$" in body:
            math_delims["dollar"] += 1
        if "\\(" in body or "\\[" in body:
            math_delims["latex-paren"] += 1

        if "<!-- more -->" in text:
            math_delims["more-marker"] += 1
        if re.search(r"^# ", body, re.M):
            math_delims["has-h1"] += 1

print(f"files: {len(files)}")
print("\nfrontmatter keys:", dict(keys))
print("\nvalue shapes:", dict(value_types))
for k, v in key_samples.items():
    print(f"  sample {k}: {v!r}")
print("\nimage refs:", dict(image_refs))
print("non-standard image refs:", html_imgs[:15], "..." if len(html_imgs) > 15 else "")
print("\nhexo tags:", dict(hexo_tags))
print("\nother markers:", dict(math_delims))
