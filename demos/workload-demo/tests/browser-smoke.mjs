import assert from 'node:assert/strict';

const targets = await fetch('http://127.0.0.1:9222/json').then(response => response.json());
const target = targets.find(item => item.type === 'page' && item.url.includes('/demos/workload-demo/index.html'));
assert.ok(target, 'workload demo page was not found in the running browser');

const socket = new WebSocket(target.webSocketDebuggerUrl);
const pending = new Map();
const errors = [];
let sequence = 0;

socket.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if(message.method === 'Runtime.exceptionThrown'){
    const details = message.params.exceptionDetails;
    errors.push(details.exception?.description || `${details.text} (${details.url}:${details.lineNumber})`);
  }
  if(message.method === 'Log.entryAdded' && message.params.entry.level === 'error'){
    const entry = message.params.entry;
    if(!entry.url?.endsWith('/favicon.ico'))errors.push(`${entry.text}${entry.url ? ` (${entry.url})` : ''}`);
  }
  if(!message.id)return;
  const request = pending.get(message.id);
  if(!request)return;
  pending.delete(message.id);
  if(message.error)request.reject(new Error(message.error.message));
  else request.resolve(message.result);
});

await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

function send(method, params = {}){
  const id = ++sequence;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

async function evaluate(expression){
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if(result.exceptionDetails)throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

await send('Runtime.enable');
await send('Log.enable');
await send('Page.enable');
await send('Page.reload', { ignoreCache: true });
await new Promise(resolve => setTimeout(resolve, 2500));
errors.length = 0;

const initial = await evaluate(`({
  groups: document.querySelectorAll('#clusterGroups .cluster-group').length,
  exposureLabel: document.querySelector('[data-app-nav="exposure"] span')?.textContent,
  dropdownReady: typeof window.mountCnapApplicationDropdown === 'function',
  readinessPromise: typeof window.cnapApplicationDropdownReady,
  deferredMarker: Boolean(document.querySelector('[data-deferred-src]')),
  dropdownResources: performance.getEntriesByType('resource').filter(entry => entry.name.includes('cnap-application-dropdown')).map(entry => entry.name),
  scriptSources: Array.from(document.scripts).map(script => script.src || script.dataset.deferredSrc || 'inline').filter(source => source.includes('cnap-application-dropdown'))
})`);
if(!initial.dropdownReady)console.log({ initial, errors });
assert.equal(initial.groups, 7);
assert.equal(initial.exposureLabel, '流量接入');
assert.equal(initial.dropdownReady, true);

await evaluate(`document.querySelector('[data-context="application"]').click()`);
await new Promise(resolve => setTimeout(resolve, 100));

const menu = await evaluate(`({
  hidden: document.querySelector('#actionMenu').classList.contains('hidden'),
  type: document.querySelector('#actionMenu').dataset.menuType,
  reactRoot: Boolean(document.querySelector('#actionMenu [data-cnap-react-root="application-dropdown"]')),
  legacyMenu: Boolean(document.querySelector('#actionMenu [data-application-search]'))
})`);
assert.equal(menu.hidden, false);
assert.equal(menu.type, 'application');
assert.equal(menu.reactRoot, true);
assert.equal(menu.legacyMenu, false);
assert.deepEqual(errors, []);

socket.close();
console.log('workload demo browser smoke test passed');
