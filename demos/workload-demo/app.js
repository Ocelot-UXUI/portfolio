const pods = [
  ['pod-1','…nference-5f6b9-1234d','running','192.168.10.18','grpc:8500','ENS','7','3d','99%','9.7Gi','imeonline',{model:'A100',memory:'80G',count:8,variant:'a100'}],
  ['pod-2','…nference-5f6b9-p9wd','running','192.168.10.18','grpc:8500','ENS','5','7d','85%','9.1Gi','imeonline',{model:'A100',memory:'80G',count:8,variant:'a100'}],
  ['pod-3','…nference-5f6b9-p1234','running','192.168.10.18','grpc:8500 +1','ENS','5','8d','91%','9.6Gi','edge-prod',{model:'A100',memory:'80G',count:8,variant:'a100'}],
  ['pod-4','…nference-51234-p9wqa','blocked','192.168.10.18','grpc:8500 +1','ENS','4','8d','91%','9.4Gi','edge-prod',{model:'A100',memory:'80G',count:8,variant:'a100'}],
  ['pod-5','…nference-12349-p9wqd','blocked','192.168.10.18','grpc:8500 +1','ENS','2','8d','12%','2.3Gi','imeonline',{model:'P800',memory:'192G',count:4,variant:'p800'}],
  ['pod-6','…nference-12349-p9wqd','running','192.168.10.18','grpc:8500 +1','ENS','1','1h','12%','2.1Gi','edge-prod',{model:'P800',memory:'192G',count:4,variant:'p800'}],
  ['pod-7','…nference-12349-p9wqd','running','192.168.10.18','grpc:8500 +1','ALB','1','1h','12%','2.1Gi','imeonline',{model:'P800',memory:'192G',count:4,variant:'p800'}],
  ['pod-8','…nference-12349-p9wqd','error','192.168.10.18','grpc:8500 +2','-','1','6d','8%','1.2Gi','edge-prod',{model:'A100',memory:'80G',count:8,variant:'a100'}],
  ['pod-9','…nference-5f6b9-p9wqa','running','192.168.10.19','grpc:8500','ENS','1','6d','22%','3.2Gi','imeonline',{model:'A100',memory:'80G',count:8,variant:'a100'}],
  ['pod-10','…nference-5f6b9-p9wqb','running','192.168.10.20','grpc:8500','ENS','1','6d','18%','2.8Gi','edge-prod',{model:'P800',memory:'192G',count:4,variant:'p800'}],
  ['pod-11','…nference-5f6b9-p9wqc','running','192.168.10.21','grpc:8500','ENS','1','6d','16%','2.6Gi','imeonline',{model:'A100',memory:'80G',count:8,variant:'a100'}]
];

const state = { status:'all', cluster:'all', query:'', page:1, pageSize:10, viewMode:'detailed', collapsedClusters:new Set(), selected:new Set(), pausedPods:new Set(), instanceSummaryCollapsed:false, selectedContainer:0, executing:false, primaryNav:'apps', appNav:'workload', appNavExpanded:true, secondaryCollapsed:false, accountTab:'all', accountQuery:'', compactMoreOpen:false };
const labels = { running:'运行中', error:'异常', blocked:'已摘流' };
const clusterLabels = { imeonline:'imeonline', 'edge-prod':'edge-prod' };
const clusterMeta = {
  imeonline:{environment:'华北生产', channel:'稳定发布', version:'v1.8.3', versions:'等 3 个版本'},
  'edge-prod':{environment:'边缘生产', channel:'灰度发布', version:'v1.9.0-rc.2', versions:'等 2 个版本'}
};
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
const figmaIconPath = './assets/figma-icon-library-56-38920';
const workloadIconPath = './assets/figma-workload-global-tip-4-40581';
const figmaIconAssets = {
  'chevron-right':'image_3.png',
  'chevron-left':'image_4.png',
  'chevron-down':'image_6.png',
  'chevron-up':'image_5.png',
  'search':'image_43.png',
  'refresh':'image_40.png',
  'power':'image_18.png',
  'unfold':'image_32.png',
  'pause':'image_21.png',
  'block':'image_20.png',
  'route':'image_19.png',
  'restart':'image_82.png',
  'horizontal-scale':'image_32.png',
  'vertical-scale':'image_33.png',
  'close':'image_25.png',
  'cpu':`${workloadIconPath}/image_13.png`,
  'memory':`${workloadIconPath}/image_14.png`
};
const icon = name => {
  const asset = figmaIconAssets[name];
  if(!asset) return `<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24"><use href="#i-${name}"/></svg>`;
  const source = asset.startsWith('.') ? asset : `${figmaIconPath}/${asset}`;
  return `<img class="figma-icon" src="${source}" alt="">`;
};
const primaryNavIcons = {
  home:{default:'image_44.png',active:'image_52.png'},
  affairs:{default:'image_45.png',active:'image_53.png'},
  apps:{default:'image_46.png',active:'image_1.png'},
  environment:{default:'image_47.png',active:'image_54.png'},
  changes:{default:'image_48.png',active:'image_55.png'},
  resources:{default:'image_49.png',active:'image_56.png'},
  account:{default:'image_50.png',active:'image_57.png'},
  more:{default:'image_51.png',active:'image_58.png'}
};
const primaryNavIconSrc = (name, selected=false) => {
  const iconSet = primaryNavIcons[name];
  if(!iconSet) return '';
  if(name === 'apps' && selected) return './assets/figma-primary-app-selected-56-39117/image_1.png';
  return `${figmaIconPath}/${iconSet[selected ? 'active' : 'default']}`;
};
const appNavIcons = {
  workload:'image_59.png', exposure:'image_67.png', logs:'image_60.png', terminal:'image_61.png',
  monitor:'image_62.png', runtime:'image_64.png', settings:'image_63.png'
};
const actions = {
  restart:{label:'应用重启', icon:'restart', detail:'将依次重启目标实例，短暂中断可能影响正在处理的请求。'},
  horizontal:{label:'横向扩缩', icon:'horizontal-scale', detail:'将调整应用实例数量，变更完成前新实例不会接收流量。', field:'期望实例数', value:'6'},
  vertical:{label:'纵向扩缩', icon:'vertical-scale', detail:'将更新实例 CPU 和内存规格，变更期间实例会滚动重建。', field:'CPU 配额', value:'4 c'},
  rebuild:{label:'删除/重建', icon:'refresh', detail:'将删除并重建目标实例，实例上的临时数据不会保留。'},
  block:{label:'屏蔽', icon:'block', detail:'将停止向目标实例分配新流量，已建立连接不受影响。'},
  route:{label:'接流', icon:'route', detail:'将恢复向目标实例分配新流量。'},
  grant:{label:'临时授权', icon:'user', detail:'将创建 24 小时有效的临时访问授权。'},
  delete:{label:'删除并缩容', icon:'apps', detail:'将删除目标实例并降低副本数，此操作可能影响服务容量。', fails:true},
  'delete-deployment':{label:'删除部署资源', icon:'apps', detail:'将清除所选集群上的部署资源，此操作不可撤销。'}
};
const appNavLabels = { workload:'工作负载', exposure:'服务暴露', logs:'日志', terminal:'终端', monitor:'监控', runtime:'运行配置', settings:'应用设置' };
const workloadSections = document.querySelectorAll('[data-workload-section]');
const appPagePlaceholder = document.querySelector('#appPagePlaceholder');
const appPageTitle = document.querySelector('#appPageTitle');
const secondaryNav = document.querySelector('.secondary-nav');
const accountPopover = document.querySelector('#accountPopover');
const accountList = document.querySelector('#accountList');
const compactMorePopover = document.querySelector('#compactMorePopover');
const compactMoreMedia = window.matchMedia('(max-width:1250px)');
const compactOverflowItems = {
  resources:{label:'资源', icon:'./assets/figma-compact-more-32-2945/image_9.png'},
  account:{label:'账户', icon:'./assets/figma-compact-more-32-2945/image_10.png'}
};
const accounts = [
  { name:'一站式测试账户', handle:'appspace-test', initial:'t', tone:'mint', favorite:true, recent:true },
  { name:'码神专用账号码神专用账号', handle:'cnap-mashen', initial:'m', tone:'blue', favorite:true, recent:true },
  { name:'一站式测试账户', handle:'appspace-test-2', initial:'t', tone:'yellow', favorite:false, recent:false },
  { name:'一站式测试账户', handle:'appspace-tool', initial:'t', tone:'purple', favorite:false, recent:true }
];

