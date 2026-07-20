# Transfer to kerbachi/zk-fortnite

These files belong in https://github.com/kerbachi/zk-fortnite (repo root).

This folder exists only because the Cloud Agent that authored the spec was bound to `yk-tetris` and could not push to `zk-fortnite`.

## Publish (from a machine or agent with write access to zk-fortnite)

```bash
git clone https://github.com/kerbachi/zk-fortnite.git
cd zk-fortnite
# copy contents of this folder (except TRANSFER.md) to repo root
cp -a /path/to/yk-tetris/zk-fortnite-transfer/{README.md,CHANGELOG.md,.gitignore,docs} .
git add -A
git commit -m "Add zk-fortnite game specification"
git push -u origin main
```

Then delete this `zk-fortnite-transfer/` folder from yk-tetris.
