#!/bin/bash
# 将 123 条活塞数据批量导入 Cloudflare D1 数据库
# 使用方法: chmod +x db/import-pistons-to-d1.sh && ./db/import-pistons-to-d1.sh

set -e
echo "===== 开始导入 123 条活塞数据到 D1 ====="

# 先检查 wrangler 是否已登录
npx wrangler whoami 2>/dev/null && echo "✓ wrangler 已登录" || { echo "✗ 请先运行: npx wrangler login"; exit 1; }

# 逐批导入 (每 10 条一批，避免请求太密)
COUNT=0
TOTAL=123

python3 << 'PYEOF'
import json, subprocess, time, os

script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, "..", "..", "..", "..", ".openclaw-autoclaw", "workspace", ".openclaw", "tmp", "piston_import.json")

with open(json_path, "r") as f:
    products = json.load(f)

for i, p in enumerate(products):
    pid = p["id"].replace("'", "''")
    title = p["title"].replace("'", "''")
    cat = p["category"].replace("'", "''")
    compat = p["compatible"].replace("'", "''")
    feat = json.dumps(p["features"], ensure_ascii=False).replace("'", "''")
    img = p["image"].replace("'", "''")
    mkt = json.dumps(p["marketFocus"], ensure_ascii=False).replace("'", "''")
    det = json.dumps(p["details"], ensure_ascii=False).replace("'", "''")
    
    sql = f"INSERT OR REPLACE INTO products (id, title, category, compatible, features, image, market_focus, details) VALUES ('{pid}', '{title}', '{cat}', '{compat}', '{feat}', '{img}', '{mkt}', '{det}');"
    
    r = subprocess.run(
        ["npx", "wrangler", "d1", "execute", "yh-db", "--command", sql],
        capture_output=True, text=True, timeout=15
    )
    
    if "error" in r.stdout.lower() or "error" in r.stderr.lower():
        if "UNIQUE constraint" in (r.stdout + r.stderr):
            print(f"  [{i+1}/{len(products)}] ⏭ {title} (已存在)")
        else:
            print(f"  [{i+1}/{len(products)}] ✗ {title}: {r.stderr[:80]}")
    else:
        print(f"  [{i+1}/{len(products)}] ✓ {title}")
    
    if (i+1) % 20 == 0:
        time.sleep(0.5)  # 小间隔避免限流

print(f"\n===== 完成! =====")
PYEOF
