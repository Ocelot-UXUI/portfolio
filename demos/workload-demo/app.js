const podTemplates = {
  statuses:['running','running','running','running','running','running','blocked','running','error','running'],
  cpu:[99,85,91,75,63,42,24,12,8,0],
  memory:[9.7,9.1,9.6,8.8,7.4,5.6,3.2,2.1,1.2,0.8],
  ports:['grpc:8500','grpc:8500 +1','http:8080','http:8080 +2','metrics:9090'],
  exposures:['ENS','ENS','ALB','ENS','-'],
  ages:['1h','6h','1d','3d','6d','7d','8d'],
  suffixes:['7k2mq','p9wqa','c4r8n','m2x6b','v8t3p','q5j1d','h9s4f','w3n7k','a6e2r','u1y5c']
};

function createPods(total=110){
  return Array.from({length:total},(_,index)=>{
    const sequence=index+1;
    const cluster=index%2===0?'imeonline':'edge-prod';
    const status=podTemplates.statuses[index%podTemplates.statuses.length];
    const cpu=podTemplates.cpu[index%podTemplates.cpu.length];
    const memory=podTemplates.memory[(index*3)%podTemplates.memory.length];
    const gpuIsP800=index%4===3;
    const gpuCount=gpuIsP800?4:[8,6,2][index%3];
    const deployment=String(51000+(index%14)*137).slice(-5);
    const suffix=podTemplates.suffixes[index%podTemplates.suffixes.length];
    return [
      `pod-${sequence}`,
      `ranking-inference-${deployment}-${suffix}`,
      status,
      `192.168.${10+Math.floor(index/60)}.${18+(index%60)}`,
      podTemplates.ports[index%podTemplates.ports.length],
      podTemplates.exposures[(index*2)%podTemplates.exposures.length],
      String((index*3)%9),
      podTemplates.ages[index%podTemplates.ages.length],
      `${cpu}%`,
      `${memory.toFixed(1)}Gi`,
      cluster,
      gpuIsP800
        ? {model:'P800',memory:'192G',count:gpuCount,variant:'p800'}
        : {model:'A100',memory:'80G',count:gpuCount,variant:'a100'}
    ];
  });
}

const pods = createPods();

const state = { status:'all', cluster:'all', query:'', clusterPages:{imeonline:{page:1,pageSize:10},'edge-prod':{page:1,pageSize:10}}, viewMode:'detailed', collapsedClusters:new Set(), selected:new Set(), pausedPods:new Set(), instanceSummaryCollapsed:false, selectedContainer:0, activeInstanceId:null, executing:false, primaryNav:'apps', appNav:'workload', appNavExpanded:true, secondaryCollapsed:false, accountTab:'all', accountQuery:'', compactMoreOpen:false, envTab:'all', envQuery:'', selectedEnv:'imeonline', clusterQuery:'', selectedCluster:'imeonline' };
const labels = { running:'运行中', error:'异常', blocked:'已摘流' };
const clusterLabels = { imeonline:'imeonline', 'edge-prod':'edge-prod' };
const clusterMeta = {
  imeonline:{environment:'华北生产', channel:'稳定发布', version:'v1.8.3', versions:'等 3 个版本'},
  'edge-prod':{environment:'边缘生产', channel:'灰度发布', version:'v1.9.0-rc.2', versions:'等 2 个版本'}
};
const clusterGroups = document.querySelector('#clusterGroups');
const workspace = document.querySelector('.workspace');
const workloadStickyStack = document.querySelector('#workloadStickyStack');
const menu = document.querySelector('#actionMenu');
const modalBackdrop = document.querySelector('#modalBackdrop');
const modal = document.querySelector('#actionModal');
const detailBackdrop = document.querySelector('#detailBackdrop');
const instanceModal = document.querySelector('#instanceModal');
const historyDrawer = document.querySelector('#historyDrawer');
const historyList = document.querySelector('#historyList');
const bulkBar = document.querySelector('#bulkBar');
const figmaIconPath = './assets/figma-icon-library-56-38920';
const operationIconPath = './assets/figma-operation-column-4-45229';
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
const envPopover = document.querySelector('#envPopover');
const envList = document.querySelector('#envList');
const clusterPopover = document.querySelector('#clusterPopover');
const clusterList = document.querySelector('#clusterList');
const breadcrumbAssetPath = './assets/figma-breadcrumb-dropdown-241-37898';
const environments = [
  { id:'imeonline', name:'imeonline', tag:'特殊环境', icon:'image_21.png', tab:'prod', recent:true },
  { id:'icafe-web-2', name:'icafe-web-2', tag:'固化环境', icon:'image_22.png', tab:'prod', recent:false },
  { id:'kefu-c', name:'kefu-c', tag:'Mesh环境', icon:'image_23.png', tab:'test', recent:true },
  { id:'icafe-web-20260530', name:'icafe-web-20260530', tag:'特殊环境', icon:'image_24.png', tab:'test', recent:false }
];
const clusters = [
  { id:'beijing-eci', name:'beijing-eci', tag:'ECI', available:20, expected:10 },
  { id:'chengdu-eci', name:'chengdu-eci', tag:'ECI', available:20, expected:10 },
  { id:'guangzhou-k8s', name:'guangzhou-k8s', tag:'ECI', available:20, expected:10 },
  { id:'icafe-web-20260530', name:'icafe-web-20260530', tag:'ECI', available:20, expected:10 },
  { id:'edge-prod', name:'edge-prod', tag:'ECI', available:20, expected:10 }
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
  scheduleWorkloadStickySync();
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
  return `<span class="resource-metric usage-value" data-tooltip="${type==='cpu'?'CPU':'内存'}：${usage}，Limit：${capacity}，请求：${request}"><span class="resource-spec"><span class="${type}-mark">${icon(iconName)}</span><span class="resource-spec-value">${usage}/${capacity}/${request}</span></span><span class="resource-usage ${tone}"><span class="resource-track"><i style="width:${normalized}%"></i></span><b>${normalized}%</b></span></span>`;
}

function gpuCardMarkup(gpu){
  const asset=gpu.variant==='p800'?'image_37.png':'image_36.png';
  return `<span class="gpu-card ${gpu.variant}" title="${gpu.model} ${gpu.memory} x${gpu.count}"><img src="./assets/figma-workload-page-59-19541/${asset}" alt=""><span class="gpu-details"><b>${gpu.model}</b><b>${gpu.memory}</b></span><strong>x${gpu.count}</strong></span>`;
}

const compactTableAssetPath = './assets/figma-compact-table-4-39671';
const compactCpuUsage = { 'pod-1':99, 'pod-2':85, 'pod-3':91, 'pod-4':91, 'pod-5':12, 'pod-6':12, 'pod-7':12, 'pod-8':0 };
const compactMemoryUsage = { 'pod-1':92, 'pod-2':92, 'pod-3':94, 'pod-4':90, 'pod-5':24, 'pod-6':24, 'pod-7':24, 'pod-8':0 };
const compactStatusLabels = { running:'运行中', blocked:'等待中', error:'已失败' };

