const pods = [
  ['pod-1','…nference-5f6b9-1234d','running','192.168.10.18','grpc:8500','ENS','7','3d','99%','9.7Gi','imeonline'],
  ['pod-2','…nference-5f6b9-p9wd','running','192.168.10.18','grpc:8500','ENS','5','7d','85%','9.1Gi','imeonline'],
  ['pod-3','…nference-5f6b9-p1234','running','192.168.10.18','grpc:8500 +1','ENS','5','8d','91%','9.6Gi','edge-prod'],
  ['pod-4','…nference-51234-p9wqa','blocked','192.168.10.18','grpc:8500 +1','ENS','4','8d','91%','9.4Gi','edge-prod'],
  ['pod-5','…nference-12349-p9wqd','blocked','192.168.10.18','grpc:8500 +1','ENS','2','8d','12%','2.3Gi','imeonline'],
  ['pod-6','…nference-12349-p9wqd','running','192.168.10.18','grpc:8500 +1','ENS','1','1h','12%','2.1Gi','edge-prod'],
  ['pod-7','…nference-12349-p9wqd','running','192.168.10.18','grpc:8500 +1','ALB','1','1h','12%','2.1Gi','imeonline'],
  ['pod-8','…nference-12349-p9wqd','error','192.168.10.18','grpc:8500 +2','-','1','6d','8%','1.2Gi','edge-prod'],
  ['pod-9','…nference-5f6b9-p9wqa','running','192.168.10.19','grpc:8500','ENS','1','6d','22%','3.2Gi','imeonline'],
  ['pod-10','…nference-5f6b9-p9wqb','running','192.168.10.20','grpc:8500','ENS','1','6d','18%','2.8Gi','edge-prod'],
  ['pod-11','…nference-5f6b9-p9wqc','running','192.168.10.21','grpc:8500','ENS','1','6d','16%','2.6Gi','imeonline']
];

const state = { status:'all', cluster:'all', query:'', page:1, pageSize:10, collapsedClusters:new Set(), selected:new Set(), pausedPods:new Set(), executing:false };
const labels = { running:'运行中', error:'异常', blocked:'已摘流' };
const clusterLabels = { imeonline:'imeonline', 'edge-prod':'edge-prod' };
const clusterGroups = document.querySelector('#clusterGroups');
const pagination = document.querySelector('#pagination');
const menu = document.querySelector('#actionMenu');
const modalBackdrop = document.querySelector('#modalBackdrop');
const modal = document.querySelector('#actionModal');
const detailBackdrop = document.querySelector('#detailBackdrop');
const instanceModal = document.querySelector('#instanceModal');
const historyDrawer = document.querySelector('#historyDrawer');
const historyList = document.querySelector('#historyList');
const bulkBar = document.querySelector('#bulkBar');
const icon = name => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
const actions = {
  restart:{label:'应用重启', icon:'power', detail:'将依次重启目标实例，短暂中断可能影响正在处理的请求。'},
  horizontal:{label:'横向扩缩', icon:'unfold', detail:'将调整应用实例数量，变更完成前新实例不会接收流量。', field:'期望实例数', value:'6'},
  vertical:{label:'纵向扩缩', icon:'unfold', detail:'将更新实例 CPU 和内存规格，变更期间实例会滚动重建。', field:'CPU 配额', value:'4 c'},
  rebuild:{label:'删除/重建', icon:'refresh', detail:'将删除并重建目标实例，实例上的临时数据不会保留。'},
  block:{label:'屏蔽', icon:'apps', detail:'将停止向目标实例分配新流量，已建立连接不受影响。'},
  route:{label:'接流', icon:'unfold', detail:'将恢复向目标实例分配新流量。'},
  grant:{label:'临时授权', icon:'user', detail:'将创建 24 小时有效的临时访问授权。'},
  delete:{label:'删除并缩容', icon:'apps', detail:'将删除目标实例并降低副本数，此操作可能影响服务容量。', fails:true}
};
let pendingAction = null;
let history = [
  {label:'应用重启', target:'Payment-api', status:'success', time:'刚刚', message:'已完成 5 个实例的滚动重启。'},
  {label:'删除并缩容', target:'Payment-api', status:'failed', time:'今天 10:24', message:'保护策略阻止缩容：当前可用实例数不足。'}
];

