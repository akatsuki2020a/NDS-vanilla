"""Field rigs for NDS IQ: an app (or a brief) an agent builds or ports to NDS with the draft rules.

Run from the NDS repo root. The guide is .claude/skills/nds-iq-eval/RIGS.md.

  python scripts/rig.py new <rig> [dest]       copy a baseline, git init, tag it, npm install or a Django venv + seed
  python scripts/rig.py stage <rig> <release>  unpack a mkrelease --preview zip to .nds/, add _source/, stamp <release>, copy the draft to NDS-IQ.md
  python scripts/rig.py reset <rig> [--save]   commit the run to a runN-date branch, back to the baseline tag

<rig> is a rig number (1 sawaed, 2 shop-licenses, 5 library-portal, 6 citydesk, 7 grants-desk), which lives at ../nds-test-app-<N>,
or a baseline name (new) or a path (stage, reset). Baselines live in .claude/skills/nds-iq-eval/rigs/.
"""
import datetime, io, os, re, shutil, subprocess, sys, tarfile, zipfile

RIGS = '.claude/skills/nds-iq-eval/rigs'
# A nested CLAUDE.md would load into sessions working on NDS itself, so the rig gets it at setup.
OPT_OUT = ('## Memory\n\nDo not save any memory (user, feedback, project, or reference) for this project.\n'
           'Do not write to or read from the memory directory for this repo.\n')
# How each baseline starts, and where it serves. The ports are in each app's own code.
APPS = {'library-portal': ('npm start', 'http://localhost:3005'),
        'citydesk': ('npm start', 'http://localhost:3000'),
        'grants-desk': ('npm run dev', 'http://localhost:5177'),
        'shop-licenses': ('.venv/Scripts/python manage.py runserver 8002' if os.name == 'nt'
                          else '.venv/bin/python manage.py runserver 8002', 'http://localhost:8002')}
# The numbers past runs cite ("rig 5 run 8" = nds-test-app-5).
NUMS = {'1': 'sawaed', '2': 'shop-licenses', '5': 'library-portal', '6': 'citydesk', '7': 'grants-desk'}
# _source/ holds the folders NDS-INDEX's Sources line names.
FOLDERS = re.findall(r'`([^`]+)`', re.search(r'^- \*\*Sources:\*\*.*into `_source/`:(.*)$',
                                              open('NDS-INDEX.md', encoding='utf-8').read(), re.M).group(1))


def run(cmd, cwd=None):
    print('>', cmd)
    subprocess.run(cmd, cwd=cwd, shell=True, check=True)


def git(dest, *args):
    return subprocess.run(['git', *args], cwd=dest, capture_output=True, text=True, check=True).stdout.strip()


def where(rig):
    return os.path.join('..', f'nds-test-app-{rig}') if rig in NUMS else rig


def seed(dest):
    # A Django rig's database is gitignored, so a reset rebuilds it from the seed.
    py = os.path.join('.venv', 'Scripts' if os.name == 'nt' else 'bin', 'python')
    if not os.path.exists(os.path.join(dest, py + ('.exe' if os.name == 'nt' else ''))):
        run(f'"{sys.executable}" -m venv .venv', cwd=dest)
        run(f'{py} -m pip install -q -r requirements.txt', cwd=dest)
    if os.path.exists(os.path.join(dest, 'db.sqlite3')):
        os.remove(os.path.join(dest, 'db.sqlite3'))
    shutil.rmtree(os.path.join(dest, 'media'), ignore_errors=True)
    run(f'{py} manage.py migrate -v 0', cwd=dest)
    run(f'{py} manage.py seed', cwd=dest)


def new(rig, dest):
    baseline = NUMS.get(rig, rig)
    src = os.path.join(RIGS, baseline)
    assert os.path.isdir(src), f'no baseline {src}; have: {", ".join(os.listdir(RIGS))}'
    assert not os.path.exists(dest) or not os.listdir(dest), f'{dest} is not empty'
    shutil.copytree(src, dest, dirs_exist_ok=True)
    with open(os.path.join(dest, 'CLAUDE.md'), 'w', encoding='utf-8', newline='\n') as f:
        f.write(OPT_OUT)
    git(dest, 'init', '-q', '-b', 'main')
    git(dest, 'add', '-A')
    git(dest, '-c', 'user.name=rig', '-c', 'user.email=rig@localhost', 'commit', '-qm', f'{baseline} baseline')
    git(dest, 'tag', 'baseline')
    if os.path.exists(os.path.join(dest, 'package.json')):  # rig 1 is a brief, no app
        run('npm install --no-audit --no-fund', cwd=dest)
    if os.path.exists(os.path.join(dest, 'manage.py')):
        seed(dest)
    print(f'ready: {dest}.\n  published release: paste the get-started setup prompt in a session there'
          f'\n  unreleased: python scripts/rig.py stage {rig if rig in NUMS else dest} <release> first')
    if baseline in APPS:
        print(f'the app: cd {dest} && {APPS[baseline][0]}  ->  {APPS[baseline][1]}')