function compactSortIconMarkup(active=''){
  const upper=active==='asc'?'image_7.png':'image_1.png';
  const lower=active==='desc'?'image_6.png':'image_2.png';
  return `<span class="compact-sort-icon" aria-hidden="true"><img src="${compactTableAssetPath}/${upper}" alt=""><img src="${compactTableAssetPath}/${lower}" alt=""></span>`;
}

function compactPortMarkup(port){
  const match=port.match(/^([^:]+):(\d+)(.*)$/);
  if(!match) return port;
  return `<span class="compact-port-protocol">${match[1]}:</span><span>${match[2]}</span>${match[3]?`<span class="compact-port-extra">${match[3]}</span>`:''}`;
}

function compactExposureMarkup(id,exposure){
  if(exposure==='-') return '-';
  const asset=id==='pod-1'||id==='pod-2'?'image_3.png':exposure==='ALB'?'image_5.png':'image_4.png';
  return `<span class="compact-exposure"><img src="${compactTableAssetPath}/${asset}" alt=""><span>${exposure}</span></span>`;
}

function compactUsageMarkup(type,percent){
  const danger=percent>=80?' danger':'';
  const asset=type==='cpu'?'image_8.png':'image_9.png';
  return `<span class="compact-usage${danger}"><img src="${compactTableAssetPath}/${asset}" alt=""><span>${percent}%</span></span>`;
}

function rowActionsMarkup(id){
  return [
    `<button type="button" data-instance-detail="${id}" aria-label="查看实例详情" title="查看实例详情">${operationIconMarkup('detail')}</button>`,
    `<button type="button" data-instance-terminal="${id}" aria-label="打开终端" title="打开终端">${operationIconMarkup('terminal')}</button>`,
    `<button type="button" data-action="rebuild" data-pod="${id}" aria-label="删除/重建" title="删除/重建">${operationIconMarkup('rebuild')}</button>`,
    `<button type="button" data-action="block" data-pod="${id}" aria-label="屏蔽" title="屏蔽">${operationIconMarkup('block')}</button>`,
    `<button type="button" data-row-more="${id}" aria-label="更多操作" title="更多操作">${operationIconMarkup('more')}</button>`
  ].join('');
}

function compactRowMarkup(pod){
  const [id,name,status,ip,port,exposure,restarts,age,cpu,memory] = pod;
  const cpuPercent=compactCpuUsage[id]??(parseInt(cpu,10)||0);
  const memoryPercent=compactMemoryUsage[id]??Math.min(100,Math.round((parseFloat(memory)||0)/10.5*100));
  const restartTone=restarts>=7?' danger':restarts>=4?' warning':'';
  return `<tr class="${state.selected.has(id) ? 'is-selected' : ''}"><td><input class="pod-check" data-pod="${id}" type="checkbox" ${state.selected.has(id)?'checked':''} aria-label="选择 ${name}"></td><td title="${name}"><button class="pod-link" data-instance-detail="${id}">${name}</button></td><td><span class="compact-status ${status}">${compactStatusLabels[status]}</span></td><td class="compact-ip">${ip}</td><td class="compact-port">${compactPortMarkup(port)}</td><td>${compactExposureMarkup(id,exposure)}</td><td class="compact-restarts${restartTone}">${restarts}</td><td class="compact-age">${age}</td><td>${compactUsageMarkup('cpu',cpuPercent)}</td><td>${compactUsageMarkup('memory',memoryPercent)}</td><td><span class="row-actions">${rowActionsMarkup(id)}</span></td></tr>`;
}

function compactTableMarkup(cluster,podsInCluster,allPodsInCluster,paging){
  const selected=podsInCluster.length>0&&podsInCluster.every(([id])=>state.selected.has(id));
  const partial=podsInCluster.some(([id])=>state.selected.has(id));
  const collapsed=state.collapsedClusters.has(cluster);
  const clusterName=clusterLabels[cluster];
  const meta=clusterMeta[cluster];
  const summary={running:0,error:0,blocked:0};
  allPodsInCluster.forEach(([, ,status])=>summary[status]++);
  return `<section class="cluster-group ${collapsed?'collapsed':''}" data-cluster="${cluster}">
    <header class="group-header"><button class="cluster-toggle" data-cluster-toggle="${cluster}" aria-label="${collapsed?'展开':'收起'}">${icon(collapsed?'chevron-right':'chevron-down')}</button><div class="group-title"><strong>Payment-api</strong><span class="rollout ${cluster}">${meta.channel}</span><span class="versions">${meta.version}&nbsp; ${meta.versions}</span></div><div class="group-summary"><span>运行中 <b class="green">${summary.running}</b></span><span>异常 <b class="red">${summary.error}</b></span><span>已屏蔽 <b class="amber">${summary.blocked}</b></span><i></i><span>共 ${allPodsInCluster.length} pod</span><button class="cluster-more" data-cluster-more="${cluster}" aria-label="${clusterName} 更多操作">${icon('more')}</button></div></header>
    <div class="table-frame"><div class="table-scroll"><table class="pod-table compact-pod-table"><thead><tr><th><input class="cluster-select" data-cluster-select="${cluster}" type="checkbox" ${selected?'checked':''} ${partial&&!selected?'data-indeterminate="true"':''} aria-label="全选 ${clusterName} 当前页"></th><th><span class="column-title">实例名称/集群</span></th><th><span class="column-title">状态</span>${compactSortIconMarkup()}</th><th><span class="column-title">Pod IP</span></th><th><span class="column-title">端口</span></th><th><span class="column-title">服务暴露</span></th><th><span class="column-title">重启</span>${compactSortIconMarkup('desc')}</th><th><span class="column-title">存活</span>${compactSortIconMarkup()}</th><th><span class="column-title">CPU</span>${compactSortIconMarkup('asc')}</th><th><span class="column-title">内存</span>${compactSortIconMarkup('asc')}</th><th><span class="column-title">操作</span></th></tr></thead><tbody>${podsInCluster.map(compactRowMarkup).join('')}</tbody></table></div><i class="frozen-edge frozen-edge-identity" aria-hidden="true"></i></div>
    ${clusterPaginationMarkup(cluster,paging)}
  </section>`;
}

function operationIconMarkup(type){
  const asset=name=>`${operationIconPath}/${name}`;
  if(type==='detail') return `<span class="operation-glyph view-list-glyph" aria-hidden="true"><img class="view-list-frame" src="${asset('image_1.png')}" alt=""><span class="view-list-items">${Array.from({length:3},()=>`<span><img src="${asset('image_2.png')}" alt=""><img src="${asset('image_3.png')}" alt=""></span>`).join('')}</span></span>`;
  if(type==='terminal') return `<img class="operation-glyph" src="${asset('image_4.png')}" alt="">`;
  if(type==='rebuild') return `<span class="operation-glyph hammer-glyph" aria-hidden="true"><img src="${asset('image_5.png')}" alt=""><img src="${asset('image_6.png')}" alt=""></span>`;
  if(type==='block') return `<img class="operation-glyph" src="${asset('image_7.png')}" alt="">`;
  return `<span class="operation-glyph more-glyph" aria-hidden="true">${Array.from({length:3},()=>`<img src="${asset('image_8.png')}" alt="">`).join('')}</span>`;
}

