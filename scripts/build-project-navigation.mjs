import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cssBundlePath = path.join(root, "styles/project-navigation.css");
const jsBundlePath = path.join(root, "scripts/project-navigation.js");
const cssSourceDir = path.join(root, "styles/project-navigation");
const jsSourceDir = path.join(root, "scripts/project-navigation");
const migrate = process.argv.includes("--migrate");
const check = process.argv.includes("--check");

const cssSources = [
  "core.css",
  "demo.css",
  "system.css",
  "content-navigation.css",
];

const jsSources = [
  "home-history.js",
  "tabs-and-demo.js",
  "section-rail.js",
  "project-sequence.js",
];

function splitAt(source, marker) {
  const index = source.indexOf(marker);
  assert.notEqual(index, -1, `Missing split marker: ${marker}`);
  return [source.slice(0, index), source.slice(index)];
}

function wrapModule(source) {
  return `(() => {\n${source.trim()}\n})();\n`;
}

async function migrateSources() {
  const currentCss = await readFile(cssBundlePath, "utf8");
  const currentJs = await readFile(jsBundlePath, "utf8");

  let remainingCss = currentCss;
  const cssParts = [];
  for (const marker of [
    "/* Demo pages use a dedicated in-flow top bar",
    "/* Shared project-navigation specification.",
    "/* Codex-inspired section rail",
  ]) {
    const [part, rest] = splitAt(remainingCss, marker);
    cssParts.push(part);
    remainingCss = rest;
  }
  cssParts.push(remainingCss);

  const jsBody = currentJs
    .replace(/^\(\(\) => \{\s*/, "")
    .replace(/\s*\}\)\(\);\s*$/, "");
  let remainingJs = jsBody;
  const jsParts = [];
  for (const marker of [
    "const shuffle =",
    "const collectSectionRailTargets =",
    "const projectSequence =",
  ]) {
    const [part, rest] = splitAt(remainingJs, marker);
    jsParts.push(part);
    remainingJs = rest;
  }
  jsParts.push(remainingJs);

  await mkdir(cssSourceDir, { recursive: true });
  await mkdir(jsSourceDir, { recursive: true });
  await Promise.all([
    ...cssSources.map((file, index) => writeFile(path.join(cssSourceDir, file), cssParts[index].trim() + "\n")),
    ...jsSources.map((file, index) => writeFile(path.join(jsSourceDir, file), wrapModule(jsParts[index]))),
  ]);
}

async function buildBundle(sourceDir, sourceFiles) {
  const parts = await Promise.all(sourceFiles.map((file) => readFile(path.join(sourceDir, file), "utf8")));
  return parts.map((part) => part.trimEnd()).join("\n\n") + "\n";
}

if (migrate) await migrateSources();

const [cssBundle, jsBundle] = await Promise.all([
  buildBundle(cssSourceDir, cssSources),
  buildBundle(jsSourceDir, jsSources),
]);

if (check) {
  const [currentCss, currentJs] = await Promise.all([
    readFile(cssBundlePath, "utf8"),
    readFile(jsBundlePath, "utf8"),
  ]);
  assert.equal(currentCss, cssBundle, "project-navigation.css is out of date; run npm run build:navigation");
  assert.equal(currentJs, jsBundle, "project-navigation.js is out of date; run npm run build:navigation");
  console.log("project navigation bundles are up to date");
} else {
  await Promise.all([
    writeFile(cssBundlePath, cssBundle),
    writeFile(jsBundlePath, jsBundle),
  ]);
  console.log("project navigation bundles built");
}