function filteredPods(){
  return pods.filter(pod => {
    const name=pod[1];
    const status=pod[2];
    const ip=pod[3];
    const cluster=pod[10];
    return (state.status === 'all' || status === state.status) &&
      (state.cluster === 'all' || cluster === state.cluster) &&
      (!state.query || name.toLowerCase().includes(state.query) || ip.includes(state.query));
  });
}

function rowMarkup(pod){
  const [id,name,status,ip,port,exposure,restarts,age,cpu,memory] = pod;
  const hot = parseInt(cpu,10) >= 80 ? 'metric-hot' : 'metric-cool';
  const rowActions = [['restart','重启'],['rebuild','删除/重建'],['block','屏蔽'],['route','接流'],['grant','临时授权']]
    .map(([key,label])=>`<button type="button" data-action="${key}" data-pod="${id}" aria-label="${label}" title="${label}">${icon(actions[key].icon)}</button>`).join('');
  return `<tr><td><input class="pod-check" data-pod="${id}" type="checkbox" ${state.selected.has(id)?'checked':''} aria-label="选择 ${name}"></td><td title="${name}"><button class="pod-link" data-instance-detail="${id}">${name}</button></td><td><span class="status-tag ${status}">${labels[status]}</span></td><td>${ip}</td><td>${port}</td><td><span class="exposure-dot"></span>${exposure}</td><td class="${restarts >= 4 ? 'metric-hot' : ''}">${restarts}</td><td>${age}</td><td class="${hot}"><span class="cpu-mark">${icon('cpu')}</span>${cpu}</td><td><span class="memory-mark">${icon('memory')}</span>${memory}</td><td><span class="row-actions">${rowActions}<button type="button" data-row-more="${id}" aria-label="更多操作" title="更多操作">${icon('more')}</button></span></td></tr>`;
}

function tableMarkup(cluster,podsInCluster){
  const selected=podsInCluster.every(([id])=>state.selected.has(id));
  const partial=podsInCluster.some(([id])=>state.selected.has(id));
  const summary={running:0,error:0,blocked:0};
  podsInCluster.forEach(([, ,status])=>summary[status]++);
  const collapsed=state.collapsedClusters.has(cluster);
  return `<section class="cluster-group ${collapsed?'collapsed':''}" data-cluster="${cluster}">
    <header class="cluster-header"><button class="cluster-toggle" data-cluster-toggle="${cluster}" aria-label="${collapsed?'展开':'收起'}">${icon(collapsed?'chevron-right':'chevron-down')}</button><div class="cluster-name"><strong>${clusterLabels[cluster]}</strong><span>集群</span></div><div class="cluster-summary"><span>运行中 <b class="green">${summary.running}</b></span><span>异常 <b class="red">${summary.error}</b></span><span>已摘流 <b class="amber">${summary.blocked}</b></span><i></i><span>共 <b>${podsInCluster.length}</b> pod</span><button class="cluster-more" data-cluster-more="${cluster}" aria-label="集群更多操作">${icon('more')}</button></div></header>
    <div class="cluster-content"><div class="workload-group"><div class="group-header"><strong>Payment-api</strong><span class="rollout">Rollout</span><span class="versions">v1.8.3&nbsp; 等3个版本</span></div><div class="table-scroll"><table class="pod-table"><thead><tr><th><input class="cluster-select" data-cluster-select="${cluster}" type="checkbox" ${selected?'checked':''} ${partial&&!selected?'data-indeterminate="true"':''} aria-label="全选 ${clusterLabels[cluster]} 集群"></th><th>Pod</th><th>状态<span class="sort-icon">${icon('chevron-up')}</span></th><th>Pod IP</th><th>端口</th><th>服务暴露</th><th>重启<span class="sort-icon">${icon('chevron-up')}</span></th><th>存活<span class="sort-icon">${icon('chevron-up')}</span></th><th>CPU<span class="sort-icon">${icon('chevron-up')}</span></th><th>内存</th><th>操作</th></tr></thead><tbody>${podsInCluster.map(rowMarkup).join('')}</tbody></table></div></div></div>
  </section>`;
}

function visiblePods(){ const result=filteredPods(); return result.slice((state.page-1)*state.pageSize,state.page*state.pageSize); }
function updateSelection(){
  const count=state.selected.size;
  document.querySelector('#selectedCount').textContent=count;
  bulkBar.classList.toggle('hidden',count===0);
  document.querySelectorAll('[data-indeterminate="true"]').forEach(input=>input.indeterminate=true);
}