function renderAppNavigation(){
  const isApplication = state.primaryNav === 'apps';
  const isWorkload = isApplication && state.appNav === 'workload';
  syncCompactNavigation();
  document.querySelectorAll('[data-primary-nav]').forEach(button=>{
    const selected = button.dataset.primaryNav === state.primaryNav;
    button.classList.toggle('active', selected);
    const image = button.querySelector('img');
    if(image) image.src = primaryNavIconSrc(button.dataset.primaryNav, selected);
  });
  const moreIcon = document.querySelector('#primaryMoreBtn img');
  if(moreIcon) moreIcon.src = primaryNavIconSrc('more', state.compactMoreOpen);
  document.querySelectorAll('[data-app-nav]').forEach(button=>{
    button.classList.toggle('active', button.dataset.appNav === state.appNav);
    const image = button.querySelector('img');
    if(image) image.src = `${figmaIconPath}/${appNavIcons[button.dataset.appNav]}`;
  });
  secondaryNav.classList.toggle('hidden', !isApplication);
  secondaryNav.classList.toggle('collapsed', state.secondaryCollapsed);
  const collapseButton = document.querySelector('#secondaryCollapseBtn');
  const collapseIcon = collapseButton.querySelector('img');
  collapseButton.setAttribute('aria-label', state.secondaryCollapsed ? '展开二级导航' : '收起二级导航');
  collapseButton.setAttribute('title', state.secondaryCollapsed ? '展开二级导航' : '收起二级导航');
  collapseIcon.src = state.secondaryCollapsed ? collapseIcon.dataset.collapsedSrc : collapseIcon.dataset.expandedSrc;
  workloadSections.forEach(section=>section.classList.toggle('hidden', !isWorkload));
  appPagePlaceholder.classList.toggle('hidden', isWorkload);
  appPageTitle.textContent = isApplication ? appNavLabels[state.appNav] : '页面内容占位';
}

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

function resourceMetricMarkup(type,usage,capacity,request,percent){
  const normalized=Math.max(0,Math.min(100,percent));
  const tone=normalized>=80?'danger':normalized>=60?'warning':'normal';
  const iconName=type==='cpu'?'cpu':'memory';
  return `<span class="resource-metric usage-value" data-tooltip="${type==='cpu'?'CPU':'内存'}：${usage}，Limit：${capacity}，请求：${request}"><span class="resource-spec"><span class="${type}-mark">${icon(iconName)}</span>${usage}/${capacity}/${request}</span><span class="resource-usage ${tone}"><span class="resource-track"><i style="width:${normalized}%"></i></span><b>${normalized}%</b></span></span>`;
}

function gpuCardMarkup(gpu){
  const asset=gpu.variant==='p800'?'image_37.png':'image_36.png';
  return `<span class="gpu-card ${gpu.variant}" title="${gpu.model} ${gpu.memory} x${gpu.count}"><img src="./assets/figma-workload-page-59-19541/${asset}" alt=""><span class="gpu-details"><b>${gpu.model}</b><b>${gpu.memory}</b></span><strong>x${gpu.count}</strong></span>`;
}

function operationIconMarkup(type){
  const asset=name=>`${figmaIconPath}/${name}`;
  if(type==='detail') return `<span class="operation-glyph view-list-glyph" aria-hidden="true"><img class="view-list-frame" src="${asset('image_126.png')}" alt=""><span class="view-list-items">${Array.from({length:3},()=>`<span><img src="${asset('image_127.png')}" alt=""><img src="${asset('image_128.png')}" alt=""></span>`).join('')}</span></span>`;
  if(type==='terminal') return `<img class="operation-glyph" src="${asset('image_129.png')}" alt="">`;
  if(type==='rebuild') return `<span class="operation-glyph hammer-glyph" aria-hidden="true"><img src="${asset('image_130.png')}" alt=""><img src="${asset('image_131.png')}" alt=""></span>`;
  if(type==='block') return `<img class="operation-glyph" src="${asset('image_132.png')}" alt="">`;
  return `<span class="operation-glyph more-glyph" aria-hidden="true">${Array.from({length:3},()=>`<img src="${asset('image_93.png')}" alt="">`).join('')}</span>`;
}

function rowMarkup(pod){
  const [id,name,status,ip,port,exposure,restarts,age,cpu,memory,,gpu] = pod;
  const cpuPercent=parseInt(cpu,10)||0;
  const cpuUsage=`${(cpuPercent*8/100).toFixed(1).replace('.0','')}c`;
  const memoryPercent=Math.min(100,Math.round((parseFloat(memory)||0)/32*100));
  const rowActions = [
    `<button type="button" data-instance-detail="${id}" aria-label="查看实例详情" title="查看实例详情">${operationIconMarkup('detail')}</button>`,
    `<button type="button" data-instance-terminal="${id}" aria-label="打开终端" title="打开终端">${operationIconMarkup('terminal')}</button>`,
    `<button type="button" data-action="rebuild" data-pod="${id}" aria-label="删除/重建" title="删除/重建">${operationIconMarkup('rebuild')}</button>`,
    `<button type="button" data-action="block" data-pod="${id}" aria-label="屏蔽" title="屏蔽">${operationIconMarkup('block')}</button>`,
    `<button type="button" data-row-more="${id}" aria-label="更多操作" title="更多操作">${operationIconMarkup('more')}</button>`
  ].join('');
  return `<tr class="${state.selected.has(id) ? 'is-selected' : ''}"><td><input class="pod-check" data-pod="${id}" type="checkbox" ${state.selected.has(id)?'checked':''} aria-label="选择 ${name}"></td><td title="${name}"><button class="pod-link" data-instance-detail="${id}">${name}</button></td><td><span class="status-tag ${status}">${labels[status]}</span></td><td>${ip}</td><td>${port}</td><td><span class="exposure-dot"></span>${exposure}</td><td class="${restarts >= 4 ? 'metric-hot' : ''}">${restarts}</td><td>${age}</td><td class="workload-resource-cell cpu-resource-cell">${resourceMetricMarkup('cpu',cpuUsage,'8c','16c',cpuPercent)}</td><td class="workload-resource-cell memory-resource-cell">${resourceMetricMarkup('memory',memory,'32Gi','9.1Gi',memoryPercent)}</td><td class="gpu-resource-cell">${gpuCardMarkup(gpu)}</td><td><span class="row-actions">${rowActions}</span></td></tr>`;
}

