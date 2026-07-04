#!/usr/bin/env python3
"""Parse piston ring Excel and import to YH API with concurrent POSTs."""

import xlrd
import json
import sys
import ssl
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

EXCEL_PATH = '/Users/jeff/.openclaw-autoclaw/workspace/.openclaw-attachments/20260704-233448-1a98a48d-942-活塞环目录表.xls'
API_URL = 'https://www.yhautopartschina.com/api/products'
AUTH_TOKEN = 'yhadmin2024'


def safe_str(val):
    if val == '' or val is None:
        return ''
    if isinstance(val, float):
        if val == int(val):
            return str(int(val))
        return str(val)
    return str(val).strip()


def get_existing_ids():
    """Fetch existing ring IDs from API to skip duplicates."""
    try:
        url = 'https://www.yhautopartschina.com/api/products?category=Piston%20Ring'
        req = urllib.request.Request(url)
        req.add_header('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')
        ctx = ssl.create_default_context()
        resp = urllib.request.urlopen(req, timeout=30, context=ctx)
        data = json.loads(resp.read().decode())
        ids = set()
        for p in data:
            pid = p.get('id', '')
            if pid.startswith('ring-') and pid.replace('ring-', '').isdigit():
                ids.add(pid)
        return ids
    except Exception as e:
        print(f"  Warning: Could not fetch existing IDs: {e}")
        return set()


def post_product(product):
    """POST a single product, returns (seq, ok, message)."""
    try:
        data = json.dumps(product).encode('utf-8')
        req = urllib.request.Request(API_URL, data=data, method='POST')
        req.add_header('Authorization', f'Bearer {AUTH_TOKEN}')
        req.add_header('Content-Type', 'application/json')
        req.add_header('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')
        req.add_header('Accept', 'application/json')
        ctx = ssl.create_default_context()
        resp = urllib.request.urlopen(req, timeout=30, context=ctx)
        if resp.status in (200, 201):
            return (product['id'], True, '')
        else:
            return (product['id'], False, f'HTTP {resp.status}')
    except Exception as e:
        return (product['id'], False, str(e))


def main():
    wb = xlrd.open_workbook(EXCEL_PATH)
    ws = wb.sheet_by_index(0)
    nrows = ws.nrows
    print(f"Sheet: {ws.name}, rows: {nrows}")

    # Fetch existing ring IDs
    existing = get_existing_ids()
    print(f"Already imported: {len(existing)} ring products")

    # Build all products first, skipping existing
    products = []
    skipped = 0
    row_idx = 3  # Row 4 (1-indexed)

    while row_idx + 2 < nrows:
        seq_val = ws.cell_value(row_idx, 0)
        if seq_val == '' or seq_val is None:
            row_idx += 1
            continue

        seq = int(float(seq_val))
        pid = f'ring-{seq}'

        if pid in existing:
            skipped += 1
            row_idx += 3
            continue

        model = safe_str(ws.cell_value(row_idx, 1))
        bore = ws.cell_value(row_idx, 2)
        bore_str = safe_str(bore)
        hxr_1st = safe_str(ws.cell_value(row_idx, 4))
        cyl_val = ws.cell_value(row_idx, 5)
        cyl_str = safe_str(cyl_val)
        spec = safe_str(ws.cell_value(row_idx, 6))
        compatible = safe_str(ws.cell_value(row_idx, 7))

        hxr_2nd = safe_str(ws.cell_value(row_idx + 1, 4))
        hxr_oil = safe_str(ws.cell_value(row_idx + 2, 4))

        product = {
            'id': pid,
            'title': f'{model} {bore_str}mm Piston Ring Set',
            'category': 'Piston Ring',
            'compatible': f'适配: {compatible}',
            'features': [],
            'image': '',
            'marketFocus': ['Southeast Asia', 'Middle East', 'Africa'],
            'details': {
                'oem': [],
                'size': [
                    f'Bore: {bore_str}mm',
                    f'Cylinders: {cyl_str}',
                    spec,
                ],
                'used': [model],
                'specs': [
                    {'ring': '1ST', 'hxr': hxr_1st},
                    {'ring': '2ND', 'hxr': hxr_2nd},
                    {'ring': 'OIL', 'hxr': hxr_oil},
                ],
            },
        }
        products.append(product)
        row_idx += 3

    print(f"Skipped {skipped} already imported, {len(products)} new to import")

    if not products:
        print("Nothing new to import. All done!")
        return 0

    # Import with concurrency
    print("Starting import...")
    success = 0
    failed = 0
    completed = 0

    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(post_product, p): p for p in products}
        for future in as_completed(futures):
            pid, ok, msg = future.result()
            if ok:
                success += 1
            else:
                failed += 1
                print(f"  FAIL {pid}: {msg}")
            completed += 1
            if completed % 10 == 0:
                print(f"  Progress: {completed}/{len(products)} ({success} ok, {failed} fail)")

    print(f"\nDone! Total: {len(products)}, Success: {success}, Failed: {failed}")
    return 0 if failed == 0 else 1


if __name__ == '__main__':
    sys.exit(main())