function rowMarkup(pod){
  const [id,name,status,ip,port,exposure,restarts,age,cpu,memory,,gpu] = pod;
  const cpuPercent=parseInt(cpu,10)||0;
  const cpuUsage=`${(cpuPercent*8/100).toFixed(1).replace('.0','')}c`;
  const memoryPercent=Math.min(100,Math.round((parseFloat(memory)||0)/32*100));
  return `<tr class="${state.selected.has(id) ? 'is-selected' : ''}"><td><input class="pod-check" data-pod="${id}" type="checkbox" ${state.selected.has(id)?'checked':''} aria-label="选择 ${name}"></td><td title="${name}"><button class="pod-link" data-instance-detail="${id}">${name}</button></td><td><span class="status-tag ${status}">${labels[status]}</span></td><td>${ip}</td><td>${port}</td><td><span class="exposure-dot"></span>${exposure}</td><td class="${restarts >= 4 ? 'metric-hot' : ''}">${restarts}</td><td>${age}</td><td class="workload-resource-cell cpu-resource-cell">${resourceMetricMarkup('cpu',cpuUsage,'8c','16c',cpuPercent)}</td><td class="workload-resource-cell memory-resource-cell">${resourceMetricMarkup('memory',memory,'32Gi','9.1Gi',memoryPercent)}</td><td class="gpu-resource-cell">${gpuCardMarkup(gpu)}</td><td><span class="row-actions">${rowActionsMarkup(id)}</span></td></tr>`;
}

function sortIconMarkup(active=false){
  return `<span class="sort-icon${active?' is-active':''}" aria-hidden="true"><i></i><i></i></span>`;
}
function tableMarkup(cluster,podsInCluster,allPodsInCluster,paging){
  const selected=podsInCluster.length>0&&podsInCluster.every(([id])=>state.selected.has(id));
  const partial=podsInCluster.some(([id])=>state.selected.has(id));
  const summary={running:0,error:0,blocked:0};
  allPodsInCluster.forEach(([, ,status])=>summary[status]++);
  const collapsed=state.collapsedClusters.has(cluster);
  const clusterName=clusterLabels[cluster];
  const meta=clusterMeta[cluster];
  return `<section class="cluster-group ${collapsed?'collapsed':''}" data-cluster="${cluster}">
    <header class="group-header"><button class="cluster-toggle" data-cluster-toggle="${cluster}" aria-label="${collapsed?'展开':'收起'}">${icon(collapsed?'chevron-right':'chevron-down')}</button><div class="group-title"><strong>Payment-api</strong><span class="rollout ${cluster}">${meta.channel}</span><span class="versions">${meta.version}&nbsp; ${meta.versions}</span></div><div class="group-summary"><span>运行中 <b class="green">${summary.running}</b></span><span>异常 <b class="red">${summary.error}</b></span><span>已屏蔽 <b class="amber">${summary.blocked}</b></span><i></i><span>共 ${allPodsInCluster.length} pod</span><button class="cluster-more" data-cluster-more="${cluster}" aria-label="${clusterName} 更多操作">${icon('more')}</button></div></header>
    <div class="table-frame"><div class="table-scroll"><table class="pod-table"><thead><tr><th><input class="cluster-select" data-cluster-select="${cluster}" type="checkbox" ${selected?'checked':''} ${partial&&!selected?'data-indeterminate="true"':''} aria-label="全选 ${clusterName} 当前页"></th><th><span class="column-title">实例名称/集群</span></th><th><span class="column-title">状态/容器</span>${sortIconMarkup()}</th><th><span class="column-title">Pod IP/节点IP</span></th><th><span class="column-title">端口</span></th><th><span class="column-title">服务暴露</span></th><th><span class="column-title">重启</span>${sortIconMarkup(true)}</th><th><span class="column-title">存活</span>${sortIconMarkup()}</th><th class="cpu-resource-head"><span class="column-title">CPU</span>${sortIconMarkup()}</th><th class="memory-resource-head"><span class="column-title">内存</span>${sortIconMarkup()}</th><th class="gpu-resource-head"><span class="column-title">GPU</span></th><th><span class="column-title">操作</span></th></tr></thead><tbody>${podsInCluster.map(rowMarkup).join('')}</tbody></table></div><i class="frozen-edge frozen-edge-identity" aria-hidden="true"></i></div>
    ${clusterPaginationMarkup(cluster,paging)}
  </section>`;
}

function paginationItems(current,total){
  if(total<=7) return Array.from({length:total},(_,index)=>index+1);
  if(current<=4) return [1,2,3,4,5,'end',total];
  if(current>=total-3) return [1,'start',total-4,total-3,total-2,total-1,total];
  return [1,'start',current-1,current,current+1,'end',total];
}

function clusterPageState(cluster){
  state.clusterPages[cluster]??={page:1,pageSize:10};
  return state.clusterPages[cluster];
}

function paginatedCluster(cluster,items){
  const paging=clusterPageState(cluster);
  const pageCount=Math.max(1,Math.ceil(items.length/paging.pageSize));
  paging.page=Math.max(1,Math.min(paging.page,pageCount));
  const start=(paging.page-1)*paging.pageSize;
  return {...paging,pageCount,total:items.length,items:items.slice(start,start+paging.pageSize)};
}

function resetClusterPages(){
  Object.values(state.clusterPages).forEach(paging=>{paging.page=1;});
}

function clusterPaginationMarkup(cluster,paging){
  if(!paging.total)return '';
  const pageItems=paginationItems(paging.page,paging.pageCount).map(item=>typeof item==='number'
    ? `<button class="page-btn ${item===paging.page?'current':''}" data-page="${item}" ${item===paging.page?'aria-current="page"':''}>${item}</button>`
    : '<span class="page-ellipsis" aria-hidden="true">···</span>'
  ).join('');
  return `<div class="pagination cluster-pagination" data-cluster-pagination="${cluster}"><button class="page-btn page-nav" data-page="prev" aria-label="${clusterLabels[cluster]} 上一页" ${paging.page===1?'disabled':''}>${icon('chevron-left')}</button>${pageItems}<button class="page-btn page-nav" data-page="next" aria-label="${clusterLabels[cluster]} 下一页" ${paging.page===paging.pageCount?'disabled':''}>${icon('chevron-right')}</button><i class="pagination-divider" aria-hidden="true"></i><select class="page-size" aria-label="${clusterLabels[cluster]} 每页条数"><option value="10" ${paging.pageSize===10?'selected':''}>10 条/页</option><option value="20" ${paging.pageSize===20?'selected':''}>20 条/页</option><option value="50" ${paging.pageSize===50?'selected':''}>50 条/页</option></select></div>`;
}

