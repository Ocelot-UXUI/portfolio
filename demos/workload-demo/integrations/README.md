# Local component integration

The application picker is bundled from the local `frontend-v2` component library.
The generated bundle is loaded after the core demo initializes, so it does not block the first render.
The Vite config explicitly replaces `process.env.NODE_ENV` because the IIFE runs directly in the browser without Node globals.

To rebuild it after changing `frontend-v2`, set `CNAP_LIBRARY_ROOT` and run Vite from that library's installed dependencies:

```sh
CNAP_LIBRARY_ROOT=/path/to/frontend-v2 /path/to/frontend-v2/node_modules/.bin/vite --config ./demos/workload-demo/integrations/vite.config.mjs build
```