function tableMarkup(cluster,podsInCluster){
  const selected=podsInCluster.every(([id])=>state.selected.has(id));
  const partial=podsInCluster.some(([id])=>state.selected.has(id));
  const summary={running:0,error:0,blocked:0};
  podsInCluster.forEach(([, ,status])=>summary[status]++);
  const collapsed=state.collapsedClusters.has(cluster);
  const clusterName=clusterLabels[cluster];
  const meta=clusterMeta[cluster];
  return `<section class="cluster-group ${collapsed?'collapsed':''}" data-cluster="${cluster}">
    <header class="group-header"><button class="cluster-toggle" data-cluster-toggle="${cluster}" aria-label="${collapsed?'展开':'收起'}">${icon(collapsed?'chevron-right':'chevron-down')}</button><div class="group-title"><strong>Payment-api</strong><span class="cluster-context"><b>${clusterName}</b>${meta.environment}</span><span class="rollout ${cluster}">${meta.channel}</span><span class="versions">${meta.version}&nbsp; ${meta.versions}</span></div><div class="group-summary"><span>运行中 <b class="green">${summary.running}</b></span><span>异常 <b class="red">${summary.error}</b></span><span>已屏蔽 <b class="amber">${summary.blocked}</b></span><i></i><span>共 ${podsInCluster.length} pod</span><button class="cluster-more" data-cluster-more="${cluster}" aria-label="${clusterName} 更多操作">${icon('more')}</button></div></header>
    <div class="table-frame"><div class="table-scroll"><table class="pod-table"><thead><tr><th><input class="cluster-select" data-cluster-select="${cluster}" type="checkbox" ${selected?'checked':''} ${partial&&!selected?'data-indeterminate="true"':''} aria-label="全选 ${clusterName} 集群"><button class="select-options" data-select-options="${cluster}" aria-label="选择操作" title="选择操作">${icon('chevron-down')}</button></th><th>Pod</th><th>状态<span class="sort-icon">${icon('chevron-up')}</span></th><th>Pod IP</th><th>端口</th><th>服务暴露</th><th>重启<span class="sort-icon">${icon('chevron-up')}</span></th><th>存活<span class="sort-icon">${icon('chevron-up')}</span></th><th class="cpu-resource-head">CPU<span class="sort-icon">${icon('chevron-up')}</span></th><th class="memory-resource-head">内存<span class="sort-icon">${icon('chevron-up')}</span></th><th class="gpu-resource-head">GPU</th><th>操作</th></tr></thead><tbody>${podsInCluster.map(rowMarkup).join('')}</tbody></table></div><i class="frozen-edge frozen-edge-identity" aria-hidden="true"></i></div>
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
  clusterGroups.classList.toggle('compact-mode',state.viewMode==='compact');
  document.querySelector('#allCount').textContent = String(pods.length).padStart(2,'0');
  document.querySelector('#runningCount').textContent = String(pods.filter(([, ,status])=>status==='running').length).padStart(2,'0');
  document.querySelector('#errorCount').textContent = String(pods.filter(([, ,status])=>status==='error').length).padStart(2,'0');
  document.querySelector('#blockedCount').textContent = String(pods.filter(([, ,status])=>status==='blocked').length).padStart(2,'0');
  document.querySelector('#emptyState').classList.toggle('hidden',result.length!==0);
  const buttons=Array.from({length:pageCount},(_,index)=>`<button class="page-btn ${index+1===state.page?'current':''}" data-page="${index+1}">${index+1}</button>`).join('');
  pagination.innerHTML=pageCount>1?`<button class="page-btn page-nav" data-page="prev" aria-label="上一页" ${state.page===1?'disabled':''}>${icon('chevron-left')}</button>${buttons}<button class="page-btn page-nav" data-page="next" aria-label="下一页" ${state.page===pageCount?'disabled':''}>${icon('chevron-right')}</button><i class="pagination-divider" aria-hidden="true"></i><select class="page-size" aria-label="每页条数"><option value="10" ${state.pageSize===10?'selected':''}>10 条/页</option><option value="20" ${state.pageSize===20?'selected':''}>20 条/页</option></select>`:'';
  updateSelection();
}

function setWorkloadCollapsed(workload,collapsed){
  collapsed?state.collapsedClusters.add(workload):state.collapsedClusters.delete(workload);
  render();
}
function setAllWorkloadsCollapsed(collapsed){
  Object.keys(clusterLabels).forEach(cluster=>collapsed?state.collapsedClusters.add(cluster):state.collapsedClusters.delete(cluster));
  render();
}

function toast(message,type='default'){ const el=document.querySelector('#toast'); el.textContent=message; el.dataset.type=type; el.classList.add('show'); window.setTimeout(()=>el.classList.remove('show'),1800); }
function actionTarget(ids){ return ids?.length ? `${ids.length} 个 Pod` : 'Payment-api'; }
function setActionControls(disabled){ document.querySelectorAll('.title-actions button,[data-action],[data-bulk-action]').forEach(button=>button.disabled=disabled); }
function closeModal(){ if(!state.executing){ modalBackdrop.classList.add('hidden'); modal.innerHTML=''; pendingAction=null; } }

const modalClusters=[
  {id:'imeonline',name:'imeonline',current:15,desired:4,unavailable:'15%',surge:'15%',available:'>95%'},
  {id:'edge-prod',name:'edge-prod',current:16,desired:4,unavailable:'16%',surge:'16%',available:'>95%'}
];
const verticalModalClusters=[
  {id:'imeonline',name:'imeonline',unavailable:'15%',surge:'15%',available:'>95%'},
  {id:'edge-prod',name:'edge-prod',unavailable:'16%',surge:'16%',available:'>95%'},
  {id:'imeonline-canary',name:'imeonline-canary',unavailable:'16%',surge:'16%',available:'>95%'},
  {id:'edge-prod-canary',name:'edge-prod-canary',unavailable:'16%',surge:'16%',available:'>95%'}
];
function modalHeader(title,description){
  return `<header class="operation-modal-header"><div><div class="operation-modal-title"><h2 id="modalTitle">${title}</h2><button class="modal-description-help" type="button" aria-label="查看操作说明" title="${description}">i</button><i></i><span>环境：prod-cn-bj</span></div><p>${description}</p></div><button type="button" data-modal-close aria-label="关闭">${icon('close')}</button></header>`;
}
function modalFooter(disabled=false,hint='请选择一个集群后，再发起确定'){
  return `<footer class="operation-modal-footer"><span data-modal-hint>${hint}</span><div><button type="button" class="modal-cancel" data-modal-close>取消</button><button type="button" class="modal-confirm" data-modal-confirm ${disabled?'disabled':''}>确定</button></div></footer>`;
}
function clusterIcon(){ return '<img class="modal-cluster-mark" src="./assets/figma-all-modal-effects-4-45382/image_4.png" alt="">'; }
function selectionColumn(rows){
  return `<div class="modal-select-column"><label class="modal-select-all"><input type="checkbox" data-modal-select-all aria-label="选择全部集群"><span>集群</span></label>${rows.map(row=>`<label class="modal-cluster-choice"><input type="checkbox" data-modal-cluster="${row.id}" aria-label="选择 ${row.name}">${clusterIcon()}<span>${row.name}</span></label>`).join('')}</div>`;
}
function verticalSettingsTable(rows){
  const resourceCell=(row,type)=>`<div class="vertical-resource-cell" data-resource-cluster="${row.id}" data-resource-type="${type}"><label><input type="checkbox" checked aria-label="${row.name} ${type} 请求">Req<input data-resource-request="value" value="4" aria-label="${row.name} ${type} 请求值"><select data-resource-request="unit" aria-label="${row.name} ${type} 请求单位"><option>${type==='CPU'?'c':'Gi'}</option></select></label><label><input type="checkbox" data-resource-limit-toggle checked aria-label="${row.name} ${type} 限制">Lim<input data-resource-limit="value" value="4" aria-label="${row.name} ${type} 限制值"><select data-resource-limit="unit" aria-label="${row.name} ${type} 限制单位"><option>${type==='CPU'?'c':'Gi'}</option></select></label></div>`;
  const header=['','集群','CPU','内存','最大不可用','最大可超出','可用度锁'].map((label,index)=>index===0?`<div class="vertical-scale-head"><input type="checkbox" data-modal-select-all aria-label="选择全部集群"></div>`:`<div class="vertical-scale-head">${label}</div>`).join('');
  const values=row=>`<div class="vertical-scale-check"><input type="checkbox" data-modal-cluster="${row.id}" aria-label="选择 ${row.name}"></div><div class="vertical-scale-cluster">${verticalClusterIcon()}<span>${row.name}</span></div>${resourceCell(row,'CPU')}${resourceCell(row,'内存')}<div class="vertical-scale-value">${row.unavailable}</div><div class="vertical-scale-value">${row.surge}</div><div class="vertical-scale-value">${row.available}</div>`;
  return `<div class="vertical-scale-grid">${header}${rows.map(values).join('')}</div>`;
}
function verticalClusterIcon(){ return '<img class="modal-cluster-mark" src="./assets/figma-vertical-scale-61-23532/image_4.png" alt="">'; }
function settingsTable(rows,kind){
  const selection=selectionColumn(rows);
  if(kind==='vertical') return verticalSettingsTable(rows);
  const columns=kind==='horizontal' ? [['当前副本数','current'],['期望副本数','desired'],['最大不可用','unavailable'],['可用度锁','available']] : [['最大不可用','unavailable'],['最大可超出','surge'],['可用度锁','available']];
  return `<div class="operation-grid ${kind==='horizontal'?'horizontal-grid':'restart-grid'}">${selection}${columns.map(([label,key])=>`<div class="modal-number-column"><span>${label}</span>${rows.map(row=>key==='desired'||(kind==='restart'&&key==='unavailable')?`<label><input type="number" min="0" value="${key==='desired'?row[key]:row[key].replace('%','')}" data-modal-${key}="${row.id}" data-initial-value="${key==='desired'?row[key]:row[key].replace('%','')}" aria-label="${row.name} ${label}">${key==='unavailable'?'<em>%</em>':''}</label>`:`<b>${row[key]}</b>`).join('')}</div>`).join('')}</div>`;
}
function podTable(ids){
  const rows=(ids.length?pods.filter(([id])=>ids.includes(id)):pods.slice(0,2));
  return `<div class="pod-preview"><div class="pod-preview-head"><span>Pod 名称</span><span>所属工作负载</span><span>集群</span><span>状态</span></div>${rows.map(([,name,status,,,,,,,,cluster])=>`<div><span>${name}</span><span>Payment-api</span><span>${clusterIcon()}${clusterLabels[cluster]}</span><span class="status-tag ${status}">${labels[status]}</span></div>`).join('')}</div>`;
}
function batchClusters(ids){
  const involved=new Set(pods.filter(([id])=>ids.includes(id)).map(pod=>pod[10]));
  return modalClusters.filter(cluster=>involved.has(cluster.id));
}
function batchClusterTable(ids,editable){
  const rows=batchClusters(ids);
  return `<div class="batch-cluster-table"><div><span>集群</span><span>最大不可用</span><span>最大可超出</span><span>可用度锁</span></div>${rows.map(row=>`<div><span>${clusterIcon()}${row.name}</span>${editable?`<label><input type="number" min="0" value="${row.unavailable.replace('%','')}" aria-label="${row.name} 最大不可用"><em>%</em></label>`:`<b>${row.unavailable}</b>`}<b>${row.surge}</b><b>${row.available}</b></div>`).join('')}</div>`;
}
function batchModal(actionKey,ids,action){
  const restart=actionKey==='restart';
  const rebuild=actionKey==='rebuild';
  const shrink=actionKey==='delete';
  const title=restart?'批量重启 Pod':rebuild?'批量删除/重建 Pod':shrink?'批量删除并缩容 Pod':`批量${action.label}`;
  const description=restart?'将按照部署并发度对已选 Pod 的工作容器依次发送 SIGTERM 信号，触发容器重启。':rebuild?'将删除已选 Pod，并触发集群重新申请、重新启动 Pod 的过程。':shrink?`删除并缩容后，所选 ${ids.length} 个 Pod 将被删除，集群容量相应减少，可能导致服务承载能力下降。该操作不可自动恢复。`:`即将对已选择的 ${ids.length} 个 Pod 执行${action.label}，请在确认前复核操作对象。`;
  const warning=restart?'1. 重启过程中不会销毁容器，仅重新拉起进程。\n2. 重启过程中会对重启 Pod 进行流量屏蔽操作，请关注恢复状态。':rebuild?'1. 删除/重建过程中会销毁当前 Pod，并创建新的 Pod，名称、IP、所在节点等会发生变化。\n2. 已驱逐状态的 Pod 会被彻底删除，其他状态会创建新的 Pod。':'';
  const timeout=restart?`<section class="operation-section timeout-section"><h3>超时时间配置</h3><label class="operation-field"><span>超时时间</span><input type="number" value="60" aria-label="超时时间"><em>秒</em><small>发送 SIGTERM 后的等待时间，超时未检测到进程退出则视为重启失败</small></label></section>`:'';
  const config=(restart||rebuild)?`<section class="operation-section"><h3>集群与参数配置</h3>${rebuild?'<p class="batch-config-note">集群与参数配置由系统自动推导，所有参数均不可修改</p>':''}${batchClusterTable(ids,restart)}</section>`:'';
  return `${modalHeader(title,description)}<div class="operation-modal-body">${warning?`<p class="operation-warning">${warning.replace('\n','<br>')}</p>`:''}${timeout}<section class="operation-section"><h3>待${rebuild?'删除/重建':shrink?'删除并缩容':'重启'} Pod ${ids.length}</h3>${podTable(ids)}</section>${config}</div>${modalFooter(false,'已选择 '+ids.length+' 个 Pod')}`;
}
function openConfirm(actionKey, ids=[]){
  const action=actions[actionKey] || {label:'删除部署资源',detail:'删除资源将彻底清除所选集群上的部署资源，且不可撤销。'};
  pendingAction={actionKey,ids};
  let content='';
  if(actionKey==='horizontal') content=`${modalHeader('横向扩缩','横向扩缩是在保持当前 Pod 配置和规格的前提下，调整集群内 Pod 的数量。')}<div class="operation-modal-body">${settingsTable(modalClusters,'horizontal')}</div>${modalFooter()}`;
  else if(actionKey==='vertical') content=`${modalHeader('纵向扩缩','纵向扩缩是在保持当前集群 Pod 数量的前提下，调整 Pod 的资源规格，Pod 规格可按集群调整。')}<div class="operation-modal-body">${settingsTable(verticalModalClusters,'vertical')}</div>${modalFooter()}`;
  else if(actionKey==='delete-deployment') content=`${modalHeader('删除部署资源','删除资源将会彻底清除所选集群上的部署资源，且不可撤销。')}<div class="operation-modal-body"><p class="operation-info">此过程可能需要几分钟，请稍做等待...</p><section class="operation-section"><h3>应用名称补充</h3><label class="operation-field"><span>应用名称</span><input data-app-name placeholder="请补全应用名称"><small>应用名称：Payment-api</small></label></section><section class="operation-section"><h3>选择集群</h3>${settingsTable(modalClusters,'horizontal')}</section></div>${modalFooter()}`;
  else if(ids.length) content=batchModal(actionKey,ids,action);
  else {
    const isBatch=ids.length>0;
    const isRebuild=actionKey==='rebuild';
    const title=isBatch ? (isRebuild?'批量删除/重建 Pod':'批量重启 Pod') : '应用重启';
    const description=isRebuild?'删除/重建功能将删除指定 Pod，并触发集群重新申请、重新启动 Pod 的过程。':'重启应用会按照部署并发度对所选环境下、指定集群的实例进行重启。';
    const warning=isRebuild?'1. 删除/重建过程中会销毁当前 Pod，并创建新的 Pod，名称、IP、所在节点等会发生变化。\n2. 已驱逐状态的 Pod 会被彻底删除，其他状态会创建新的 Pod。':'1. 重启过程中不会销毁容器，仅重新拉起进程。\n2. 重启过程中会对目标 Pod 进行流量屏蔽操作，请关注恢复状态。';
    const podSection=isBatch?`<section class="operation-section"><h3>待${isRebuild?'删除/重建':'重启'} Pod ${ids.length}</h3>${podTable(ids)}</section>`:'';
    const config=isBatch?'':`<section class="operation-section"><h3>集群与参数配置<span>（必填）</span></h3>${settingsTable(modalClusters,'restart')}</section>`;
    content=`${modalHeader(title,description)}<div class="operation-modal-body"><p class="operation-warning">${warning.replace('\n','<br>')}</p><section class="operation-section timeout-section"><h3>超时时间配置</h3><label class="operation-field"><span>超时时间</span><input type="number" value="60" aria-label="超时时间"><em>秒</em><small>发送 SIGTERM 后的等待时间，超时未检测到进程退出则视为重启失败</small></label></section>${podSection}${config}</div>${modalFooter(false,isBatch?'':'请选择一个集群后，再发起确定')}`;
  }
  modal.className=`action-modal operation-modal ${actionKey==='vertical'?'operation-modal-wide':''}`;
  modal.innerHTML=content;
  modalBackdrop.classList.remove('hidden');
}

function selectedModalClusters(){ return Array.from(modal.querySelectorAll('[data-modal-cluster]:checked')); }
function updateModalFooter(error=''){
  const hint=modal.querySelector('[data-modal-hint]');
  const selected=selectedModalClusters();
  const name=modal.querySelector('[data-app-name]');
  if(!hint)return;
  hint.classList.toggle('is-error',Boolean(error));
  hint.textContent=error || (selected.length ? `已选择 ${selected.length} 个集群` : '请选择一个集群后，再发起确定');
  const confirm=modal.querySelector('[data-modal-confirm]');
  if(confirm) confirm.disabled=false;
  if(name&&name.value.trim()&&selected.length) hint.classList.remove('is-error');
}
function syncResourceLimit(cell){
  const enabled=cell.querySelector('[data-resource-limit-toggle]').checked;
  const requestValue=cell.querySelector('[data-resource-request="value"]');
  const requestUnit=cell.querySelector('[data-resource-request="unit"]');
  const limitValue=cell.querySelector('[data-resource-limit="value"]');
  const limitUnit=cell.querySelector('[data-resource-limit="unit"]');
  if(!enabled){limitValue.value=requestValue.value;limitUnit.value=requestUnit.value;}
  limitValue.disabled=!enabled; limitUnit.disabled=!enabled;
}
function executeAction(){
  if(!pendingAction) return;
  const clusterInputs=modal.querySelectorAll('[data-modal-cluster]');
  const selected=selectedModalClusters();
  const appName=modal.querySelector('[data-app-name]');
  if(clusterInputs.length&&!selected.length){updateModalFooter('请至少选择 1 个集群');return;}
  if(appName&&!appName.value.trim()){updateModalFooter('请补全应用名称');return;}
  const {actionKey,ids}=pendingAction;
  pendingAction.clusterCount=selected.length;
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
  const clusterMessage=pendingAction?.clusterCount ? `：${pendingAction.clusterCount} 个集群` : '';
  toast(failed ? `${action.label}失败` : `已发起${action.label}${clusterMessage}`,failed?'error':'success');
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
  const summary=`<section class="instance-summary ${state.instanceSummaryCollapsed?'is-collapsed':''}"><div class="summary-grid"><div><span>Pod IP</span><strong>${ip}</strong></div><div><span>节点 IP</span><strong>192.168.10.12</strong></div><div><span>版本</span><strong>v1.8.3</strong></div><div><span>重启次数</span><strong>${restarts}</strong></div><div><span>存活时间</span><strong>${age}</strong></div><div><span>服务暴露</span><strong>${port}</strong></div></div></section>`;
  const details=`<div class="pod-detail-page"><section class="detail-overview"><h3>基本信息</h3><dl><div><dt>Pod 名称</dt><dd>${name}</dd></div><div><dt>运行状态</dt><dd class="success-text">${paused?'已暂停':labels[status]}</dd></div><div><dt>所属集群</dt><dd>${cluster}</dd></div><div><dt>资源用量</dt><dd class="usage-value" data-tooltip="CPU 用量 ${cpu}；内存用量 ${memory}">${cpu} / ${memory}</dd></div></dl></section><section class="container-section"><div class="section-heading"><h3>容器</h3><button data-yaml-open="${id}">Pod YAML ${icon('chevron-right')}</button></div><article class="container-card"><header><span class="container-dot"></span><strong>ranking-inference</strong><em>主容器</em><span class="status-tag running">运行中</span></header><div class="container-stats"><span>类型<strong>普通</strong></span><span>状态<strong>运行中</strong></span><span>就绪<strong>是</strong></span><span>重启<strong>0</strong></span><span>存活<strong>8d</strong></span><span>端口<strong>3</strong></span><span>挂载<strong>3</strong></span></div><dl class="container-info"><div><dt>镜像</dt><dd>registry.internal/payments/api-gateway:v2.2.5</dd></div><div><dt>镜像拉取策略</dt><dd>IfNotPresent</dd></div><div class="wide"><dt>启动命令</dt><dd>/app/server --config=/etc/app/config/server.yaml --port=8500</dd></div></dl></article><div class="minor-containers"><button><span class="container-dot sidecar"></span><strong>ranking-inference</strong><small>Sidecar</small></button><button><span class="container-dot init"></span><strong>ranking-inference</strong><small>Init</small></button></div></section><section class="compact-table"><h3>挂载 <b>3</b></h3><div class="table-head"><span>容器名称</span><span>挂载路径</span><span>日志路径</span></div>${['go-demo','go-demo','go-demo'].map((item,index)=>`<div><span>${item}</span><span>/data/app/${index+1}</span><span>/home/work/logs</span></div>`).join('')}</section><section class="compact-table"><h3>环境变量 <b>3</b></h3><div class="table-head"><span>容器名称</span><span>变量名称</span><span>变量值</span></div><div><span>go-demo</span><span>ENV</span><span>production</span></div><div><span>go-demo</span><span>LOG_LEVEL</span><span>info</span></div><div><span>go-demo</span><span>PORT</span><span>8500</span></div></section></div>`;
  const logs=`<div class="tool-pane"><div class="tool-toolbar"><span>当前运行</span><button data-log-mode="latest">最新日志</button><label>${icon('search')}<input placeholder="搜索日志"></label><button data-log-fullscreen="${id}" title="全屏">${icon('unfold')}</button></div><div class="terminal-screen log-screen">${logLines(name)}</div></div>`;
  const terminal=`<div class="tool-pane"><div class="tool-toolbar"><select><option>ranking-inference</option></select><span>/bin/bash</span><button>${icon('refresh')}重新连接</button></div><div class="terminal-screen"><p><b>root@${name.slice(-8)}:</b>/app# ps aux</p><p>PID USER COMMAND</p><p>1 root /app/server --config=/etc/app/config/server.yaml</p><p>27 root /bin/bash</p><p><b>root@${name.slice(-8)}:</b>/app# <span class="cursor"></span></p></div></div>`;
  const events=`<div class="event-pane"><div class="event-toolbar"><select><option>全部类型</option><option>Normal</option><option>Warning</option></select><button>${icon('refresh')}刷新</button></div><div class="event-table"><div class="table-head"><span>类型</span><span>原因</span><span>信息</span><span>时间</span></div><div><span class="success-text">Normal</span><span>Started</span><span>Started container ranking-inference</span><span>2 分钟前</span></div><div><span class="success-text">Normal</span><span>Pulled</span><span>Container image already present on machine</span><span>2 分钟前</span></div><div><span class="warning-text">Warning</span><span>Unhealthy</span><span>Readiness probe failed, retry succeeded</span><span>1 小时前</span></div></div></div>`;
  const containerItems=[['主容器',''],['主容器',''],['Sidecar','sidecar'],['Init','init']];
  const containers=`<nav class="container-strip" aria-label="容器选择">${containerItems.map(([type,tone],index)=>`<button class="${state.selectedContainer===index?'active':''}" data-container-select="${index}" ${state.selectedContainer===index?'aria-current="true"':''}><span class="container-dot ${tone}"></span><strong>ranking-inference</strong><small>${type}</small></button>`).join('')}</nav>`;
  return `<header class="instance-header"><div class="instance-title-wrap"><div class="instance-title"><h2 id="instanceTitle" title="${name}">${name}</h2><span class="status-tag ${paused?'blocked':status}">${paused?'已暂停':labels[status]}</span></div><p>${cluster} · ${ip}</p></div><div class="instance-header-actions"><button data-pause-pod="${id}">${paused?'恢复':'暂停'}</button><button data-detail-action="restart" title="重启">${icon('power')}</button><button data-detail-action="rebuild" title="删除/重建">${icon('refresh')}</button><button data-open-new="${id}" title="在新标签页打开">${icon('unfold')}</button><button class="close-detail" aria-label="关闭" title="关闭">×</button></div></header>${summary}<button class="summary-toggle" data-summary-toggle="${id}" aria-expanded="${!state.instanceSummaryCollapsed}">${state.instanceSummaryCollapsed?'展开':'收起'} ${icon(state.instanceSummaryCollapsed?'chevron-down':'chevron-up')}</button><section class="instance-workbench">${containers}<nav class="detail-tabs">${tabBar}</nav><div class="detail-body" data-instance-id="${id}">${tab==='detail'?details:tab==='logs'?logs:tab==='terminal'?terminal:events}</div></section>`;
}
function yamlMarkup(pod){
  const [id,name,,, ,,,, , ,cluster]=pod;
  return `<header class="instance-header yaml-header"><div class="instance-title-wrap"><button data-yaml-back="${id}" aria-label="返回">${icon('chevron-right')}</button><div><h2 id="instanceTitle">Pod YAML</h2><p>${name}</p></div></div><button class="close-detail" aria-label="关闭">×</button></header><div class="yaml-toolbar"><label>${icon('search')}<input placeholder="搜索YAML内容..."></label><button>复制</button></div><pre class="yaml-code"><code>apiVersion: v1\nkind: Pod\nmetadata:\n  name: ${name}\n  namespace: payment-production\n  labels:\n    app: ranking-inference\nspec:\n  nodeName: ${cluster}\n  containers:\n    - name: ranking-inference\n      image: registry.internal/payments/api-gateway:v2.2.5\n      imagePullPolicy: IfNotPresent\n      ports:\n        - containerPort: 8500\n      resources:\n        requests:\n          cpu: "2"\n          memory: 8Gi\n        limits:\n          cpu: "4"\n          memory: 12Gi\nstatus:\n  phase: Running</code></pre>`;
}
function openInstanceDetail(id,tab='detail'){ const pod=pods.find(item=>item[0]===id); if(!pod)return; instanceModal.innerHTML=instanceMarkup(pod,tab); detailBackdrop.classList.remove('hidden'); }
function closeInstanceDetail(){ detailBackdrop.classList.add('hidden'); instanceModal.innerHTML=''; }
function closeMenu(){ menu.classList.add('hidden'); menu.innerHTML=''; }
function closeCompactMore(){ state.compactMoreOpen=false; compactMorePopover.classList.add('hidden'); const trigger=document.querySelector('#primaryMoreBtn'); trigger.classList.remove('active'); trigger.querySelector('img').src=primaryNavIconSrc('more'); }
function syncCompactNavigation(){
  const replacement = document.querySelector('.primary-replaceable');
  const replacementIcon = replacement.querySelector('img');
  const replacementLabel = replacement.querySelector('span');
  const selectedOverflow = compactMoreMedia.matches && compactOverflowItems[state.primaryNav];
  const activeItem = selectedOverflow ? compactOverflowItems[state.primaryNav] : {label:'变更'};
  const iconKey = selectedOverflow ? state.primaryNav : replacement.dataset.defaultNav;
  replacement.dataset.primaryNav = iconKey;
  replacement.setAttribute('aria-label', activeItem.label);
  replacement.setAttribute('title', activeItem.label);
  replacementIcon.src = primaryNavIconSrc(primaryNavIcons[iconKey] ? iconKey : 'changes');
  replacementLabel.textContent = activeItem.label;
  document.querySelectorAll('.compact-overflow-item').forEach(item=>item.classList.toggle('compact-hidden', compactMoreMedia.matches));
  if(!compactMoreMedia.matches) closeCompactMore();
}
function openCompactMore(trigger){
  closeMenu(); closeAccountPopover();
  const rect = trigger.getBoundingClientRect();
  compactMorePopover.style.top = `${Math.min(rect.top, window.innerHeight - 118)}px`;
  compactMorePopover.style.left = `${rect.right + 8}px`;
  state.compactMoreOpen=true;
  compactMorePopover.classList.remove('hidden');
  trigger.classList.add('active');
  trigger.querySelector('img').src=primaryNavIconSrc('more',true);
}
function closeAccountPopover(){ accountPopover.classList.add('hidden'); }
function renderAccountPopover(){
  const query = state.accountQuery.toLowerCase();
  const visible = accounts.filter(account => (state.accountTab === 'all' || account[state.accountTab]) && (!query || `${account.name} ${account.handle}`.toLowerCase().includes(query)));
  accountList.innerHTML = visible.length ? visible.map(account => `<button class="account-row" data-account-select="${account.handle}"><span class="account-avatar ${account.tone}">${account.initial}</span><span class="account-copy"><strong>${account.name}</strong><small>${account.handle}</small></span><span class="account-star" aria-hidden="true">${account.favorite ? '★' : ''}</span></button>`).join('') : '<p class="account-empty">未找到匹配账户</p>';
  document.querySelectorAll('[data-account-tab]').forEach(button => button.classList.toggle('active', button.dataset.accountTab === state.accountTab));
}
function openAccountPopover(trigger){
  closeMenu();
  const rect = trigger.getBoundingClientRect();
  accountPopover.style.top = `${rect.bottom - 1}px`;
  accountPopover.style.left = `${Math.max(16, Math.min(rect.left - 20, window.innerWidth - 496))}px`;
  accountPopover.classList.remove('hidden');
  renderAccountPopover();
  document.querySelector('#accountSearchInput').focus();
}
function openMenu(trigger,items){
  const rect=trigger.getBoundingClientRect();
  menu.innerHTML=items.map(item=>`<button data-menu-action="${item.key}">${item.icon?icon(item.icon):''}${item.label}</button>`).join('');
  menu.style.top=`${rect.bottom+6}px`; menu.style.left=`${Math.min(rect.left,window.innerWidth-190)}px`; menu.classList.remove('hidden');
}

