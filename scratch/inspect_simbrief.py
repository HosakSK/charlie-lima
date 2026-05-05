import json
import sys

def print_keys(obj, prefix=''):
    if isinstance(obj, dict):
        for k, v in obj.items():
            print_keys(v, f"{prefix}.{k}" if prefix else k)
    elif isinstance(obj, list):
        if obj:
            print_keys(obj[0], f"{prefix}[]")
    else:
        val = str(obj)
        if val == '145' and 'landing' in prefix.lower():
            print(f"{prefix}: {obj}")
        if val == '17' and 'landing' in prefix.lower():
             print(f"{prefix}: {obj}")

def try_load(filename):
    for enc in ['utf-8', 'utf-16', 'utf-16-le', 'utf-16-be', 'latin-1']:
        try:
            with open(filename, 'r', encoding=enc) as f:
                return json.load(f)
        except:
            continue
    return None

data = try_load('simbrief_inspect.json')
if data:
    print_keys(data)
else:
    print("Error loading JSON")