function render(){
  const result = filteredPods();
  const pageCount = Math.max(1,Math.ceil(result.length/state.pageSize));
  state.page = Math.min(state.page,pageCount);
  const visible=visiblePods();
  const byCluster=Object.keys(clusterLabels).map(cluster=>[cluster,visible.filter(pod=>pod[10]===cluster)]).filter(([,items])=>items.length);
  clusterGroups.innerHTML=byCluster.map(([cluster,items])=>tableMarkup(cluster,items)).join('');
  document.querySelector('#allCount').textContent = String(pods.length).padStart(2,'0');
  document.querySelector('#runningCount').textContent = String(pods.filter(([, ,status])=>status==='running').length).padStart(2,'0');
  document.querySelector('#errorCount').textContent = String(pods.filter(([, ,status])=>status==='error').length).padStart(2,'0');
  document.querySelector('#blockedCount').textContent = String(pods.filter(([, ,status])=>status==='blocked').length).padStart(2,'0');
  document.querySelector('#emptyState').classList.toggle('hidden',result.length!==0);
  const buttons=Array.from({length:pageCount},(_,index)=>`<button class="page-btn ${index+1===state.page?'current':''}" data-page="${index+1}">${index+1}</button>`).join('');
  pagination.innerHTML=pageCount>1?`<button class="page-btn" data-page="prev" aria-label="上一页" ${state.page===1?'disabled':''}>${icon('chevron-right')}</button>${buttons}<button class="page-btn" data-page="next" aria-label="下一页" ${state.page===pageCount?'disabled':''}>${icon('chevron-right')}</button><select class="page-size" aria-label="每页条数"><option value="10" ${state.pageSize===10?'selected':''}>10 条/页</option><option value="20" ${state.pageSize===20?'selected':''}>20 条/页</option></select>`:'';
  updateSelection();
}

function setClusterCollapsed(cluster,collapsed){
  collapsed?state.collapsedClusters.add(cluster):state.collapsedClusters.delete(cluster);
  render();
}
function setAllClustersCollapsed(collapsed){ Object.keys(clusterLabels).forEach(cluster=>setClusterCollapsed(cluster,collapsed)); }

function toast(message){ const el=document.querySelector('#toast'); el.textContent=message; el.classList.add('show'); window.setTimeout(()=>el.classList.remove('show'),1800); }
function actionTarget(ids){ return ids?.length ? `${ids.length} 个实例` : 'Payment-api'; }
function setActionControls(disabled){ document.querySelectorAll('.title-actions button,[data-action],[data-bulk-action]').forEach(button=>button.disabled=disabled); }
function closeModal(){ if(!state.executing){ modalBackdrop.classList.add('hidden'); modal.innerHTML=''; pendingAction=null; } }

function openConfirm(actionKey, ids=[]){
  const action=actions[actionKey];
  pendingAction={actionKey,ids};
  const field=action.field?`<label class="modal-field">${action.field}<input id="actionValue" value="${action.value}" aria-label="${action.field}"></label>`:'';
  modal.innerHTML=`<div class="modal-title-row"><span class="modal-icon">${icon(action.icon)}</span><div><h2 id="modalTitle">确认${action.label}</h2><p>目标：${actionTarget(ids)}</p></div></div><div class="risk-note">${action.detail}</div>${field}<label class="risk-check"><input id="riskAcknowledged" type="checkbox">我已了解该操作可能影响线上服务</label><div class="modal-actions"><button class="secondary" id="cancelActionBtn">取消</button><button class="primary" id="confirmActionBtn" disabled>确认执行</button></div>`;
  modalBackdrop.classList.remove('hidden');
  document.querySelector('#riskAcknowledged').addEventListener('change',event=>{document.querySelector('#confirmActionBtn').disabled=!event.target.checked;});
  document.querySelector('#cancelActionBtn').addEventListener('click',closeModal);
  document.querySelector('#confirmActionBtn').addEventListener('click',executeAction);
}

function executeAction(){
  if(!pendingAction) return;
  const {actionKey,ids}=pendingAction;
  const action=actions[actionKey];
  state.executing=true; setActionControls(true);
  modal.innerHTML=`<div class="execution-state"><span class="spinner">${icon('refresh')}</span><h2>正在${action.label}</h2><p>正在处理${actionTarget(ids)}，请勿关闭当前页面。</p><div class="progress-track"><span></span></div></div>`;
  window.setTimeout(()=>finishAction(actionKey,ids),1100);
}