function visiblePods(cluster){
  const items=filteredPods().filter(pod=>pod[10]===cluster);
  return paginatedCluster(cluster,items).items;
}

function updateSelection(){
  const count=state.selected.size;
  document.querySelector('#selectedCount').textContent=count;
  bulkBar.classList.toggle('hidden',count===0);
  document.querySelectorAll('[data-indeterminate="true"]').forEach(input=>input.indeterminate=true);
}

let stickySyncFrame=0;

function hideWorkloadStickyStack(){
  workloadStickyStack.classList.add('hidden');
  workloadStickyStack.replaceChildren();
  delete workloadStickyStack.dataset.signature;
  delete workloadStickyStack.dataset.cluster;
}

function buildWorkloadStickyStack(group,signature){
  const inner=document.createElement('div');
  inner.className='workload-sticky-stack-inner cluster-group';
  inner.dataset.cluster=group.dataset.cluster;

  const title=document.querySelector('.title-row').cloneNode(true);
  title.classList.add('sticky-title-row');
  title.removeAttribute('data-workload-section');
  title.querySelector('#titleStatusSelect').dataset.stickyStatusSelect='';
  ['restartBtn','horizontalScaleBtn','verticalScaleBtn','actionMoreBtn'].forEach(id=>{
    title.querySelector(`#${id}`).dataset.stickyTitleAction=id;
  });
  inner.append(title);

  const content=document.createElement('div');
  content.className='sticky-workload-content';
  const header=group.querySelector('.group-header').cloneNode(true);
  content.append(header);
  const spacer=document.createElement('div');
  spacer.className='workload-sticky-spacer';
  content.append(spacer);

  if(!group.classList.contains('collapsed')){
    const sourceTable=group.querySelector('.pod-table');
    const sourceHead=sourceTable?.tHead;
    if(sourceTable&&sourceHead){
      const frame=document.createElement('div');
      frame.className='table-frame sticky-table-frame';
      const scroll=document.createElement('div');
      scroll.className='table-scroll sticky-table-scroll';
      const table=sourceTable.cloneNode(false);
      table.append(sourceHead.cloneNode(true));
      scroll.append(table);
      frame.append(scroll);
      content.append(frame);
    }
  }
  inner.append(content);

  inner.querySelectorAll('[id]').forEach(element=>element.removeAttribute('id'));
  const sourceSelect=group.querySelector('.cluster-select');
  const stickySelect=inner.querySelector('.cluster-select');
  if(sourceSelect&&stickySelect) stickySelect.indeterminate=sourceSelect.indeterminate;
  workloadStickyStack.replaceChildren(inner);
  workloadStickyStack.dataset.signature=signature;
  workloadStickyStack.dataset.cluster=group.dataset.cluster;
}

function syncWorkloadStickyStack(){
  if(document.querySelector('.workload-list-panel')?.classList.contains('hidden')){
    hideWorkloadStickyStack();
    return;
  }

  const workspaceRect=workspace.getBoundingClientRect();
  const stickyTop=workspaceRect.top+66;
  const groups=Array.from(clusterGroups.querySelectorAll('.cluster-group'));
  let activeIndex=-1;
  groups.forEach((group,index)=>{
    const headerRect=group.querySelector('.group-header').getBoundingClientRect();
    if(headerRect.top<=stickyTop&&group.getBoundingClientRect().bottom>stickyTop) activeIndex=index;
  });

  if(activeIndex<0){
    hideWorkloadStickyStack();
    return;
  }

  const group=groups[activeIndex];
  const collapsed=group.classList.contains('collapsed');
  const signature=`${group.dataset.cluster}:${state.viewMode}:${collapsed}:${state.selected.size}`;
  if(workloadStickyStack.dataset.signature!==signature) buildWorkloadStickyStack(group,signature);

  const groupRect=group.getBoundingClientRect();
  const nextHeader=groups[activeIndex+1]?.querySelector('.group-header');
  const boundary=nextHeader?.getBoundingClientRect().top??groupRect.bottom;
  const contentHeight=collapsed?52:100;
  const stackHeight=collapsed?118:166;
  const innerOffset=Math.min(0,boundary-stickyTop-contentHeight);
  const sourceScroll=group.querySelector('.table-scroll');
  const stickyScroll=workloadStickyStack.querySelector('.sticky-table-scroll');

  workloadStickyStack.style.top=`${workspaceRect.top}px`;
  workloadStickyStack.style.left=`${workspaceRect.left}px`;
  workloadStickyStack.style.width=`${workspaceRect.width}px`;
  workloadStickyStack.style.height=`${stackHeight}px`;
  workloadStickyStack.querySelector('.sticky-workload-content').style.transform=`translateY(${innerOffset}px)`;
  if(sourceScroll&&stickyScroll) stickyScroll.scrollLeft=sourceScroll.scrollLeft;
  workloadStickyStack.classList.remove('hidden');
}

function scheduleWorkloadStickySync(){
  if(stickySyncFrame)return;
  stickySyncFrame=requestAnimationFrame(()=>{
    stickySyncFrame=0;
    syncWorkloadStickyStack();
  });
}

