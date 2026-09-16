# web-frontend

The actual app — candidate + hiring-manager UI. Video panel, DSA editor panel, VSCode/preview panel, switchable mid-call.

Full plan: see the `platform` repo's README (sibling folder).

**Build order:** #5 — last, ties everything together.

**Lift from:**
- `Interview-Platform-Frontend` — dashboard shell, auth, `InterviewRoom.tsx` (video), `api.ts` token calls
- `open-web-agent/src/components/workspace/WorkspaceClient.tsx` — tabbed iframe panel switcher pattern (VSCode / Preview); add a Video tab alongside it
- `Codeinterview/frontend/src/components/Editor.jsx` — Monaco + Yjs wiring for the DSA panel
