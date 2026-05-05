import json
import sys

def try_load(filename):
    for enc in ['utf-8', 'utf-16', 'utf-16-le', 'utf-16-be', 'latin-1']:
        try:
            with open(filename, 'r', encoding=enc) as f:
                return json.load(f)
        except:
            continue
    return None

data = try_load('simbrief_inspect.json')
if not data:
    sys.exit(1)

tlr_landing = data.get('tlr', {}).get('landing', {})
for k in tlr_landing:
    val = tlr_landing[k]
    print(f"KEY: {k} | TYPE: {type(val)}")
    if isinstance(val, list):
        print(f"  LEN: {len(val)}")
    if k == 'runway':
        for i, r in enumerate(val):
            print(f"  RUNWAY[{i}]: {r.get('identifier')}")
