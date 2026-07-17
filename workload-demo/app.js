const workloads = [
  { name: 'conference', version: 'v1.8.3', cluster: 'imeonline', pods: [
    ['conference-5f6b9-1234d', 'running', '192.168.10.18', 'grpc:8500', 'ENS', '7', '3d', '14.00m'],
    ['conference-5f6b9-p9wd', 'running', '192.168.10.18', 'grpc:8500', 'ENS', '5', '7d', '14.00m'],
    ['conference-5f6b9-p1234', 'running', '192.168.10.18', 'grpc:8500 +1', 'ENS', '5', '8d', '14.00m'],
    ['conference-51234-p9wqa', 'running', '192.168.10.18', 'grpc:8500 +1', 'ENS', '4', '8d', '14.00m'],
    ['conference-12349-p9wqd', 'running', '192.168.10.18', 'grpc:8500 +1', 'ENS', '2', '8d', '14.00m'],
    ['conference-12349-p9wqd', 'running', '192.168.10.18', 'grpc:8500 +1', 'ENS', '1', '1h', '14.00m'],
    ['conference-12349-p9wqd', 'error', '192.168.10.18', 'grpc:8500 +1', 'ALB', '1', '1h', '14.00m'],
    ['conference-12349-p9wqd', 'blocked', '192.168.10.18', 'grpc:8500 +2', '-', '1', '6d', '14.00m'],
    ['conference-5f6b9-p9wqa', 'running', '192.168.10.18', 'grpc:8500', 'ENS', '1', '6d', '14.00m'],
    ['conference-5f6b9-p9wqb', 'running', '192.168.10.18', 'grpc:8500', 'ENS', '1', '6d', '14.00m'],
    ['conference-5f6b9-p9wqc', 'running', '192.168.10.18', 'grpc:8500', 'ENS', '1', '6d', '14.00m']
  ] },
  { name: 'web-gateway', version: 'v2.4.1', cluster: 'edge-prod', pods: [
    ['web-gateway-7b9c4', 'running', '10.11.24.17', 'http:8080', 'ENS', '3', '12d', '32.00m'],
    ['web-gateway-7b9c5', 'running', '10.11.24.18', 'http:8080', 'ENS', '2', '12d', '31.44m'],
    ['web-gateway-7b9c6', 'running', '10.11.24.19', 'http:8080', 'ENS', '2', '12d', '30.12m'],
    ['web-gateway-7b9c7', 'error', '10.11.24.20', 'http:8080', 'ALB', '1', '2h', '4.00m']
  ] },
  { name: 'user-profile', version: 'v1.1.0', cluster: 'imeonline', pods: [
    ['user-profile-65cf2', 'blocked', '192.168.8.21', 'grpc:9000', '-', '1', '2d', '0m'],
    ['user-profile-65cf3', 'blocked', '192.168.8.22', 'grpc:9000', '-', '1', '2d', '0m']
  ] }
];

const state = { query: '', status: 'all', cluster: 'all', page: {}, pageSize: 10, collapsed: {} };
const list = document.querySelector('#workloadList');
const statusLabel = status => status === 'running' ? '运行中' : status === 'error' ? '异常' : '已屏蔽';
const filteredPods = workload => workload.pods.filter(pod =>
  (!state.query || pod[0].includes(state.query) || workload.name.includes(state.query)) &&
  (state.status === 'all' || pod[1] === state.status)
);

function rowMarkup(pod) {
  const [name, status, ip, port, exposure, restarts, age, cpu] = pod;
  const width = Math.min(92, parseInt(restarts, 10) * 11 + 12);
  return `<tr><td><input class="check" type="checkbox"></td><td>${name}</td><td><span class="status ${status}">${statusLabel(status)}</span></td><td>${ip}</td><td>${port}</td><td>${exposure}</td><td>${restarts}</td><td>${age}</td><td><span class="metric"><span class="metric-bar"><i style="width:${width}%"></i></span>${cpu}</span></td></tr>`;
}

function paginationMarkup(workload, count, current, pages) {
  if (count <= state.pageSize) return '';
  const buttons = Array.from({ length: pages }, (_, index) => {
    const page = index + 1;
    return `<button class="page-btn ${page === current ? 'current' : ''}" data-page="${page}" data-name="${workload.name}">${page}</button>`;
  }).join('');
  return `<div class="pagination"><span>${(current - 1) * state.pageSize + 1}-${Math.min(current * state.pageSize, count)} / ${count}</span><select class="page-size" aria-label="每页条数"><option value="10" ${state.pageSize === 10 ? 'selected' : ''}>10 / 页</option><option value="20" ${state.pageSize === 20 ? 'selected' : ''}>20 / 页</option></select><button class="page-btn" data-page="prev" data-name="${workload.name}" ${current === 1 ? 'disabled' : ''}>‹</button>${buttons}<button class="page-btn" data-page="next" data-name="${workload.name}" ${current === pages ? 'disabled' : ''}>›</button></div>`;
}