def stage(dest, release):
    baseline = git(dest, 'log', '-1', '--format=%s', 'baseline').removesuffix(' baseline')  # fails here on a non-rig
    nds = os.path.join(dest, '.nds')
    assert not os.path.exists(nds) or not any(f for _, _, f in os.walk(nds)), 'rig already has .nds files: reset it first'
    # The release zip itself, unpacked to .nds/ as an install extracts it.
    run(f'"{sys.executable}" scripts/mkrelease.py --preview {release}')
    root = f'nds-vanilla-template-v{release}/'
    with zipfile.ZipFile(f'dist/nds-vanilla-template-v{release}.zip') as z:
        for m in z.infolist():
            if m.filename.startswith(root) and m.filename != root:
                m.filename = m.filename[len(root):]
                z.extract(m, nds)
    # _source: the folders NDS-INDEX names, from the committed tree, as the tag's source zip holds them.
    tar = subprocess.run(['git', 'archive', '--format=tar', 'HEAD', *FOLDERS], capture_output=True, check=True).stdout
    tarfile.open(fileobj=io.BytesIO(tar)).extractall(os.path.join(nds, '_source'), filter='data')
    # The release commit's stamp: 1.12.x-dev and the docs' "1.12.x" become the release number.
    dev = re.search(r'^version:\s*"?([\w.]+)-dev', open('_config.yml', encoding='utf-8').read(), re.M).group(1)
    n = 0
    for root, _, files in os.walk(nds):
        for name in files:
            if not name.endswith(('.js', '.css', '.html', '.md', '.json', '.yml', '.scss')):
                continue
            p = os.path.join(root, name)
            try:
                s = open(p, encoding='utf-8', newline='').read()
            except UnicodeDecodeError:
                continue
            t = s.replace(f'{dev}-dev', release).replace(f'"{dev}"', f'"{release}"')
            if t != s:
                open(p, 'w', encoding='utf-8', newline='').write(t)
                n += 1
    shutil.copy2('_includes/NDS-IQ-draft.md', os.path.join(dest, 'NDS-IQ.md'))
    # Put the dev site back: mkrelease's cleaner and compressor rewrote _site for the zip.
    run('bundle exec jekyll build')
    print(f'staged {dest}: {n} files stamped {release}, NDS-IQ.md is the draft')
    if baseline in APPS:
        print(f'start the app: cd {dest} && {APPS[baseline][0]}  ->  {APPS[baseline][1]}')


def reset(dest, save):
    if save:
        runs = re.findall(r'^run(\d+)-', git(dest, 'branch', '--list', 'run*', '--format=%(refname:short)'), re.M)
        name = f'run{max(map(int, runs), default=0) + 1}-{datetime.date.today().isoformat()}'
        # The staged template is rebuilt each run. An install may gitignore it, and a pathspec
        # naming an ignored path fails the add, so drop it from the index instead.
        git(dest, 'add', '-A')
        git(dest, 'rm', '-r', '-q', '--cached', '--ignore-unmatch', '.nds')
        git(dest, '-c', 'user.name=rig', '-c', 'user.email=rig@localhost', 'commit', '-qm', f'{name} result', '--allow-empty')
        git(dest, 'branch', name)
        print('saved', name)
    # The agent may leave its own branch checked out: back to main at the baseline, and only
    # main and the saved runs stay.
    git(dest, 'checkout', '-q', '-f', '-B', 'main', 'baseline')
    for b in git(dest, 'branch', '--format=%(refname:short)').split():
        if b != 'main' and not re.match(r'run\d+-', b):
            git(dest, 'branch', '-q', '-D', b)
    git(dest, 'clean', '-fdq', '-e', 'node_modules', '-e', '.nds')  # a lock fails clean: the loop below reports it
    left = []
    for p in ('.nds', 'NDS-IQ.md'):
        p = os.path.join(dest, p)
        if os.path.isdir(p):
            shutil.rmtree(p, onerror=lambda f, path, e: left.append(path))
        elif os.path.exists(p):
            os.remove(p)
    if os.path.exists(os.path.join(dest, 'manage.py')):
        seed(dest)  # a running Django server locks db.sqlite3: stop it first
    # A server the run left on .nds/ locks it: stop that process by PID, never by name.
    print('reset to baseline' + (f'; still locked: {", ".join(left)}' if left else ''))


if __name__ == '__main__':
    a = sys.argv[1:]
    if not a or a[0] not in ('new', 'stage', 'reset'):
        sys.exit(__doc__)
    if a[0] == 'new':
        new(a[1], a[2] if len(a) > 2 else where(a[1]) if a[1] in NUMS else os.path.join('..', f'nds-rig-{a[1]}'))  # a baseline name
    elif not os.path.isdir(where(a[1])):
        sys.exit(f'no rig at {where(a[1])}: python scripts/rig.py new {a[1]}')
    elif a[0] == 'stage':
        stage(where(a[1]), a[2])
    else:
        reset(where(a[1]), '--save' in a)