function finishAction(actionKey,ids){
  const action=actions[actionKey];
  const failed=Boolean(action.fails);
  const record={label:action.label,target:actionTarget(ids),status:failed?'failed':'success',time:'刚刚',message:failed?'保护策略阻止缩容：当前可用实例数不足，请先扩容或解除保护策略。':`已完成${actionTarget(ids)}的${action.label}。`};
  history.unshift(record); renderHistory(); state.executing=false; setActionControls(false);
  modal.innerHTML=failed
    ? `<div class="result-state failed"><span class="result-mark">!</span><h2>${action.label}失败</h2><p>${record.message}</p><div class="modal-actions"><button class="secondary" id="viewHistoryBtn">查看变更记录</button><button class="primary" id="retryActionBtn">重试</button></div></div>`
    : `<div class="result-state success"><span class="result-mark">✓</span><h2>${action.label}已提交</h2><p>${record.message}</p><div class="modal-actions"><button class="secondary" id="closeResultBtn">关闭</button><button class="primary" id="viewHistoryBtn">查看变更记录</button></div></div>`;
  document.querySelector('#viewHistoryBtn').addEventListener('click',()=>{modalBackdrop.classList.add('hidden');openHistory();});
  const close=document.querySelector('#closeResultBtn'); if(close) close.addEventListener('click',closeModal);
  const retry=document.querySelector('#retryActionBtn'); if(retry) retry.addEventListener('click',()=>openConfirm(actionKey,ids));
  if(!failed) toast(`${action.label}已提交`);
}

function renderHistory(){ historyList.innerHTML=history.map(item=>`<article class="history-item ${item.status}"><div><strong>${item.label}</strong><span>${item.target}</span></div><p>${item.message}</p><time>${item.time}</time></article>`).join(''); }
function openHistory(){ renderHistory(); historyDrawer.classList.remove('hidden'); }

