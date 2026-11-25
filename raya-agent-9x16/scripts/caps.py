"""Sari kata bergerak: padankan setiap perkataan sari kata dengan masa perkataan VO (vo_align_words.json).
Output src/caps.ts, masa dalam saat VO ASAL (RayaAgent memetakan ke garis masa baru)."""
import json, re
al = [(re.sub(r'\(\d\)', '', w), s, e) for w, s, e in json.load(open('/mnt/project-files/raya-agent/vo_align_words.json')) if w != '<sil>']
LINES = [
    'And do you know that people across',
    'are already asking and looking for Nafesa?',
    'And guess what?',
    'YOU are the authorised agents who can sell it to them!',
    "So don't just buy Nafesa for yourself.",
    'You never know, your next customer could be...',
    "You don't need a physical shop.",
    "You don't need thousands of followers.",
    'You just need to start reaching out.',
    'Raya season is a huge opportunity.',
    "Don't just watch others selling.",
    'Come on, Nafesians.',
]
norm = lambda w: re.sub(r"[^a-z']", '', w.lower())
p = 0; out = []
for ln in LINES:
    ws = ln.split(); res = []
    for w in ws:
        n = norm(w)
        while al[p][0] != n: p += 1
        res.append([w, al[p][1], al[p][2]]); p += 1
    out.append(res)
with open('src/caps.ts', 'w') as f:
    f.write('// Dijana oleh scripts/caps.py: [perkataan, mula, tamat] dalam saat VO asal\n')
    f.write('export const CAPS: [string, number, number][][] = ' + json.dumps(out) + ';\n')
print('ok', len(out))
