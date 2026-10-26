"""Build a GitHub-ready source archive without Site identity or Git metadata."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'dist/downloads/aegis-lab-source.zip'
OUT.parent.mkdir(parents=True,exist_ok=True)
TOP_FILES={'README.md','package.json','.gitignore'}
FOLDERS={'dist','docs','lab','scripts','tests','evidence','.github'}


def included(path):
    rel=path.relative_to(ROOT)
    if any(x in {'.git','.openai','__pycache__','node_modules'} for x in rel.parts):return False
    if path==OUT or path.suffix in {'.pyc','.zip','.tar','.gz'}:return False
    return len(rel.parts)==1 and rel.name in TOP_FILES or rel.parts[0] in FOLDERS


with ZipFile(OUT,'w',ZIP_DEFLATED) as z:
    for path in sorted(ROOT.rglob('*')):
        if path.is_file() and included(path):
            rel=path.relative_to(ROOT)
            if rel.as_posix()=='.gitignore':
                z.writestr('aegis-lab/.gitignore','__pycache__/\n*.pyc\nnode_modules/\n.env\n.env.*\ndist/downloads/aegis-lab-source.zip\n')
            else:
                z.write(path,Path('aegis-lab')/rel)
print(OUT)
