#!/usr/bin/env python3
import json, sys, urllib.request, urllib.error

base = "https://www.yhautopartschina.com"
token = "yhadmin2024"

# Load products
for p in ["/Users/jeff/.openclaw-autoclaw/workspace/.openclaw/tmp/piston_import.json",
          "/Users/jeff/Desktop/锋哥汽配网站/node_modules/../db/../.openclaw/../.openclaw-autoclaw/workspace/.openclaw/tmp/piston_import.json"]:
    try:
        with open(p) as f: products = json.load(f); break
    except: continue

ok = fail = 0
for i, p in enumerate(products):
    body = json.dumps(p, ensure_ascii=False).encode()
    req = urllib.request.Request(f"{base}/api/products", data=body,
        headers={"Content-Type":"application/json","Authorization":f"***{token}"}, method="POST")
    try:
        urllib.request.urlopen(req, timeout=15)
        ok += 1
    except Exception as e:
        fail += 1
        if fail <= 3: print(f"  ✗ [{i+1}] {p['title'][:40]}: {e}")
    if (i+1) % 20 == 0: print(f"  [{i+1}/{len(products)}] ok={ok} fail={fail}")
print(f"\nDone: {ok} ok, {fail} fail")
