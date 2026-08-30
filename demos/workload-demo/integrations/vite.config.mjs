import path from 'node:path';
import {fileURLToPath} from 'node:url';

const integrationDirectory = path.dirname(fileURLToPath(import.meta.url));
const libraryDirectory = process.env.CNAP_LIBRARY_ROOT;
if (!libraryDirectory) {
    throw new Error('Set CNAP_LIBRARY_ROOT to the local frontend-v2 directory before building.');
}

const {defineConfig} = await import(path.join(libraryDirectory, 'node_modules/vite/dist/node/index.js'));
const {default: react} = await import(path.join(libraryDirectory, 'node_modules/@vitejs/plugin-react/dist/index.js'));

export default defineConfig({
    root: integrationDirectory,
    plugins: [react()],
    define: {
        'process.env.NODE_ENV': JSON.stringify('production'),
    },
    resolve: {
        alias: {
            '@': path.join(libraryDirectory, 'src'),
            '@cnap-application-dropdown': path.join(
                libraryDirectory,
                'src/routers/AppLayout/topNavigation/breadcrumb/ApplicationDropdown.tsx',
            ),
            react: path.join(libraryDirectory, 'node_modules/react'),
            'react-dom': path.join(libraryDirectory, 'node_modules/react-dom'),
        },
    },
    build: {
        outDir: path.resolve(integrationDirectory, '../components'),
        emptyOutDir: false,
        lib: {
            entry: path.join(integrationDirectory, 'application-dropdown-entry.jsx'),
            formats: ['iife'],
            name: 'CnapApplicationDropdown',
            fileName: () => 'cnap-application-dropdown.bundle.js',
        },
        rollupOptions: {
            output: {
                inlineDynamicImports: true,
            },
        },
    },
});