function render(){
  const result=filteredPods();
  const byCluster=Object.keys(clusterLabels).map(cluster=>{
    const allItems=result.filter(pod=>pod[10]===cluster);
    if(!allItems.length)return null;
    const paging=paginatedCluster(cluster,allItems);
    return {cluster,allItems,paging};
  }).filter(Boolean);
  const renderTable=state.viewMode==='compact'?compactTableMarkup:tableMarkup;
  hideWorkloadStickyStack();
  clusterGroups.innerHTML=byCluster.map(({cluster,allItems,paging})=>renderTable(cluster,paging.items,allItems,paging)).join('');
  clusterGroups.classList.toggle('compact-mode',state.viewMode==='compact');
  workloadStickyStack.classList.toggle('compact-mode',state.viewMode==='compact');
  document.querySelector('#titleClusterSelect').value=state.cluster;
  document.querySelector('#titleStatusSelect').value=state.status;
  document.querySelector('#allCount').textContent = String(pods.length).padStart(2,'0');
  document.querySelector('#runningCount').textContent = String(pods.filter(([, ,status])=>status==='running').length).padStart(2,'0');
  document.querySelector('#errorCount').textContent = String(pods.filter(([, ,status])=>status==='error').length).padStart(2,'0');
  document.querySelector('#blockedCount').textContent = String(pods.filter(([, ,status])=>status==='blocked').length).padStart(2,'0');
  document.querySelector('#emptyState').classList.toggle('hidden',result.length!==0);
  updateSelection();
  scheduleWorkloadStickySync();
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
  const [id,name,status,ip,port,,restarts,age,cpu,memory,cluster,gpu]=pod;
  const paused=state.pausedPods.has(id);
  const containerProfiles=[
    {name:'ranking-inference',type:'主容器',tone:'',status:'运行中',ready:'是',restarts:'0',age:'8d',image:'registry.internal/payments/api-gateway:v2.2.5',pull:'IfNotPresent',command:'/app/server --config=/etc/app/config/server.yaml --port=8500',cpu:['7.2c','8c','16c',99],memory:['29.44Gi','32Gi','9.1Gi',99],ports:[['静态','main','8092'],['静态','prometheus','8990'],['静态','xxl-job','8209']],mounts:[['config','/etc/app/config','ConfigMap: app-config','只读'],['secrets','/etc/app/secrets','Secret: payment-secrets','只读'],['data','/data','PVC: payment-data','读写']],env:[['POD_NAME','(metadata.name)','Field'],['POD_NAMESPACE','(metadata.namespace)','Field'],['NODE_NAME','-Xms2g -Xmx4g -XX:+UseG1GC','-']],termination:['Completed','0','2026.06.04 04:20:06','2026.06.04 04:20:06']},
    {name:'ranking-inference',type:'Sidecar',tone:'sidecar',status:'运行中',ready:'是',restarts:'1',age:'8d',image:'registry.internal/observability/log-agent:v1.12.0',pull:'IfNotPresent',command:'/agent/log-collector --config=/etc/agent/config.yaml',cpu:['0.6c','1c','0.5c',60],memory:['1.82Gi','4Gi','2Gi',46],ports:[['静态','metrics','9090'],['静态','health','9091']],mounts:[['logs','/var/log/app','EmptyDir: app-logs','只读'],['config','/etc/agent','ConfigMap: log-agent','只读']],env:[['POD_NAME','(metadata.name)','Field'],['LOG_LEVEL','info','Config'],['SCRAPE_INTERVAL','30s','Config']],termination:['Completed','0','2026.06.03 18:11:32','2026.06.03 18:11:33']},
    {name:'ranking-inference',type:'容器',tone:'regular',status:'运行中',ready:'是',restarts:'0',age:'7d',image:'registry.internal/payments/model-server:v4.7.1',pull:'Always',command:'/model/server --model=/models/ranking --grpc-port=8500',cpu:['3.8c','6c','4c',63],memory:['18.6Gi','24Gi','16Gi',78],ports:[['静态','grpc','8500'],['静态','admin','8501']],mounts:[['models','/models','PVC: ranking-models','只读'],['cache','/cache','EmptyDir: model-cache','读写']],env:[['MODEL_NAME','ranking-v47','Config'],['GRPC_PORT','8500','Config'],['CUDA_VISIBLE_DEVICES','0','Config']],termination:['Completed','0','2026.06.02 09:36:18','2026.06.02 09:36:19']},
    {name:'ranking-inference',type:'Init',tone:'init',status:'已完成',ready:'是',restarts:'0',age:'8d',image:'registry.internal/base/model-loader:v2.3.0',pull:'IfNotPresent',command:'/bin/model-loader --source=bos://models/ranking-v47',cpu:['0.2c','1c','0.2c',20],memory:['0.74Gi','2Gi','1Gi',37],ports:[],mounts:[['models','/models','PVC: ranking-models','读写'],['credentials','/etc/bos','Secret: bos-access','只读']],env:[['MODEL_VERSION','ranking-v47','Config'],['TARGET_PATH','/models','Config'],['VERIFY_CHECKSUM','true','Config']],termination:['Completed','0','2026.06.04 04:19:42','2026.06.04 04:20:01']}
  ];
  const profile=containerProfiles[state.selectedContainer] || containerProfiles[0];
  const tabs=[['detail','详细信息'],['logs','日志'],['terminal','终端'],['events','事件']];
  const tabBar=tabs.map(([key,label])=>`<button class="${key===tab?'active':''}" data-detail-tab="${key}">${label}</button>`).join('');
  const summary=`<section class="instance-summary ${state.instanceSummaryCollapsed?'is-collapsed':''}"><div class="summary-grid"><div><span>应用</span><strong>应用名称占位</strong></div><div><span>集群</span><strong>${cluster}</strong></div><div><span>工作负载</span><strong>${cluster}</strong></div></div></section>`;
  const details=`<div class="pod-detail-page container-detail-view">
    <section class="drawer-detail-section drawer-basic-section">
      <h3>基本信息</h3>
      <div class="drawer-status-grid"><span>状态 <b class="success-text">${profile.status}</b></span><span>就绪 <b>${profile.ready}</b></span><span>重启 <b class="danger-text">${profile.restarts}</b></span><span>存活 <b>${profile.age}</b></span></div>
      <dl class="drawer-description-list"><div><dt>镜像</dt><dd>${profile.image}<em>${profile.pull}</em></dd></div><div><dt>启动命令</dt><dd>${profile.command}</dd></div></dl>
      <div class="drawer-resource-row"><span class="drawer-field-label">资源用量</span><div class="drawer-resource-metric"><span class="cpu-mark">${icon('cpu')}</span><div><strong>${profile.cpu.slice(0,3).join('/')}</strong><span><i><b style="width:${profile.cpu[3]}%"></b></i><em>${profile.cpu[3]}%</em></span><small>CPU</small></div></div><div class="drawer-resource-metric"><span class="memory-mark">${icon('memory')}</span><div><strong>${profile.memory.slice(0,3).join('/')}</strong><span><i><b style="width:${profile.memory[3]}%"></b></i><em>${profile.memory[3]}%</em></span><small>内存</small></div></div><div class="drawer-gpu-summary">${gpuCardMarkup(gpu)}<small>GPU</small></div></div>
    </section>
    <section class="drawer-detail-section"><div class="drawer-section-heading"><h3>端口 <b>${profile.ports.length}</b></h3><button type="button">${icon('clipboard')} 复制全部IP:PORT</button></div><div class="drawer-data-table port-detail-table"><div class="table-head"><span>端口类型</span><span>端口名称</span><span>端口号</span><span>操作</span></div>${profile.ports.length?profile.ports.map(item=>`<div><span>${item[0]}</span><span>${item[1]}</span><span>${item[2]}</span><button type="button" title="复制端口">${icon('clipboard')}</button></div>`).join(''):'<p class="drawer-empty-row">暂无端口</p>'}</div></section>
    <section class="drawer-detail-section"><h3>挂载 <b>${profile.mounts.length}</b></h3><div class="drawer-data-table mount-detail-table"><div class="table-head"><span>挂载类型</span><span>挂载路径</span><span>来源</span><span>操作</span></div>${profile.mounts.map(item=>`<div>${item.map(value=>`<span>${value}</span>`).join('')}</div>`).join('')}</div></section>
    <section class="drawer-detail-section"><h3>环境变量 <b>${profile.env.length}</b></h3><div class="drawer-data-table env-detail-table"><div class="table-head"><span>名称</span><span>值</span><span>来源</span></div>${profile.env.map(item=>`<div>${item.map(value=>`<span>${value}</span>`).join('')}</div>`).join('')}</div></section>
    <section class="drawer-detail-section drawer-termination"><h3>上一次终止</h3><dl><div><dt>原因</dt><dd>${profile.termination[0]}</dd></div><div><dt>退出码</dt><dd>${profile.termination[1]}</dd></div><div><dt>开始时间</dt><dd>${profile.termination[2]}</dd></div><div><dt>结束时间</dt><dd>${profile.termination[3]}</dd></div></dl></section>
  </div>`;
  const logs=`<div class="tool-pane"><div class="tool-toolbar"><span>当前运行</span><button data-log-mode="latest">最新日志</button><label>${icon('search')}<input placeholder="搜索日志"></label><button data-log-fullscreen="${id}" title="全屏">${icon('unfold')}</button></div><div class="terminal-screen log-screen">${logLines(name)}</div></div>`;
  const terminal=`<div class="tool-pane"><div class="tool-toolbar"><select><option>ranking-inference</option></select><span>/bin/bash</span><button>${icon('refresh')}重新连接</button></div><div class="terminal-screen"><p><b>root@${name.slice(-8)}:</b>/app# ps aux</p><p>PID USER COMMAND</p><p>1 root /app/server --config=/etc/app/config/server.yaml</p><p>27 root /bin/bash</p><p><b>root@${name.slice(-8)}:</b>/app# <span class="cursor"></span></p></div></div>`;
  const events=`<div class="event-pane"><div class="event-toolbar"><select><option>全部类型</option><option>Normal</option><option>Warning</option></select><button>${icon('refresh')}刷新</button></div><div class="event-table"><div class="table-head"><span>类型</span><span>原因</span><span>信息</span><span>时间</span></div><div><span class="success-text">Normal</span><span>Started</span><span>Started container ranking-inference</span><span>2 分钟前</span></div><div><span class="success-text">Normal</span><span>Pulled</span><span>Container image already present on machine</span><span>2 分钟前</span></div><div><span class="warning-text">Warning</span><span>Unhealthy</span><span>Readiness probe failed, retry succeeded</span><span>1 小时前</span></div></div></div>`;
  const containerItems=[['主容器',''],['Sidecar','sidecar'],['容器','regular'],['Init','init']];
  const containers=`<nav class="container-strip" aria-label="容器选择">${containerItems.map(([type,tone],index)=>`<button class="${state.selectedContainer===index?'active':''}" data-container-select="${index}" ${state.selectedContainer===index?'aria-current="true"':''}><span class="container-dot ${tone}"></span><strong>ranking-inference</strong><small>${type}</small></button>`).join('')}</nav>`;
  return `<header class="instance-header"><div class="instance-title-wrap"><div class="instance-title"><h2 id="instanceTitle" title="${name}">${name}</h2><span class="status-tag ${paused?'blocked':status}">${paused?'已暂停':labels[status]}</span></div></div><div class="instance-header-actions"><button data-pause-pod="${id}">${paused?'恢复':'暂停'}</button><button data-detail-action="restart" title="重启">${icon('power')}</button><button data-detail-action="rebuild" title="删除/重建">${icon('refresh')}</button><button data-open-new="${id}" title="在新标签页打开">${icon('unfold')}</button><button class="close-detail" aria-label="关闭" title="关闭">×</button></div></header>${summary}<button class="summary-toggle" data-summary-toggle="${id}" aria-expanded="${!state.instanceSummaryCollapsed}">${state.instanceSummaryCollapsed?'展开':'收起'} ${icon(state.instanceSummaryCollapsed?'chevron-down':'chevron-up')}</button><section class="instance-workbench">${containers}<nav class="detail-tabs">${tabBar}</nav><div class="detail-body" data-instance-id="${id}">${tab==='detail'?details:tab==='logs'?logs:tab==='terminal'?terminal:events}</div></section>`;
}
function yamlMarkup(pod){
  const [id,name,,, ,,,, , ,cluster]=pod;
  return `<header class="instance-header yaml-header"><div class="instance-title-wrap"><button data-yaml-back="${id}" aria-label="返回">${icon('chevron-right')}</button><div><h2 id="instanceTitle">Pod YAML</h2><p>${name}</p></div></div><button class="close-detail" aria-label="关闭">×</button></header><div class="yaml-toolbar"><label>${icon('search')}<input placeholder="搜索YAML内容..."></label><button>复制</button></div><pre class="yaml-code"><code>apiVersion: v1\nkind: Pod\nmetadata:\n  name: ${name}\n  namespace: payment-production\n  labels:\n    app: ranking-inference\nspec:\n  nodeName: ${cluster}\n  containers:\n    - name: ranking-inference\n      image: registry.internal/payments/api-gateway:v2.2.5\n      imagePullPolicy: IfNotPresent\n      ports:\n        - containerPort: 8500\n      resources:\n        requests:\n          cpu: "2"\n          memory: 8Gi\n        limits:\n          cpu: "4"\n          memory: 12Gi\nstatus:\n  phase: Running</code></pre>`;
}
function openInstanceDetail(id,tab='detail'){ const pod=pods.find(item=>item[0]===id); if(!pod)return; if(state.activeInstanceId!==id){state.selectedContainer=0;state.activeInstanceId=id;} instanceModal.innerHTML=instanceMarkup(pod,tab); detailBackdrop.classList.remove('hidden'); }
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
  closeEnvPopover();
  closeClusterPopover();
  const rect = trigger.getBoundingClientRect();
  accountPopover.style.top = `${rect.bottom - 1}px`;
  accountPopover.style.left = `${Math.max(16, Math.min(rect.left - 20, window.innerWidth - 496))}px`;
  accountPopover.classList.remove('hidden');
  renderAccountPopover();
  document.querySelector('#accountSearchInput').focus();
}
function closeEnvPopover(){ envPopover.classList.add('hidden'); }
function renderEnvPopover(){
  const query = state.envQuery.toLowerCase();
  const visible = environments.filter(env => (state.envTab === 'all' || (state.envTab === 'recent' && env.recent) || env.tab === state.envTab) && (!query || env.name.toLowerCase().includes(query)));
  envList.innerHTML = visible.length ? visible.map(env => `<button class="env-row ${env.id===state.selectedEnv?'selected':''}" data-env-select="${env.id}"><img src="${breadcrumbAssetPath}/${env.icon}" alt=""><span class="env-name">${env.name}</span><span class="env-type-tag">${env.tag}</span></button>`).join('') : '<p class="env-empty">未找到匹配环境</p>';
  document.querySelectorAll('[data-env-tab]').forEach(button => button.classList.toggle('active', button.dataset.envTab === state.envTab));
}
function openEnvPopover(trigger){
  closeMenu();
  closeAccountPopover();
  closeClusterPopover();
  const rect = trigger.getBoundingClientRect();
  envPopover.style.top = `${rect.bottom - 1}px`;
  envPopover.style.left = `${Math.max(16, Math.min(rect.left - 20, window.innerWidth - 496))}px`;
  envPopover.classList.remove('hidden');
  renderEnvPopover();
  document.querySelector('#envSearchInput').focus();
}
function closeClusterPopover(){ clusterPopover.classList.add('hidden'); }
function renderClusterPopover(){
  const query = state.clusterQuery.toLowerCase();
  const visible = clusters.filter(c => !query || c.name.toLowerCase().includes(query));
  clusterList.innerHTML = visible.length ? visible.map(c => `<button class="cluster-row ${c.id===state.selectedCluster?'selected':''}" data-cluster-select="${c.id}"><span class="cluster-identity"><span class="cluster-avatar"><img src="${breadcrumbAssetPath}/image_55.png" alt=""></span><span class="cluster-name">${c.name}</span></span><span class="cluster-type-tag">${c.tag}</span><span class="cluster-count">${c.available} / ${c.expected}</span></button>`).join('') : '<p class="cluster-empty">未找到匹配集群</p>';
}
function openClusterPopover(trigger){
  closeMenu();
  closeAccountPopover();
  closeEnvPopover();
  const rect = trigger.getBoundingClientRect();
  clusterPopover.style.top = `${rect.bottom - 1}px`;
  clusterPopover.style.left = `${Math.max(16, Math.min(rect.left - 20, window.innerWidth - 496))}px`;
  clusterPopover.classList.remove('hidden');
  renderClusterPopover();
  document.querySelector('#clusterSearchInput').focus();
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
  if(key==='home'){ toast('已返回 CNAP 首页'); return; }
  if(key==='account'){ openAccountPopover(button); return; }
  if(key==='environment'){ openEnvPopover(button); return; }
  if(key==='cluster'){ openClusterPopover(button); return; }
  const lists={
    application:[{key:'context-application-payment',label:'Payment-api',icon:'apps'},{key:'context-application-order',label:'Order-service',icon:'apps'},{key:'context-application-gateway',label:'Gateway',icon:'apps'}]
  };
  openMenu(button, lists[key]); menu.dataset.context='应用';
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
document.querySelector('#envSearchInput').addEventListener('input', event => { state.envQuery = event.target.value.trim(); renderEnvPopover(); });
document.querySelectorAll('[data-env-tab]').forEach(button => button.addEventListener('click', () => { state.envTab = button.dataset.envTab; renderEnvPopover(); }));
envList.addEventListener('click', event => {
  const item = event.target.closest('[data-env-select]');
  if(!item) return;
  state.selectedEnv = item.dataset.envSelect;
  const selected = environments.find(e => e.id === state.selectedEnv);
  document.querySelector('[data-context="environment"]').innerHTML = `<span class="env-tag">${selected.tab==='prod'?'生产':'测试'}</span>${selected.name}<svg class="chevron"><use href="#i-chevron-down"/></svg>`;
  closeEnvPopover();
  toast(`已切换环境：${selected.name}`);
});
document.querySelectorAll('[data-env-action]').forEach(button => button.addEventListener('click', () => {
  closeEnvPopover();
  toast('已打开新建环境');
}));
document.querySelector('#clusterSearchInput').addEventListener('input', event => { state.clusterQuery = event.target.value.trim(); renderClusterPopover(); });
clusterList.addEventListener('click', event => {
  const item = event.target.closest('[data-cluster-select]');
  if(!item) return;
  state.selectedCluster = item.dataset.clusterSelect;
  const selected = clusters.find(c => c.id === state.selectedCluster);
  document.querySelector('[data-context="cluster"]').innerHTML = `${selected.name}<svg class="chevron"><use href="#i-chevron-down"/></svg>`;
  closeClusterPopover();
  toast(`已切换集群：${selected.name}`);
});
document.querySelectorAll('[data-cluster-action]').forEach(button => button.addEventListener('click', () => {
  closeClusterPopover();
  toast('已打开绑定新集群');
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
  state.status=button.dataset.status; resetClusterPages(); document.querySelector('#statusSelect').value=state.status; render();
}));
document.querySelector('#statusSelect').addEventListener('change',event=>{state.status=event.target.value;resetClusterPages();document.querySelectorAll('.tabs button').forEach(item=>item.classList.toggle('active',item.dataset.status===state.status));render();});
document.querySelector('#clusterSelect').addEventListener('change',event=>{state.cluster=event.target.value;resetClusterPages();render();});
document.querySelector('#titleStatusSelect').addEventListener('change',event=>{state.status=event.target.value;resetClusterPages();document.querySelector('#statusSelect').value=state.status;document.querySelectorAll('.tabs button').forEach(item=>item.classList.toggle('active',item.dataset.status===state.status));render();});
document.querySelector('#titleClusterSelect').addEventListener('change',event=>{state.cluster=event.target.value;resetClusterPages();document.querySelector('#clusterSelect').value=state.cluster;render();});
document.querySelector('#searchInput').addEventListener('input',event=>{state.query=event.target.value.trim().toLowerCase();resetClusterPages();render();});
document.querySelector('#collapseAllBtn').addEventListener('click',()=>setAllWorkloadsCollapsed(true));
document.querySelector('#expandAllBtn').addEventListener('click',()=>setAllWorkloadsCollapsed(false));
document.querySelector('#refreshBtn').addEventListener('click',()=>{toast('Pod 列表已刷新');render();});
document.querySelectorAll('.table-tools .view').forEach(button=>button.addEventListener('click',()=>{state.viewMode=button.dataset.viewMode;document.querySelectorAll('.table-tools .view').forEach(item=>{const selected=item===button;item.classList.toggle('active',selected);item.setAttribute('aria-pressed',String(selected));});render();toast(state.viewMode==='compact'?'已切换为精简模式':'已切换为详细模式');}));
document.querySelector('#restartBtn').addEventListener('click',()=>triggerAction('restart'));
document.querySelector('#horizontalScaleBtn').addEventListener('click',()=>triggerAction('horizontal'));
document.querySelector('#verticalScaleBtn').addEventListener('click',()=>triggerAction('vertical'));
document.querySelector('#actionMoreBtn').addEventListener('click',event=>{event.stopPropagation();openMenu(event.currentTarget,[{key:'history',label:'查看变更记录',icon:'clipboard'},{key:'refresh',label:'刷新 Pod 列表',icon:'refresh'},{key:'delete-deployment',label:'删除部署资源',icon:'apps'}]);});
workspace.addEventListener('scroll',scheduleWorkloadStickySync,{passive:true});
clusterGroups.addEventListener('scroll',scheduleWorkloadStickySync,{capture:true,passive:true});
window.addEventListener('resize',scheduleWorkloadStickySync,{passive:true});
workloadStickyStack.addEventListener('change',event=>{
  if(event.target.matches('[data-sticky-status-select]')){
    state.status=event.target.value;
    resetClusterPages();
    document.querySelector('#statusSelect').value=state.status;
    document.querySelectorAll('.tabs button').forEach(item=>item.classList.toggle('active',item.dataset.status===state.status));
    render();
    return;
  }
  if(!event.target.matches('.cluster-select'))return;
  const cluster=event.target.dataset.clusterSelect;
  visiblePods(cluster).forEach(([id])=>event.target.checked?state.selected.add(id):state.selected.delete(id));
  render();
});
workloadStickyStack.addEventListener('click',event=>{
  const titleAction=event.target.closest('[data-sticky-title-action]');
  if(titleAction){
    const action=titleAction.dataset.stickyTitleAction;
    if(action==='actionMoreBtn'){
      event.stopPropagation();
      openMenu(titleAction,[{key:'history',label:'查看变更记录',icon:'clipboard'},{key:'refresh',label:'刷新 Pod 列表',icon:'refresh'},{key:'delete-deployment',label:'删除部署资源',icon:'apps'}]);
    }else{
      document.querySelector(`#${action}`).click();
    }
    return;
  }
  const toggle=event.target.closest('[data-cluster-toggle]');
  if(toggle){
    setWorkloadCollapsed(toggle.dataset.clusterToggle,!state.collapsedClusters.has(toggle.dataset.clusterToggle));
    return;
  }
  const clusterMore=event.target.closest('[data-cluster-more]');
  if(clusterMore){
    event.stopPropagation();
    const cluster=clusterMore.dataset.clusterMore;
    const collapsed=state.collapsedClusters.has(cluster);
    openMenu(clusterMore,[{key:collapsed?'expand-cluster':'collapse-cluster',label:collapsed?'展开集群':'收起集群',icon:collapsed?'chevron-down':'chevron-up'},{key:'history',label:'查看集群变更记录',icon:'clipboard'}]);
    menu.dataset.cluster=cluster;
  }
});
clusterGroups.addEventListener('change',event=>{
  if(event.target.matches('.page-size')){
    const cluster=event.target.closest('[data-cluster-pagination]')?.dataset.clusterPagination;
    if(!cluster)return;
    const paging=clusterPageState(cluster);
    paging.pageSize=Number(event.target.value);
    paging.page=1;
    render();
    return;
  }
  if(event.target.matches('.pod-check')){
    event.target.checked?state.selected.add(event.target.dataset.pod):state.selected.delete(event.target.dataset.pod);
    event.target.closest('tr')?.classList.toggle('is-selected',event.target.checked);
    updateSelection();
  }
  if(event.target.matches('.cluster-select')){ const cluster=event.target.dataset.clusterSelect; visiblePods(cluster).forEach(([id])=>event.target.checked?state.selected.add(id):state.selected.delete(id)); render(); }
});
clusterGroups.addEventListener('click',event=>{
  const pageButton=event.target.closest('[data-page]');
  if(pageButton){
    const cluster=pageButton.closest('[data-cluster-pagination]')?.dataset.clusterPagination;
    if(!cluster)return;
    const paging=clusterPageState(cluster);
    const pageCount=Math.max(1,Math.ceil(filteredPods().filter(pod=>pod[10]===cluster).length/paging.pageSize));
    paging.page=pageButton.dataset.page==='prev'?paging.page-1:pageButton.dataset.page==='next'?paging.page+1:Number(pageButton.dataset.page);
    paging.page=Math.max(1,Math.min(pageCount,paging.page));
    render();
    return;
  }
  const terminal=event.target.closest('[data-instance-terminal]');
  if(terminal){ openInstanceDetail(terminal.dataset.instanceTerminal,'terminal'); return; }
  const detail=event.target.closest('[data-instance-detail]');
  if(detail){ openInstanceDetail(detail.dataset.instanceDetail); return; }
  const toggle=event.target.closest('[data-cluster-toggle]');
  if(toggle){ setWorkloadCollapsed(toggle.dataset.clusterToggle,!state.collapsedClusters.has(toggle.dataset.clusterToggle)); return; }
  const clusterMore=event.target.closest('[data-cluster-more]');
  if(clusterMore){ event.stopPropagation(); const cluster=clusterMore.dataset.clusterMore; const collapsed=state.collapsedClusters.has(cluster); openMenu(clusterMore,[{key:collapsed?'expand-cluster':'collapse-cluster',label:collapsed?'展开集群':'收起集群',icon:collapsed?'chevron-down':'chevron-up'},{key:'history',label:'查看集群变更记录',icon:'clipboard'}]); menu.dataset.cluster=cluster; return; }
  const button=event.target.closest('[data-action]');
  if(button){ triggerAction(button.dataset.action,[button.dataset.pod]); return; }
  const more=event.target.closest('[data-row-more]');
  if(more){ event.stopPropagation(); openMenu(more,[{key:'detail',label:'查看实例详情',icon:'clipboard'},{key:'history',label:'查看实例变更记录',icon:'clipboard'},{key:'restart-row',label:'重启实例',icon:'power'}]); menu.dataset.pod=more.dataset.rowMore; }
});
document.querySelectorAll('[data-bulk-action]').forEach(button=>button.addEventListener('click',()=>triggerAction(button.dataset.bulkAction,[...state.selected])));
document.querySelector('#clearSelectionBtn').addEventListener('click',()=>{state.selected.clear();render();});
menu.addEventListener('click',event=>{const item=event.target.closest('[data-menu-action]');if(!item)return;const pod=menu.dataset.pod;const cluster=menu.dataset.cluster;const key=item.dataset.menuAction; if(key==='history') openHistory(); else if(key==='detail') openInstanceDetail(pod); else if(key==='refresh'){toast('Pod 列表已刷新');render();} else if(key==='collapse-cluster') setWorkloadCollapsed(cluster,true); else if(key==='expand-cluster') setWorkloadCollapsed(cluster,false); else if(key==='restart-row') triggerAction('restart',[pod]); else if(key==='delete-deployment') triggerAction('delete-deployment'); else if(key==='more-customize') toast('导航设置将在后续版本开放'); else if(key.startsWith('context-')) toast(`已切换${menu.dataset.context || ''}：${item.textContent.trim()}`); else if(key==='header-preferences') toast('已打开偏好设置'); else if(key==='header-help') toast('已打开帮助文档'); else toast(`已选择${item.textContent.trim()}`); closeMenu();});
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
  if(container){const activeTab=instanceModal.querySelector('[data-detail-tab].active')?.dataset.detailTab || 'detail';const body=instanceModal.querySelector('.detail-body');state.selectedContainer=Number(container.dataset.containerSelect);if(body)openInstanceDetail(body.dataset.instanceId,activeTab);return;}
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
document.addEventListener('click',event=>{if(!event.target.closest('#actionMenu'))closeMenu(); if(!event.target.closest('#accountPopover') && !event.target.closest('[data-context="account"]')) closeAccountPopover(); if(!event.target.closest('#envPopover') && !event.target.closest('[data-context="environment"]')) closeEnvPopover(); if(!event.target.closest('#clusterPopover') && !event.target.closest('[data-context="cluster"]')) closeClusterPopover(); if(!event.target.closest('#compactMorePopover') && !event.target.closest('#primaryMoreBtn')) closeCompactMore();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){closeMenu();closeAccountPopover();closeEnvPopover();closeClusterPopover();closeCompactMore();closeModal();closeInstanceDetail();historyDrawer.classList.add('hidden');}});
renderHistory(); render(); renderAppNavigation();
