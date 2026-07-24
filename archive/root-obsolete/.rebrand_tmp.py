import os

ROOT = "whoknow-waimai/src"
REPL = [
    ("#ff6b35", "#ff7849"),   # 主行动橙 -> 主站锚橙
    ("#e55a26", "#e8632f"),   # 品牌深橙陪伴
    ("#fff0eb", "#fff2ec"),   # 品牌浅橙陪伴
    ("#ff9a3c", "#ffa05c"),   # 渐变浅橙陪伴
    ("#ff9a5c", "#ffac6e"),   # 渐变浅橙陪伴
    ("#ff8c42", "#ff9c5e"),   # 渐变浅橙陪伴
]

exts = (".scss", ".vue", ".css", ".ts", ".js", ".json")
files = []
for dp, _, fns in os.walk(ROOT):
    for fn in fns:
        if fn.lower().endswith(exts):
            files.append(os.path.join(dp, fn))

total = 0
touched = []
for f in files:
    try:
        with open(f, "r", encoding="utf-8") as fh:
            s = fh.read()
    except Exception as e:
        print("SKIP(read)", f, e)
        continue
    orig = s
    for a, b in REPL:
        s = s.replace(a, b)
    if s != orig:
        with open(f, "w", encoding="utf-8") as fh:
            fh.write(s)
        cnt = sum(orig.count(a) for a, _ in REPL)
        total += cnt
        touched.append((f, cnt))

print("files touched:", len(touched))
print("total replacements:", total)
for f, c in touched:
    print(f"  {c:3d}  {f}")