function cardMarkup(workload) {
  const pods = filteredPods(workload);
  const pageCount = Math.max(1, Math.ceil(pods.length / state.pageSize));
  const current = Math.min(state.page[workload.name] || 1, pageCount);
  state.page[workload.name] = current;
  const collapsed = Boolean(state.collapsed[workload.name]);
  const visibleRows = pods.slice((current - 1) * state.pageSize, current * state.pageSize).map(rowMarkup).join('');
  const body = collapsed ? '' : `<div class="table-wrap"><table class="pod-table"><thead><tr><th><input class="check" type="checkbox" aria-label="全选本页"></th><th>Pod</th><th>状态 ↕</th><th>Pod IP</th><th>端口</th><th>服务暴露</th><th>重启 ↕</th><th>存活 ↕</th><th>CPU ↕</th></tr></thead><tbody>${visibleRows}</tbody></table></div>${paginationMarkup(workload, pods.length, current, pageCount)}`;
  return `<article class="workload-card"><div class="workload-header"><button class="toggle-group" data-name="${workload.name}" aria-label="${collapsed ? '展开' : '收起'}">${collapsed ? '›' : '⌄'}</button><span class="workload-name">${workload.name}</span><span class="version-tag">Rollout</span><span class="workload-count">${workload.version}</span><span class="header-spacer"></span><div class="workload-tools"><span>共 ${pods.length} pod</span><button data-action="collapse" data-name="${workload.name}">${collapsed ? '展开' : '收起'}</button><button data-action="refresh">↻</button><button data-action="more">•••</button></div></div>${body}</article>`;
}

function render() {
  const visible = workloads.filter(workload => (state.cluster === 'all' || workload.cluster === state.cluster) && (!state.query || workload.name.includes(state.query) || filteredPods(workload).length));
  const allPods = visible.flatMap(filteredPods);
  document.querySelector('#resultSummary').textContent = `共 ${allPods.length} 个 Pod`;
  document.querySelector('#runningCount').textContent = allPods.filter(pod => pod[1] === 'running').length;
  document.querySelector('#errorCount').textContent = allPods.filter(pod => pod[1] === 'error').length;
  document.querySelector('#blockedCount').textContent = allPods.filter(pod => pod[1] === 'blocked').length;
  list.innerHTML = visible.length ? visible.map(cardMarkup).join('') : '<div class="empty-state">暂无符合条件的工作负载</div>';
}

function toast(message) { const element = document.querySelector('#toast'); element.textContent = message; element.classList.add('show'); setTimeout(() => element.classList.remove('show'), 1600); }
function resetPages() { Object.keys(state.page).forEach(key => { state.page[key] = 1; }); }

document.querySelector('#searchInput').addEventListener('input', event => { state.query = event.target.value.trim().toLowerCase(); resetPages(); render(); });
document.querySelector('#filterButton').addEventListener('click', () => document.querySelector('#filterPanel').classList.toggle('hidden'));
document.querySelectorAll('.filter-chip').forEach(button => button.addEventListener('click', () => {
  const key = button.dataset.status ? 'status' : 'cluster';
  state[key] = button.dataset[key];
  document.querySelectorAll('.filter-chip[data-' + key + ']').forEach(item => item.classList.toggle('active', item === button));
  resetPages(); render();
}));
document.querySelector('#expandAllBtn').addEventListener('click', event => {
  const closeAll = workloads.some(workload => !state.collapsed[workload.name]);
  workloads.forEach(workload => { state.collapsed[workload.name] = closeAll; });
  event.currentTarget.textContent = closeAll ? '⌃ 全部展开' : '⌄ 全部收起';
  render();
});
document.querySelector('#refreshBtn').addEventListener('click', () => toast('已刷新工作负载数据'));

list.addEventListener('click', event => {
  const toggle = event.target.closest('.toggle-group');
  if (toggle) { state.collapsed[toggle.dataset.name] = !state.collapsed[toggle.dataset.name]; render(); return; }
  const action = event.target.closest('[data-action]');
  if (action) { if (action.dataset.action === 'collapse') { state.collapsed[action.dataset.name] = !state.collapsed[action.dataset.name]; render(); } else if (action.dataset.action === 'refresh') toast('该工作负载已刷新'); else toast('更多操作将在后续版本开放'); return; }
  const pageButton = event.target.closest('[data-page]');
  if (!pageButton) return;
  const workload = workloads.find(item => item.name === pageButton.dataset.name);
  const pageCount = Math.max(1, Math.ceil(filteredPods(workload).length / state.pageSize));
  let page = state.page[workload.name] || 1;
  page = pageButton.dataset.page === 'prev' ? page - 1 : pageButton.dataset.page === 'next' ? page + 1 : Number(pageButton.dataset.page);
  state.page[workload.name] = Math.max(1, Math.min(pageCount, page)); render();
});
list.addEventListener('change', event => { if (event.target.classList.contains('page-size')) { state.pageSize = Number(event.target.value); resetPages(); render(); } });
render();
