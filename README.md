# Daily — test-executor

A responsive to-do list built with HTML, CSS, and JavaScript. Add, edit, complete, filter, delete, and clear completed tasks. Tasks are saved in this browser's local storage; they do not sync across devices. Clearing site data removes saved tasks. Avoid editing in multiple tabs at once: the last saved list wins.

No build, backend, API key, or npm install is needed. Google Fonts are optional; system fonts work if they are unavailable.

## Run locally

```sh
python3 -m http.server 8000
```

Open http://localhost:8000. Use localhost or HTTPS so the browser's UUID API is available.

## Publish with GitHub Pages

1. Open this repository's **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Choose **agent/todo-app**, folder **/ (root)**, and click **Save**.
4. Wait for GitHub's Pages deployment to finish. The Pages settings screen will show the live URL: `https://argus-runtime.github.io/test-executor/`.

You can publish directly from the app branch while the pull request is open. If you later merge the pull request, switch the Pages source to `main` before deleting the app branch.

Free GitHub Pages hosting requires a public repository. Hosting from a private repository requires a supported paid GitHub plan, and the resulting site is generally public.

All asset URLs are relative, so the app works at the `/test-executor/` project path. The `.nojekyll` file serves the static files directly.
