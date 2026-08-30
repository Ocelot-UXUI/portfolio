import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const dropdownBundle = readFileSync(new URL('../components/cnap-application-dropdown.bundle.js', import.meta.url), 'utf8');
const viteConfig = readFileSync(new URL('../integrations/vite.config.mjs', import.meta.url), 'utf8');

test('the optional application dropdown does not block the core demo initialization', () => {
  assert.match(html, /<script src="\.\/app\.js\?v=[^"]+"><\/script>/);
  assert.doesNotMatch(
    html,
    /<script src="\.\/components\/cnap-application-dropdown\.bundle\.js\?v=[^"]+"><\/script>/,
    'the 951 KB application dropdown bundle must be loaded after the initial render',
  );
  assert.match(
    html,
    /data-deferred-src="\.\/components\/cnap-application-dropdown\.bundle\.js\?v=[^"]+"/,
  );
});

test('the application dropdown has one rendering implementation', () => {
  assert.doesNotMatch(app, /function renderApplicationMenu\(/);
  assert.doesNotMatch(app, /data-application-search|data-application-tab|data-application-select/);
  assert.match(app, /window\.cnapApplicationDropdownReady/);
  assert.match(app, /dataset\.menuType='application'/);
});

test('the browser bundle does not depend on the Node process global', () => {
  assert.doesNotMatch(dropdownBundle, /process\.env\.NODE_ENV/);
  assert.match(viteConfig, /'process\.env\.NODE_ENV': JSON\.stringify\('production'\)/);
});
