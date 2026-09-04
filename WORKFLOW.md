# How changes reach gradprocessai.com

Nothing reaches the live site except through this path. Test locally, then push.

```
edit code  →  localhost:3000  →  npm run verify  →  push to main  →  Vercel  →  gradprocessai.com
```

## 1. Run it locally

```bash
cd ~/Downloads/gradprocess-ai
npm run dev
```

Open http://localhost:3000. This is a private copy on your Mac — the live site
is untouched no matter what happens here. Leave the terminal open while working;
closing it stops the server.

## 2. Verify before pushing

```bash
npm run verify
```

Runs the type checker, the full test suite, and a production build — the same
build Vercel runs. If this passes, the deploy will not fail for those reasons.
Run the parts individually when useful:

```bash
npm run typecheck   # types only
npm test            # tests only
npm run build       # production build only
```

## 3. Publish

```bash
git add -A
git commit -m "what changed and why"
git push origin main
```

Vercel deploys automatically, usually within about two minutes. Watch it at
vercel.com → the project → Deployments.

## 4. Confirm it landed

Load https://gradprocessai.com and check the change is actually there. A green
Vercel status means the build succeeded, not that the change works.

---

## For bigger or riskier changes

Use the `develop` branch so the live site stays frozen while you work:

```bash
git checkout develop
git push origin develop        # Vercel builds a private preview URL
# ...when it's proven...
git checkout main
git merge develop
git push origin main           # now it goes live
```

Realign `develop` after a merge so the next piece of work starts clean:

```bash
git branch -f develop main && git push origin develop
```

## Database changes

The app and the database are deployed separately, and the database is shared by
localhost and production. A schema change must be applied to Supabase **before**
the code that depends on it goes live, or production breaks between the two.

1. Add the SQL as a new file in `supabase/` (never edit an applied migration)
2. Run it in the Supabase SQL Editor
3. Then push the code

Write migrations to be idempotent (`IF NOT EXISTS`, `DROP ... IF EXISTS`) so a
re-run is harmless.

## Secrets

`.env.local` is for your Mac and is git-ignored — it must never be committed.
Production reads its own copy from Vercel → Settings → Environment Variables.
Changing a value there requires a redeploy to take effect.

## If a deploy breaks the live site

```bash
git revert HEAD
git push origin main
```

This ships the previous working version as a new commit. Vercel's dashboard can
also instantly roll back: Deployments → an older successful one → Promote to
Production.
