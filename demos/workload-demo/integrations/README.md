# Local component integration

The application picker is bundled from the local `frontend-v2` component library.
The generated bundle is already included by `index.html`, so the demo can still be opened directly as a local file.

To rebuild it after changing `frontend-v2`, set `CNAP_LIBRARY_ROOT` and run Vite from that library's installed dependencies:

```sh
CNAP_LIBRARY_ROOT=/path/to/frontend-v2 /path/to/frontend-v2/node_modules/.bin/vite --config ./demos/workload-demo/integrations/vite.config.mjs build
```
