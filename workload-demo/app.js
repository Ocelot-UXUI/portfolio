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

const state = { status:'all', cluster:'all', query:'', page:1, pageSize:10, collapsed:false, selected:new Set(), executing:false };
const labels = { running:'运行中', error:'异常', blocked:'已摘流' };
const rows = document.querySelector('#podRows');
const pagination = document.querySelector('#pagination');
const menu = document.querySelector('#actionMenu');
const modalBackdrop = document.querySelector('#modalBackdrop');
const modal = document.querySelector('#actionModal');
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
  return `<tr><td><input class="pod-check" data-pod="${id}" type="checkbox" ${state.selected.has(id)?'checked':''} aria-label="选择 ${name}"></td><td title="${name}">${name}</td><td><span class="status-tag ${status}">${labels[status]}</span></td><td>${ip}</td><td>${port}</td><td><span class="exposure-dot"></span>${exposure}</td><td class="${restarts >= 4 ? 'metric-hot' : ''}">${restarts}</td><td>${age}</td><td class="${hot}"><span class="cpu-mark">${icon('cpu')}</span>${cpu}</td><td><span class="memory-mark">${icon('memory')}</span>${memory}</td><td><span class="row-actions">${rowActions}<button type="button" data-row-more="${id}" aria-label="更多操作" title="更多操作">${icon('more')}</button></span></td></tr>`;
}

function visiblePods(){ const result=filteredPods(); return result.slice((state.page-1)*state.pageSize,state.page*state.pageSize); }
function updateSelection(){
  const count=state.selected.size;
  document.querySelector('#selectedCount').textContent=count;
  bulkBar.classList.toggle('hidden',count===0);
  const visible=visiblePods();
  const checkbox=document.querySelector('#selectAllPods');
  checkbox.checked=visible.length>0 && visible.every(([id])=>state.selected.has(id));
  checkbox.indeterminate=visible.some(([id])=>state.selected.has(id)) && !checkbox.checked;
}

function render(){
  const result = filteredPods();
  const pageCount = Math.max(1,Math.ceil(result.length/state.pageSize));
  state.page = Math.min(state.page,pageCount);
  rows.innerHTML = visiblePods().map(rowMarkup).join('');
  document.querySelector('#podCount').textContent = result.length;
  document.querySelector('#allCount').textContent = String(pods.length).padStart(2,'0');
  document.querySelector('#runningCount').textContent = String(pods.filter(([, ,status])=>status==='running').length).padStart(2,'0');
  document.querySelector('#errorCount').textContent = String(pods.filter(([, ,status])=>status==='error').length).padStart(2,'0');
  document.querySelector('#blockedCount').textContent = String(pods.filter(([, ,status])=>status==='blocked').length).padStart(2,'0');
  document.querySelector('#emptyState').classList.toggle('hidden',result.length!==0);
  document.querySelector('#workloadGroup').classList.toggle('hidden',result.length===0);
  const buttons=Array.from({length:pageCount},(_,index)=>`<button class="page-btn ${index+1===state.page?'current':''}" data-page="${index+1}">${index+1}</button>`).join('');
  pagination.innerHTML=pageCount>1?`<button class="page-btn" data-page="prev" aria-label="上一页" ${state.page===1?'disabled':''}>${icon('chevron-right')}</button>${buttons}<button class="page-btn" data-page="next" aria-label="下一页" ${state.page===pageCount?'disabled':''}>${icon('chevron-right')}</button><select class="page-size" aria-label="每页条数"><option value="10" ${state.pageSize===10?'selected':''}>10 条/页</option><option value="20" ${state.pageSize===20?'selected':''}>20 条/页</option></select>`:'';
  updateSelection();
}

