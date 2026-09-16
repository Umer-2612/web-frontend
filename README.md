# web-frontend

Web app for the Interview Platform. Talks to `core-api` for authentication.

## What this app does

- `/login`: email and password sign-in.
- `/invite/[token]`: accepts an invitation (the only way to create an account), sets a
  password, and logs the new user in.
- `/dashboard`: shows the logged-in user and a logout button.

There is no signup page. Accounts are created only by accepting an invitation sent from
`core-api`.

## Prerequisites

- `git`
- `docker` and `docker compose`
- [`age`](https://github.com/FiloSottile/age) and [`direnv`](https://direnv.net):
  `brew install age direnv`

Node.js is not required on your machine, this app runs inside a container. Secrets are never
stored in this repo: this repo's `.envrc` loads them automatically from a shared local cache
populated by the `secrets-vault` repo, see that repo's README for how the cache gets there.

## Running this app

This app is normally started as part of the whole project, see the `platform` repo's README
for the one-command setup that runs every service together.

To run just this app on its own (also needs `core-api` running separately, see its README;
assumes you've already run `secrets-vault`'s `setup.sh` at least once):

```bash
direnv allow            # once per clone, trusts this repo's .envrc
docker compose up --build
```

The app is available at `http://localhost:3000`.

To run it without Docker (requires Node.js 20+ installed locally):

```bash
npm install
npm run dev
```

## Code structure

```
src/
  app/         pages (Next.js App Router): /, /login, /invite/[token], /dashboard
  components/
    ui/        shadcn/ui primitives (Button, Input, Label)
  lib/
    api.ts     typed client for every core-api endpoint this app calls
    utils.ts   the cn() class-name helper
  styles/      global CSS, Tailwind theme tokens
```

Convention: every backend call goes through `src/lib/api.ts`, never a direct `fetch` call
inside a component.