function triggerAction(actionKey,ids=[]){ closeMenu(); openConfirm(actionKey,ids); }

document.querySelectorAll('[data-primary-nav]').forEach(button=>button.addEventListener('click',()=>{
  state.primaryNav=button.dataset.primaryNav;
  renderAppNavigation();
}));
document.querySelectorAll('[data-app-nav]').forEach(button=>button.addEventListener('click',()=>{
  state.appNav=button.dataset.appNav;
  renderAppNavigation();
}));
document.querySelector('#secondaryCollapseBtn').addEventListener('click',()=>{
  state.secondaryCollapsed=!state.secondaryCollapsed;
  renderAppNavigation();
});
document.querySelectorAll('[data-context]').forEach(button=>button.addEventListener('click',event=>{
  event.stopPropagation();
  const key=button.dataset.context;
  const labels={account:'账户',application:'应用',environment:'环境'};
  if(key==='home'){ toast('已返回 CNAP 首页'); return; }
  if(key==='account'){ openAccountPopover(button); return; }
  const lists={
    account:[{key:'context-account-main',label:'默认账号',icon:'user'},{key:'context-account-prod',label:'生产账号',icon:'user'},{key:'context-account-manage',label:'管理账号',icon:'user'}],
    application:[{key:'context-application-payment',label:'Payment-api',icon:'apps'},{key:'context-application-order',label:'Order-service',icon:'apps'},{key:'context-application-gateway',label:'Gateway',icon:'apps'}],
    environment:[{key:'context-environment-prod',label:'生产环境 · prod-cn-bj',icon:'leaf'},{key:'context-environment-staging',label:'测试环境 · staging-cn-bj',icon:'leaf'}]
  };
  openMenu(button, lists[key]); menu.dataset.context=labels[key];
}));
document.querySelector('#accountSearchInput').addEventListener('input', event => { state.accountQuery = event.target.value.trim(); renderAccountPopover(); });
document.querySelectorAll('[data-account-tab]').forEach(button => button.addEventListener('click', () => { state.accountTab = button.dataset.accountTab; renderAccountPopover(); }));
accountList.addEventListener('click', event => {
  const account = event.target.closest('[data-account-select]');
  if(!account) return;
  const selected = accounts.find(item => item.handle === account.dataset.accountSelect);
  document.querySelector('[data-context="account"]').innerHTML = `${selected.name}<svg class="chevron"><use href="#i-chevron-down"/></svg>`;
  closeAccountPopover();
  toast(`已切换账户：${selected.name}`);
});
document.querySelectorAll('[data-account-action]').forEach(button => button.addEventListener('click', () => {
  closeAccountPopover();
  toast(button.dataset.accountAction === 'create' ? '已打开新建账户' : button.dataset.accountAction === 'request' ? '已打开账户权限申请' : '已打开账户列表');
}));
document.querySelector('#primaryMoreBtn').addEventListener('click',event=>{
  event.stopPropagation();
  if(compactMoreMedia.matches){
    compactMorePopover.classList.contains('hidden') ? openCompactMore(event.currentTarget) : closeCompactMore();
    return;
  }
  openMenu(event.currentTarget,[{key:'more-resources',label:'资源',icon:'stack'},{key:'more-account',label:'账户',icon:'user'},{key:'more-customize',label:'导航设置',icon:'apps'}]);
});
document.querySelectorAll('[data-compact-more]').forEach(button=>button.addEventListener('click',()=>{
  state.primaryNav=button.dataset.compactMore;
  closeCompactMore();
  renderAppNavigation();
  toast(`已切换到${compactOverflowItems[state.primaryNav].label}`);
}));
compactMoreMedia.addEventListener('change',()=>renderAppNavigation());
document.querySelector('#headerMoreBtn').addEventListener('click',event=>{
  event.stopPropagation();
  openMenu(event.currentTarget,[{key:'header-preferences',label:'偏好设置',icon:'apps'},{key:'header-help',label:'帮助文档',icon:'clipboard'}]);
});
document.querySelectorAll('.tabs button').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('.tabs button').forEach(item=>item.classList.toggle('active',item===button));
  state.status=button.dataset.status; state.page=1; document.querySelector('#statusSelect').value=state.status; render();
}));
document.querySelector('#statusSelect').addEventListener('change',event=>{state.status=event.target.value;state.page=1;document.querySelectorAll('.tabs button').forEach(item=>item.classList.toggle('active',item.dataset.status===state.status));render();});
document.querySelector('#clusterSelect').addEventListener('change',event=>{state.cluster=event.target.value;state.page=1;render();});
document.querySelector('#searchInput').addEventListener('input',event=>{state.query=event.target.value.trim().toLowerCase();state.page=1;render();});
document.querySelector('#collapseAllBtn').addEventListener('click',()=>setAllWorkloadsCollapsed(true));
document.querySelector('#expandAllBtn').addEventListener('click',()=>setAllWorkloadsCollapsed(false));
document.querySelector('#refreshBtn').addEventListener('click',()=>{toast('Pod 列表已刷新');render();});
document.querySelectorAll('.table-tools .view').forEach(button=>button.addEventListener('click',()=>{state.viewMode=button.dataset.viewMode;document.querySelectorAll('.table-tools .view').forEach(item=>{const selected=item===button;item.classList.toggle('active',selected);item.setAttribute('aria-pressed',String(selected));});clusterGroups.classList.toggle('compact-mode',state.viewMode==='compact');toast(state.viewMode==='compact'?'已切换为精简模式':'已切换为详细模式');}));
document.querySelector('#restartBtn').addEventListener('click',()=>triggerAction('restart'));
document.querySelector('#horizontalScaleBtn').addEventListener('click',()=>triggerAction('horizontal'));
document.querySelector('#verticalScaleBtn').addEventListener('click',()=>triggerAction('vertical'));
document.querySelector('#actionMoreBtn').addEventListener('click',event=>{event.stopPropagation();openMenu(event.currentTarget,[{key:'history',label:'查看变更记录',icon:'clipboard'},{key:'refresh',label:'刷新 Pod 列表',icon:'refresh'},{key:'delete-deployment',label:'删除部署资源',icon:'apps'}]);});
clusterGroups.addEventListener('change',event=>{
  if(event.target.matches('.pod-check')){
    event.target.checked?state.selected.add(event.target.dataset.pod):state.selected.delete(event.target.dataset.pod);
    event.target.closest('tr')?.classList.toggle('is-selected',event.target.checked);
    updateSelection();
  }
  if(event.target.matches('.cluster-select')){ const cluster=event.target.dataset.clusterSelect; visiblePods().filter(pod=>pod[10]===cluster).forEach(([id])=>event.target.checked?state.selected.add(id):state.selected.delete(id)); render(); }
});
clusterGroups.addEventListener('click',event=>{
  const terminal=event.target.closest('[data-instance-terminal]');
  if(terminal){ openInstanceDetail(terminal.dataset.instanceTerminal,'terminal'); return; }
  const detail=event.target.closest('[data-instance-detail]');
  if(detail){ openInstanceDetail(detail.dataset.instanceDetail); return; }
  const toggle=event.target.closest('[data-cluster-toggle]');
  if(toggle){ setWorkloadCollapsed(toggle.dataset.clusterToggle,!state.collapsedClusters.has(toggle.dataset.clusterToggle)); return; }
  const selectOptions=event.target.closest('[data-select-options]');
  if(selectOptions){event.stopPropagation();const cluster=selectOptions.dataset.selectOptions;openMenu(selectOptions,[{key:'select-page',label:'全选本页',icon:'apps'},{key:'select-all',label:'全选所有',icon:'apps'},{key:'invert-page',label:'反选本页',icon:'apps'},{key:'invert-all',label:'反选所有',icon:'apps'},{key:'clear-selection',label:'取消全部选择',icon:'apps'}]);menu.dataset.cluster=cluster;return;}
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
menu.addEventListener('click',event=>{const item=event.target.closest('[data-menu-action]');if(!item)return;const pod=menu.dataset.pod;const cluster=menu.dataset.cluster;const key=item.dataset.menuAction; const scoped=visiblePods().filter(entry=>!cluster||entry[10]===cluster); if(key==='select-page'||key==='select-all'||key==='invert-page'||key==='invert-all'||key==='clear-selection'){const targets=(key==='select-all'||key==='invert-all')?filteredPods():scoped;if(key==='select-page'||key==='select-all')targets.forEach(([id])=>state.selected.add(id));if(key==='invert-page'||key==='invert-all')targets.forEach(([id])=>state.selected.has(id)?state.selected.delete(id):state.selected.add(id));if(key==='clear-selection')state.selected.clear();render();closeMenu();return;} if(key==='history') openHistory(); else if(key==='detail') openInstanceDetail(pod); else if(key==='refresh'){toast('Pod 列表已刷新');render();} else if(key==='collapse-cluster') setWorkloadCollapsed(cluster,true); else if(key==='expand-cluster') setWorkloadCollapsed(cluster,false); else if(key==='restart-row') triggerAction('restart',[pod]); else if(key==='delete-deployment') triggerAction('delete-deployment'); else if(key==='more-customize') toast('导航设置将在后续版本开放'); else if(key.startsWith('context-')) toast(`已切换${menu.dataset.context || ''}：${item.textContent.trim()}`); else if(key==='header-preferences') toast('已打开偏好设置'); else if(key==='header-help') toast('已打开帮助文档'); else toast(`已选择${item.textContent.trim()}`); closeMenu();});
modalBackdrop.addEventListener('click',event=>{if(event.target===modalBackdrop)closeModal();});
modal.addEventListener('change',event=>{
  if(event.target.matches('[data-modal-select-all]')) modal.querySelectorAll('[data-modal-cluster]').forEach(input=>{input.checked=event.target.checked;if(!event.target.checked){const unavailable=modal.querySelector(`[data-modal-unavailable="${input.dataset.modalCluster}"]`);if(unavailable)unavailable.value=unavailable.dataset.initialValue;}});
  if(event.target.matches('[data-modal-cluster]')){
    const clusterId=event.target.dataset.modalCluster;
    const unavailable=modal.querySelector(`[data-modal-unavailable="${clusterId}"]`);
    if(!event.target.checked&&unavailable) unavailable.value=unavailable.dataset.initialValue;
    const all=Array.from(modal.querySelectorAll('[data-modal-cluster]'));
    const selectAll=modal.querySelector('[data-modal-select-all]');
    if(selectAll){selectAll.checked=all.length>0&&all.every(input=>input.checked);selectAll.indeterminate=all.some(input=>input.checked)&&!selectAll.checked;}
  }
  if(event.target.matches('[data-resource-limit-toggle]')) syncResourceLimit(event.target.closest('.vertical-resource-cell'));
  updateModalFooter();
});
modal.addEventListener('input',event=>{
  if(event.target.matches('[data-modal-unavailable]')){
    const cluster=modal.querySelector(`[data-modal-cluster="${event.target.dataset.modalUnavailable}"]`);
    if(cluster) cluster.checked=true;
    const all=Array.from(modal.querySelectorAll('[data-modal-cluster]'));
    const selectAll=modal.querySelector('[data-modal-select-all]');
    if(selectAll){selectAll.checked=all.length>0&&all.every(input=>input.checked);selectAll.indeterminate=all.some(input=>input.checked)&&!selectAll.checked;}
  }
  if(event.target.matches('[data-resource-request]')){
    const cell=event.target.closest('.vertical-resource-cell');
    if(!cell.querySelector('[data-resource-limit-toggle]').checked) syncResourceLimit(cell);
  }
  updateModalFooter();
});
modal.addEventListener('click',event=>{if(event.target.closest('[data-modal-close]')){closeModal();return;}if(event.target.closest('[data-modal-confirm]'))executeAction();});
modal.addEventListener('scroll',()=>{const header=modal.querySelector('.operation-modal-header');if(header)header.classList.toggle('is-scrolled',modal.scrollTop>0);});
detailBackdrop.addEventListener('click',event=>{if(event.target===detailBackdrop)closeInstanceDetail();});
instanceModal.addEventListener('click',event=>{
  const close=event.target.closest('.close-detail');
  if(close){closeInstanceDetail();return;}
  const body=instanceModal.querySelector('.detail-body');
  const summaryToggle=event.target.closest('[data-summary-toggle]');
  if(summaryToggle){const activeTab=instanceModal.querySelector('[data-detail-tab].active')?.dataset.detailTab || 'detail';state.instanceSummaryCollapsed=!state.instanceSummaryCollapsed;openInstanceDetail(summaryToggle.dataset.summaryToggle,activeTab);return;}
  const container=event.target.closest('[data-container-select]');
  if(container){state.selectedContainer=Number(container.dataset.containerSelect);instanceModal.querySelectorAll('[data-container-select]').forEach(button=>{const selected=button===container;button.classList.toggle('active',selected);button.toggleAttribute('aria-current',selected);});return;}
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
document.addEventListener('click',event=>{if(!event.target.closest('#actionMenu'))closeMenu(); if(!event.target.closest('#accountPopover') && !event.target.closest('[data-context="account"]')) closeAccountPopover(); if(!event.target.closest('#compactMorePopover') && !event.target.closest('#primaryMoreBtn')) closeCompactMore();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){closeMenu();closeAccountPopover();closeCompactMore();closeModal();closeInstanceDetail();historyDrawer.classList.add('hidden');}});
renderHistory(); render(); renderAppNavigation();