function setCollapsed(collapsed){
  state.collapsed=collapsed;
  document.querySelector('#tableRegion').classList.toggle('hidden',collapsed);
  const toggle=document.querySelector('#groupToggle');
  toggle.innerHTML=icon(collapsed?'chevron-right':'chevron-down');
  toggle.setAttribute('aria-label',collapsed?'展开':'收起');
}

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
document.querySelector('#groupToggle').addEventListener('click',()=>setCollapsed(!state.collapsed));
document.querySelector('#collapseAllBtn').addEventListener('click',()=>setCollapsed(true));
document.querySelector('#expandAllBtn').addEventListener('click',()=>setCollapsed(false));
document.querySelector('#refreshBtn').addEventListener('click',()=>{toast('Pod 列表已刷新');render();});
document.querySelector('#restartBtn').addEventListener('click',()=>triggerAction('restart'));
document.querySelector('#horizontalScaleBtn').addEventListener('click',()=>triggerAction('horizontal'));
document.querySelector('#verticalScaleBtn').addEventListener('click',()=>triggerAction('vertical'));
document.querySelector('#actionMoreBtn').addEventListener('click',event=>{event.stopPropagation();openMenu(event.currentTarget,[{key:'history',label:'查看变更记录',icon:'clipboard'},{key:'refresh',label:'刷新 Pod 列表',icon:'refresh'}]);});
document.querySelector('#groupMoreBtn').addEventListener('click',event=>{event.stopPropagation();openMenu(event.currentTarget,[{key:state.collapsed?'expand':'collapse',label:state.collapsed?'展开工作负载':'收起工作负载',icon:state.collapsed?'chevron-down':'chevron-up'},{key:'history',label:'查看变更记录',icon:'clipboard'}]);});
rows.addEventListener('change',event=>{ if(!event.target.matches('.pod-check')) return; event.target.checked?state.selected.add(event.target.dataset.pod):state.selected.delete(event.target.dataset.pod); updateSelection(); });
rows.addEventListener('click',event=>{ const button=event.target.closest('[data-action]'); if(button) triggerAction(button.dataset.action,[button.dataset.pod]); const more=event.target.closest('[data-row-more]'); if(more){event.stopPropagation();openMenu(more,[{key:'history',label:'查看实例变更记录',icon:'clipboard'},{key:'restart-row',label:'重启实例',icon:'power'}]); menu.dataset.pod=more.dataset.rowMore;} });
document.querySelector('#selectAllPods').addEventListener('change',event=>{visiblePods().forEach(([id])=>event.target.checked?state.selected.add(id):state.selected.delete(id));render();});
document.querySelectorAll('[data-bulk-action]').forEach(button=>button.addEventListener('click',()=>triggerAction(button.dataset.bulkAction,[...state.selected])));
document.querySelector('#clearSelectionBtn').addEventListener('click',()=>{state.selected.clear();render();});
pagination.addEventListener('click',event=>{const button=event.target.closest('[data-page]');if(!button)return;const count=Math.max(1,Math.ceil(filteredPods().length/state.pageSize));state.page=button.dataset.page==='prev'?state.page-1:button.dataset.page==='next'?state.page+1:Number(button.dataset.page);state.page=Math.max(1,Math.min(count,state.page));render();});
pagination.addEventListener('change',event=>{if(!event.target.classList.contains('page-size'))return;state.pageSize=Number(event.target.value);state.page=1;render();});
menu.addEventListener('click',event=>{const item=event.target.closest('[data-menu-action]');if(!item)return;const pod=menu.dataset.pod;const key=item.dataset.menuAction; if(key==='history') openHistory(); else if(key==='refresh'){toast('Pod 列表已刷新');render();} else if(key==='collapse') setCollapsed(true); else if(key==='expand') setCollapsed(false); else if(key==='restart-row') triggerAction('restart',[pod]); closeMenu();});
modalBackdrop.addEventListener('click',event=>{if(event.target===modalBackdrop)closeModal();});
document.querySelector('#closeHistoryBtn').addEventListener('click',()=>historyDrawer.classList.add('hidden'));
document.addEventListener('click',event=>{if(!event.target.closest('#actionMenu'))closeMenu();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){closeMenu();closeModal();historyDrawer.classList.add('hidden');}});
renderHistory(); render();