function logLines(name){
  return Array.from({length:18},(_,index)=>`<div><i>${String(index+1).padStart(2,'0')}</i><time>2026-06-04 04:${String(20+index).padStart(2,'0')}:06</time><span class="log-level ${index%7===0?'warn':'info'}">${index%7===0?'WARN':'INFO'}</span><code>${name} request completed, status=200 latency=${18+index}ms</code></div>`).join('');
}
function instanceMarkup(pod,tab='detail'){
  const [id,name,status,ip,port,,restarts,age,cpu,memory,cluster]=pod;
  const paused=state.pausedPods.has(id);
  const tabs=[['detail','详细信息'],['logs','日志'],['terminal','终端'],['events','事件']];
  const tabBar=tabs.map(([key,label])=>`<button class="${key===tab?'active':''}" data-detail-tab="${key}">${label}</button>`).join('');
  const details=`<div class="pod-detail-page"><section class="pod-summary"><div><span>状态</span><strong class="success-text">${paused?'已暂停':labels[status]}</strong></div><div><span>就绪</span><strong>是</strong></div><div><span>重启</span><strong>${restarts}</strong></div><div class="survival-field" title="开始时间：2026-06-04 04:20:06"><span>存活时间</span><strong>${age}</strong></div><div><span>Pod IP</span><strong>${ip}</strong></div><div><span>资源用量</span><strong>${cpu} / ${memory}</strong></div></section><section class="container-section"><div class="section-heading"><h3>容器</h3><button data-yaml-open="${id}">Pod YAML ${icon('chevron-right')}</button></div><article class="container-card"><header><span class="container-dot"></span><strong>ranking-inference</strong><em>主容器</em><span class="status-tag running">运行中</span></header><div class="container-stats"><span>类型<strong>普通</strong></span><span>状态<strong>运行中</strong></span><span>就绪<strong>是</strong></span><span>重启<strong>0</strong></span><span>存活<strong>8d</strong></span><span>端口<strong>3</strong></span><span>挂载<strong>3</strong></span></div><dl class="container-info"><div><dt>镜像</dt><dd>registry.internal/payments/api-gateway:v2.2.5</dd></div><div><dt>镜像拉取策略</dt><dd>IfNotPresent</dd></div><div class="wide"><dt>启动命令</dt><dd>/app/server --config=/etc/app/config/server.yaml --port=8500</dd></div></dl></article><div class="minor-containers"><button><span class="container-dot sidecar"></span><strong>ranking-inference</strong><small>Sidecar</small></button><button><span class="container-dot init"></span><strong>ranking-inference</strong><small>Init</small></button></div></section><section class="compact-table"><h3>挂载 <b>3</b></h3><div class="table-head"><span>容器名称</span><span>挂载路径</span><span>日志路径</span></div>${['go-demo','go-demo','go-demo'].map((item,index)=>`<div><span>${item}</span><span>/data/app/${index+1}</span><span>/home/work/logs</span></div>`).join('')}</section><section class="compact-table"><h3>环境变量 <b>3</b></h3><div class="table-head"><span>容器名称</span><span>变量名称</span><span>变量值</span></div><div><span>go-demo</span><span>ENV</span><span>production</span></div><div><span>go-demo</span><span>LOG_LEVEL</span><span>info</span></div><div><span>go-demo</span><span>PORT</span><span>8500</span></div></section></div>`;
  const logs=`<div class="tool-pane"><div class="tool-toolbar"><span>当前运行</span><button data-log-mode="latest">最新日志</button><label>${icon('search')}<input placeholder="搜索日志"></label><button data-log-fullscreen="${id}" title="全屏">${icon('unfold')}</button></div><div class="terminal-screen log-screen">${logLines(name)}</div></div>`;
  const terminal=`<div class="tool-pane"><div class="tool-toolbar"><select><option>ranking-inference</option></select><span>/bin/bash</span><button>${icon('refresh')}重新连接</button></div><div class="terminal-screen"><p><b>root@${name.slice(-8)}:</b>/app# ps aux</p><p>PID USER COMMAND</p><p>1 root /app/server --config=/etc/app/config/server.yaml</p><p>27 root /bin/bash</p><p><b>root@${name.slice(-8)}:</b>/app# <span class="cursor"></span></p></div></div>`;
  const events=`<div class="event-pane"><div class="event-toolbar"><select><option>全部类型</option><option>Normal</option><option>Warning</option></select><button>${icon('refresh')}刷新</button></div><div class="event-table"><div class="table-head"><span>类型</span><span>原因</span><span>信息</span><span>时间</span></div><div><span class="success-text">Normal</span><span>Started</span><span>Started container ranking-inference</span><span>2 分钟前</span></div><div><span class="success-text">Normal</span><span>Pulled</span><span>Container image already present on machine</span><span>2 分钟前</span></div><div><span class="warning-text">Warning</span><span>Unhealthy</span><span>Readiness probe failed, retry succeeded</span><span>1 小时前</span></div></div></div>`;
  return `<header class="instance-header"><div class="instance-title-wrap"><button class="close-detail" aria-label="关闭">×</button><div><div class="instance-title"><h2 id="instanceTitle" title="${name}">${name}</h2><span class="status-tag ${paused?'blocked':status}">${paused?'已暂停':labels[status]}</span></div><p>${cluster} · ${ip}</p></div></div><div class="instance-header-actions"><button data-pause-pod="${id}">${paused?'恢复':'暂停'}</button><button data-detail-action="restart" title="重启">${icon('power')}</button><button data-detail-action="rebuild" title="删除/重建">${icon('refresh')}</button><button data-open-new="${id}" title="在新标签页打开">${icon('unfold')}</button><button title="更多">${icon('more')}</button></div></header><nav class="detail-tabs">${tabBar}</nav><div class="detail-body" data-instance-id="${id}">${tab==='detail'?details:tab==='logs'?logs:tab==='terminal'?terminal:events}</div>`;
}
function yamlMarkup(pod){
  const [id,name,,, ,,,, , ,cluster]=pod;
  return `<header class="instance-header yaml-header"><div class="instance-title-wrap"><button data-yaml-back="${id}" aria-label="返回">${icon('chevron-right')}</button><div><h2 id="instanceTitle">Pod YAML</h2><p>${name}</p></div></div><button class="close-detail" aria-label="关闭">×</button></header><div class="yaml-toolbar"><label>${icon('search')}<input placeholder="搜索YAML内容..."></label><button>复制</button></div><pre class="yaml-code"><code>apiVersion: v1\nkind: Pod\nmetadata:\n  name: ${name}\n  namespace: payment-production\n  labels:\n    app: ranking-inference\nspec:\n  nodeName: ${cluster}\n  containers:\n    - name: ranking-inference\n      image: registry.internal/payments/api-gateway:v2.2.5\n      imagePullPolicy: IfNotPresent\n      ports:\n        - containerPort: 8500\n      resources:\n        requests:\n          cpu: "2"\n          memory: 8Gi\n        limits:\n          cpu: "4"\n          memory: 12Gi\nstatus:\n  phase: Running</code></pre>`;
}
function openInstanceDetail(id,tab='detail'){ const pod=pods.find(item=>item[0]===id); if(!pod)return; instanceModal.innerHTML=instanceMarkup(pod,tab); detailBackdrop.classList.remove('hidden'); }
function closeInstanceDetail(){ detailBackdrop.classList.add('hidden'); instanceModal.innerHTML=''; }
function closeMenu(){ menu.classList.add('hidden'); menu.innerHTML=''; }
function openMenu(trigger,items){
  const rect=trigger.getBoundingClientRect();
  menu.innerHTML=items.map(item=>`<button data-menu-action="${item.key}">${item.icon?icon(item.icon):''}${item.label}</button>`).join('');
  menu.style.top=`${rect.bottom+6}px`; menu.style.left=`${Math.min(rect.left,window.innerWidth-190)}px`; menu.classList.remove('hidden');
}

