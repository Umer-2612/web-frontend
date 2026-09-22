# web-frontend

Web app for the Interview Platform. Talks to `core-api` for authentication.

## What this app does

- `/login`: email and password sign-in. There is no signup page or invite flow: every account
  is created directly (with a real password) by a super admin (`POST /users` on `core-api`)
  and logs in here with that password from the start.
- `/dashboard`: landing page after login.
- `/dashboard/companies` (super admin only): every company on the platform, and a dialog to
  found a new one together with its first hiring manager.
- `/dashboard/team` (hiring manager only): the hiring managers in the caller's own company.
- `/dashboard/jobs`: a hiring manager's own jobs (super admin sees every company's, read-only);
  create a job with a rich-text description.
- `/dashboard/jobs/[id]`: one job — its description, bulk resume upload (drag-and-drop PDFs,
  each becomes a candidate), the candidate list, and per-candidate interview scheduling. The
  Schedule button hides once a candidate already has a session (one interview per candidate).
- `/dashboard/jobs/[id]/candidates/[candidateId]`: one candidate's full parsed resume profile
  (summary, work experience, education, skills grouped by the resume's own categories, and
  every other resume section such as projects/certificates/achievements) plus their interview
  history. Resume hyperlinks (LinkedIn, GitHub, project repos, certificate badges, ...) render
  inline on the exact resume text they're attached to, not as a separate link list.

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
  app/         pages (Next.js App Router): /, /login, /dashboard, /dashboard/companies,
               /dashboard/team, /dashboard/jobs, /dashboard/jobs/[id],
               /dashboard/jobs/[id]/candidates/[candidateId]
  components/
    layout/    dashboard shell (sidebar, header)
    ui/        shadcn/ui primitives (Button, Input, Dialog, FileDropzone, DateTimePicker,
               RichTextEditor, ...)
  lib/
    api.ts     typed client for every core-api endpoint this app calls
    utils.ts   the cn() class-name helper
  styles/      global CSS, Tailwind theme tokens
```

Convention: every backend call goes through `src/lib/api.ts`, never a direct `fetch` call
inside a component.
