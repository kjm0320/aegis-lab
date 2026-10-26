"""Run real checks and record a portable summary. No external network required."""
import hashlib
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COMMANDS = [
    ["node", "--test", "--test-reporter=tap", "tests/model.test.mjs", "tests/interactions.test.mjs", "tests/portfolio.test.mjs"],
    [sys.executable, "-m", "unittest", "lab.test_security", "-v"],
]
reports=[]
for cmd in COMMANDS:
    r=subprocess.run(cmd,cwd=ROOT,capture_output=True,text=True,encoding='utf-8')
    output=r.stdout+'\n'+r.stderr
    if r.returncode:
        print(output);sys.exit(r.returncode)
    reports.append(output)
js=int(re.search(r'# tests (\d+)',reports[0])[1])
py=int(re.search(r'Ran (\d+) tests?',reports[1])[1])
summary={"generatedAt":datetime.now(timezone.utc).isoformat(),"javascript":{"total":js,"passed":js,"method":"Node tests; model and lightweight DOM event adapter"},"python":{"total":py,"passed":py,"method":"in-process WSGI and SQLite regression tests"},"total":js+py,"browserQA":"not performed; browser rendering and cookie enforcement unverified","githubCI":"workflow prepared; no remote run claimed","sourceHashes":{str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in [ROOT/'dist/app.mjs',ROOT/'dist/model.mjs',ROOT/'dist/portfolio.mjs']}}
(ROOT/'evidence/verification-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
(ROOT/'evidence/javascript-tests.tap').write_text(reports[0],encoding='utf-8')
(ROOT/'evidence/python-tests.txt').write_text(reports[1],encoding='utf-8')
print(f'PASS: {js} JavaScript + {py} Python = {js+py} tests. Browser QA: not performed.')