function triggerAction(actionKey,ids=[]){ closeMenu(); openConfirm(actionKey,ids); }

document.querySelectorAll('.tabs button').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('.tabs button').forEach(item=>item.classList.toggle('active',item===button));
  state.status=button.dataset.status; state.page=1; document.querySelector('#statusSelect').value=state.status; render();
}));
document.querySelector('#statusSelect').addEventListener('change',event=>{state.status=event.target.value;state.page=1;document.querySelectorAll('.tabs button').forEach(item=>item.classList.toggle('active',item.dataset.status===state.status));render();});
document.querySelector('#clusterSelect').addEventListener('change',event=>{state.cluster=event.target.value;state.page=1;render();});
document.querySelector('#searchInput').addEventListener('input',event=>{state.query=event.target.value.trim().toLowerCase();state.page=1;render();});
document.querySelector('#collapseAllBtn').addEventListener('click',()=>setAllClustersCollapsed(true));
document.querySelector('#expandAllBtn').addEventListener('click',()=>setAllClustersCollapsed(false));
document.querySelector('#refreshBtn').addEventListener('click',()=>{toast('Pod 列表已刷新');render();});
document.querySelector('#restartBtn').addEventListener('click',()=>triggerAction('restart'));
document.querySelector('#horizontalScaleBtn').addEventListener('click',()=>triggerAction('horizontal'));
document.querySelector('#verticalScaleBtn').addEventListener('click',()=>triggerAction('vertical'));
document.querySelector('#actionMoreBtn').addEventListener('click',event=>{event.stopPropagation();openMenu(event.currentTarget,[{key:'history',label:'查看变更记录',icon:'clipboard'},{key:'refresh',label:'刷新 Pod 列表',icon:'refresh'}]);});
clusterGroups.addEventListener('change',event=>{
  if(event.target.matches('.pod-check')){ event.target.checked?state.selected.add(event.target.dataset.pod):state.selected.delete(event.target.dataset.pod); updateSelection(); }
  if(event.target.matches('.cluster-select')){ const cluster=event.target.dataset.clusterSelect; visiblePods().filter(pod=>pod[10]===cluster).forEach(([id])=>event.target.checked?state.selected.add(id):state.selected.delete(id)); render(); }
});
clusterGroups.addEventListener('click',event=>{
  const detail=event.target.closest('[data-instance-detail]');
  if(detail){ openInstanceDetail(detail.dataset.instanceDetail); return; }
  const toggle=event.target.closest('[data-cluster-toggle]');
  if(toggle){ setClusterCollapsed(toggle.dataset.clusterToggle,!state.collapsedClusters.has(toggle.dataset.clusterToggle)); return; }
  const clusterMore=event.target.closest('[data-cluster-more]');
  if(clusterMore){ event.stopPropagation(); const cluster=clusterMore.dataset.clusterMore; const collapsed=state.collapsedClusters.has(cluster); openMenu(clusterMore,[{key:collapsed?'expand-cluster':'collapse-cluster',label:collapsed?'展开集群':'收起集群',icon:collapsed?'chevron-down':'chevron-up'},{key:'history',label:'查看集群变更记录',icon:'clipboard'}]); menu.dataset.cluster=cluster; return; }
  const button=event.target.closest('[data-action]');
  if(button){ triggerAction(button.dataset.action,[button.dataset.pod]); return; }
  const more=event.target.closest('[data-row-more]');
  if(more){ event.stopPropagation(); openMenu(more,[{key:'detail',label:'查看实例详情',icon:'clipboard'},{key:'history',label:'查看实例变更记录',icon:'clipboard'},{key:'restart-row',label:'重启实例',icon:'power'}]); menu.dataset.pod=more.dataset.rowMore; }
});
document.querySelectorAll('[data-bulk-action]').forEach(button=>button.addEventListener('click',()=>triggerAction(button.dataset.bulkAction,[...state.selected])));
document.querySelector('#clearSelectionBtn').addEventListener('click',()=>{state.selected.clear();render();});
pagination.addEventListener('click',event=>{const button=event.target.closest('[data-page]');if(!button)return;const count=Math.max(1,Math.ceil(filteredPods().length/state.pageSize));state.page=button.dataset.page==='prev'?state.page-1:button.dataset.page==='next'?state.page+1:Number(button.dataset.page);state.page=Math.max(1,Math.min(count,state.page));render();});
pagination.addEventListener('change',event=>{if(!event.target.classList.contains('page-size'))return;state.pageSize=Number(event.target.value);state.page=1;render();});
menu.addEventListener('click',event=>{const item=event.target.closest('[data-menu-action]');if(!item)return;const pod=menu.dataset.pod;const cluster=menu.dataset.cluster;const key=item.dataset.menuAction; if(key==='history') openHistory(); else if(key==='detail') openInstanceDetail(pod); else if(key==='refresh'){toast('Pod 列表已刷新');render();} else if(key==='collapse-cluster') setClusterCollapsed(cluster,true); else if(key==='expand-cluster') setClusterCollapsed(cluster,false); else if(key==='restart-row') triggerAction('restart',[pod]); closeMenu();});
modalBackdrop.addEventListener('click',event=>{if(event.target===modalBackdrop)closeModal();});
detailBackdrop.addEventListener('click',event=>{if(event.target===detailBackdrop)closeInstanceDetail();});
instanceModal.addEventListener('click',event=>{
  const close=event.target.closest('.close-detail');
  if(close){closeInstanceDetail();return;}
  const body=instanceModal.querySelector('.detail-body');
  const tab=event.target.closest('[data-detail-tab]');
  if(tab&&body){openInstanceDetail(body.dataset.instanceId,tab.dataset.detailTab);return;}
  const pause=event.target.closest('[data-pause-pod]');
  if(pause){const id=pause.dataset.pausePod;state.pausedPods.has(id)?state.pausedPods.delete(id):state.pausedPods.add(id);openInstanceDetail(id,'detail');toast(state.pausedPods.has(id)?'实例已暂停':'实例已恢复');return;}
  const yaml=event.target.closest('[data-yaml-open]');
  if(yaml){const pod=pods.find(item=>item[0]===yaml.dataset.yamlOpen);instanceModal.innerHTML=yamlMarkup(pod);return;}
  const back=event.target.closest('[data-yaml-back]');
  if(back){openInstanceDetail(back.dataset.yamlBack,'detail');return;}
  const fullscreen=event.target.closest('[data-log-fullscreen]');
  if(fullscreen){instanceModal.classList.toggle('fullscreen');fullscreen.innerHTML=icon('unfold');return;}
  const openNew=event.target.closest('[data-open-new]');
  if(openNew){window.open(`${window.location.href.split('#')[0]}#pod=${openNew.dataset.openNew}`,'_blank','noopener');return;}
  const action=event.target.closest('[data-detail-action]');
  if(action&&body){const id=body.dataset.instanceId;closeInstanceDetail();triggerAction(action.dataset.detailAction,[id]);}
});
document.querySelector('#closeHistoryBtn').addEventListener('click',()=>historyDrawer.classList.add('hidden'));
document.addEventListener('click',event=>{if(!event.target.closest('#actionMenu'))closeMenu();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){closeMenu();closeModal();closeInstanceDetail();historyDrawer.classList.add('hidden');}});
renderHistory(); render();
