import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const styles = await readFile(new URL('../styles.css', import.meta.url), 'utf8');

test('primary navigation utilities stay pinned to the bottom', () => {
  assert.match(
    styles,
    /\.primary-bottom\s*\{[^}]*margin:\s*auto auto 0\s*!important/s,
  );
});

test('the workload demo does not reserve an unused root scrollbar gutter', () => {
  assert.match(
    styles,
    /html:has\(body\.demo-nav-capable\s*>\s*\.portfolio-project-nav\.project-nav\)\s*\{[^}]*scrollbar-gutter:\s*auto/s,
  );
});

test('runtime configuration fills the workspace at the compact desktop breakpoint', () => {
  assert.match(styles, /@media\s*\(min-width:\s*701px\)\s*and\s*\(max-width:\s*900px\)/);
  assert.match(
    styles,
    /\.workspace:has\(>\s*#runtimePage:not\(\.hidden\)\)\s*\{[^}]*padding:\s*0/s,
  );
  assert.match(
    styles,
    /#runtimePage\.runtime-page\s*\{[^}]*height:\s*100%[^}]*min-height:\s*0[^}]*margin:\s*0/s,
  );
  assert.match(
    styles,
    /#runtimePage \.runtime-tree\s*\{[^}]*height:\s*100%[^}]*min-height:\s*0[^}]*overflow-y:\s*auto/s,
  );
});

test('runtime page title uses the same heading hierarchy as workload pages', () => {
  assert.match(
    styles,
    /#runtimePage \.runtime-page-header h1\s*\{[^}]*font-size:\s*24px[^}]*line-height:\s*36px[^}]*font-weight:\s*600/s,
  );
});

test('runtime configuration fills the workspace through the 1100px desktop breakpoint', () => {
  assert.match(styles, /@media\s*\(min-width:\s*701px\)\s*and\s*\(max-width:\s*1100px\)/);
  assert.match(
    styles,
    /@media\s*\(min-width:\s*701px\)\s*and\s*\(max-width:\s*1100px\)\s*\{[^]*?\.workspace:has\(>\s*#runtimePage:not\(\.hidden\)\)\s*\{[^}]*padding:\s*0/s,
  );
});
