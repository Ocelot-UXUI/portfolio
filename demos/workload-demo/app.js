const clusterDefinitions = [
  {id:'imeonline',name:'Payment-api',environment:'华北生产',channel:'稳定发布',version:'v1.8.3',versions:'等 3 个版本',podCount:55,running:33,error:11,blocked:11,tag:'K8S'},
  {id:'edge-prod',name:'Order-service',environment:'华东生产',channel:'灰度发布',version:'v2.4.1',versions:'等 2 个版本',podCount:18,running:11,error:4,blocked:3,tag:'K8S'},
  {id:'beijing-eci',name:'Gateway-service',environment:'华北边缘',channel:'稳定发布',version:'v3.1.0',versions:'等 4 个版本',podCount:10,running:6,error:2,blocked:2,tag:'ECI'},
  {id:'chengdu-eci',name:'Risk-engine',environment:'西南生产',channel:'金丝雀发布',version:'v2.7.6',versions:'等 2 个版本',podCount:7,running:4,error:2,blocked:1,tag:'ECI'},
  {id:'guangzhou-k8s',name:'Search-indexer',environment:'华南生产',channel:'稳定发布',version:'v4.0.2',versions:'等 3 个版本',podCount:5,running:3,error:1,blocked:1,tag:'K8S'},
  {id:'shanghai-k8s',name:'Billing-worker',environment:'华东生产',channel:'热修复',version:'v1.5.2',versions:'单一版本',podCount:3,running:2,error:1,blocked:0,tag:'K8S'},
  {id:'hangzhou-eci',name:'Notification-service',environment:'华北测试',channel:'灰度发布',version:'v2.0.0-beta.3',versions:'单一版本',podCount:2,running:1,error:1,blocked:0,tag:'ECI'}
];

const podTemplates = {
  cpu:[99,85,91,75,63,42,24,12,8,0],
  memory:[9.7,9.1,9.6,8.8,7.4,5.6,3.2,2.1,1.2,0.8],
  ports:['grpc:8500','grpc:8500 +1','http:8080','http:8080 +2','metrics:9090'],
  exposures:['ENS','ENS','ALB','ENS','-'],
  ages:['1h','6h','1d','3d','6d','7d','8d'],
  suffixes:['7k2mq','p9wqa','c4r8n','m2x6b','v8t3p','q5j1d','h9s4f','w3n7k','a6e2r','u1y5c']
};

function createPods(){
  let sequence=0;
  return clusterDefinitions.flatMap(cluster=>Array.from({length:cluster.podCount},(_,clusterIndex)=>{
    sequence+=1;
    const index=sequence-1;
    const status=clusterIndex<cluster.running
      ?'running'
      :clusterIndex<cluster.running+cluster.error
        ?'error'
        :'blocked';
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
      cluster.id,
      gpuIsP800
        ? {model:'P800',memory:'192G',count:gpuCount,variant:'p800'}
        : {model:'A100',memory:'80G',count:gpuCount,variant:'a100'}
    ];
  }));
}

const pods = createPods();
const labels = { running:'运行中', error:'异常', blocked:'已摘流' };
const clusterLabels = Object.fromEntries(clusterDefinitions.map(cluster=>[cluster.id,cluster.name]));
const clusterMeta = Object.fromEntries(clusterDefinitions.map(cluster=>[cluster.id,cluster]));
const clusterPages = Object.fromEntries(clusterDefinitions.map(cluster=>[cluster.id,{page:1,pageSize:10}]));
const state = { status:'all', cluster:'all', traffic:'all', query:'', clusterPages, viewMode:'detailed', collapsedClusters:new Set(), selected:new Set(), pausedPods:new Set(), instanceSummaryCollapsed:false, selectedContainer:0, activeInstanceId:null, executing:false, primaryNav:'apps', appNav:'workload', appNavExpanded:true, secondaryCollapsed:false, accountTab:'all', accountQuery:'', compactMoreOpen:false, envTab:'all', envQuery:'', selectedEnv:'imeonline', clusterQuery:'', selectedCluster:'imeonline' };
const clusterGroups = document.querySelector('#clusterGroups');
const workspace = document.querySelector('.workspace');
const workloadStickyStack = document.querySelector('#workloadStickyStack');
const menu = document.querySelector('#actionMenu');
const modalBackdrop = document.querySelector('#modalBackdrop');
const modal = document.querySelector('#actionModal');
let modalTrigger = null;
const detailBackdrop = document.querySelector('#detailBackdrop');
const instanceModal = document.querySelector('#instanceModal');
const historyDrawer = document.querySelector('#historyDrawer');
const historyList = document.querySelector('#historyList');
const bulkBar = document.querySelector('#bulkBar');
const resourceTooltip = document.querySelector('#resourceTooltip');
const usageTooltipAssetPath = './assets/figma-usage-tooltip-38-31304';
const figmaIconPath = './assets/figma-icon-library-56-38920';
const operationIconPath = './assets/figma-operation-column-4-45229';
const workloadIconPath = './assets/figma-workload-global-tip-4-40581';
const drawerAssetPath = './assets/figma-workload-drawer-305-25329';
const containerTabAssetPath = './assets/figma-container-tabs-309-27829';
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
  'detail':'image_26.png',
  'hammer':'image_27.png',
  'terminal-nav':'image_61.png',
  'share':'image_36.png',
  'more':'image_51.png',
  'clipboard':`${drawerAssetPath}/image_59.png`,
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
const runtimePage = document.querySelector('#runtimePage');
const serviceExposurePage = document.querySelector('#serviceExposurePage');
const serviceDrawer = document.querySelector('#serviceDrawer');
const serviceDrawerBackdrop = document.querySelector('#serviceDrawerBackdrop');
const serviceCreateModal = document.querySelector('#serviceCreateModal');
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
const clusters = clusterDefinitions.map(cluster=>({
  id:cluster.id,
  name:cluster.id,
  tag:cluster.tag,
  available:cluster.podCount,
  expected:cluster.podCount
}));

function syncFilterSelect(selectId){
  window.CNAPSelect?.sync(selectId);
}

function closeFilterSelects(except=null){
  window.CNAPSelect?.closeAll(except);
}

function renderClusterFilterOptions(){
  const options=clusterDefinitions
    .map(cluster=>`<option value="${cluster.id}">${cluster.name}</option>`)
    .join('');
  document.querySelector('#titleClusterSelect').innerHTML=`<option value="all">全部集群</option>${options}`;
  document.querySelector('#trafficSelect').innerHTML='<option value="all">全部屏蔽类型</option><option value="running">接流中</option><option value="blocked">已屏蔽</option>';
  syncFilterSelect('trafficSelect');
}

function renderAppNavigation(){
  const isApplication = state.primaryNav === 'apps';
  const isWorkload = isApplication && state.appNav === 'workload';
  const isExposure = isApplication && state.appNav === 'exposure';
  const isRuntime = isApplication && state.appNav === 'runtime';
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
  runtimePage.classList.toggle('hidden', !isRuntime);
  serviceExposurePage.classList.toggle('hidden', !isExposure);
  appPagePlaceholder.classList.toggle('hidden', isWorkload || isRuntime || isExposure);
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
      (state.traffic === 'all' || status === state.traffic) &&
      (state.cluster === 'all' || cluster === state.cluster) &&
      (!state.query || name.toLowerCase().includes(state.query) || ip.includes(state.query));
  });
}

function resourceMetricMarkup(type,usage,capacity,request,percent){
  const normalized=Math.max(0,Math.min(100,percent));
  const tone=normalized>=80?'danger':normalized>=60?'warning':'normal';
  const iconName=type==='cpu'?'cpu':'memory';
  return `<span class="resource-metric usage-value" data-resource-tooltip data-resource-type="${type}" data-resource-usage="${usage}" data-resource-capacity="${capacity}" data-resource-request="${request}" data-resource-percent="${normalized}" tabindex="0" role="img" aria-label="${type==='cpu'?'CPU':'内存'}使用量 ${usage}，限制 ${capacity}，请求 ${request}"><span class="resource-spec"><span class="${type}-mark">${icon(iconName)}</span><span class="resource-spec-value">${usage}/${capacity}/${request}</span></span><span class="resource-usage ${tone}"><span class="resource-track"><i style="width:${normalized}%"></i></span><b>${normalized}%</b></span></span>`;
}

function showResourceTooltip(target){
  const type=target.dataset.resourceType;
  const labels={cpu:'CPU',memory:'内存',gpu:'GPU'};
  const label=labels[type] || '资源';
  const percent=Math.max(0,Math.min(100,Number(target.dataset.resourcePercent)||0));
  const tone=percent>=80?'danger':percent>=60?'warning':'normal';
  const sourceTrack=target.querySelector('.resource-track, .drawer-resource-metric i, div > span > i');
  const sourceFill=target.querySelector('.resource-track i, .drawer-resource-metric i b, div > span > i > b');
  const sourceRect=sourceTrack?.getBoundingClientRect();
  const fallbackColors={danger:'#e62c4b',warning:'#f58300',normal:'#306ddd',gpu:'#76b900'};
  const progressColor=sourceFill?getComputedStyle(sourceFill).backgroundColor:(type==='gpu'?fallbackColors.gpu:fallbackColors[tone]);
  const trackWidth=sourceRect?.width?Math.max(72,Math.min(120,Math.round(sourceRect.width))):120;
  const trackHeight=sourceRect?.height?Math.max(3,Math.min(4,Math.round(sourceRect.height))):3;
  resourceTooltip.style.setProperty('--resource-progress-color',progressColor);
  resourceTooltip.style.setProperty('--resource-progress-width',`${trackWidth}px`);
  resourceTooltip.style.setProperty('--resource-progress-height',`${trackHeight}px`);
  resourceTooltip.innerHTML=`<div class="resource-tooltip-title">${label}</div><div class="resource-tooltip-progress"><span class="resource-tooltip-track"><i style="width:${percent}%"></i></span><b>${percent}%</b></div><div class="resource-tooltip-details"><span class="limit"><i></i><em>Limit</em><strong>${target.dataset.resourceCapacity || '-'}</strong></span><span class="usage"><i></i><em>usage</em><strong>${target.dataset.resourceUsage || '-'}</strong></span><span class="request"><i></i><em>request</em><strong>${target.dataset.resourceRequest || '-'}</strong></span></div><img class="resource-tooltip-arrow" src="${usageTooltipAssetPath}/image_2.png" alt="">`;
  resourceTooltip.className=`resource-tooltip ${tone}`;
  resourceTooltip.setAttribute('aria-hidden','false');
  const rect=target.getBoundingClientRect();
  const width=181;
  const gap=8;
  const left=Math.max(8,Math.min(rect.left + rect.width/2 - width/2,window.innerWidth-width-8));
  resourceTooltip.style.left=`${left}px`;
  resourceTooltip.style.top='0px';
  const height=resourceTooltip.offsetHeight;
  const top=rect.top-height-gap;
  resourceTooltip.style.top=`${Math.max(8,top)}px`;
  if(top<8) resourceTooltip.classList.add('is-below');
}
function hideResourceTooltip(){
  resourceTooltip.classList.remove('is-below');
  resourceTooltip.setAttribute('aria-hidden','true');
}

document.addEventListener('mouseover',event=>{
  const target=event.target.closest('[data-resource-tooltip]');
  if(!target || target.contains(event.relatedTarget)) return;
  showResourceTooltip(target);
});
document.addEventListener('mouseout',event=>{
  const target=event.target.closest('[data-resource-tooltip]');
  if(target && !target.contains(event.relatedTarget)) hideResourceTooltip();
});
document.addEventListener('focusin',event=>{
  const target=event.target.closest('[data-resource-tooltip]');
  if(target) showResourceTooltip(target);
});
document.addEventListener('focusout',event=>{
  if(event.target.closest('[data-resource-tooltip]')) hideResourceTooltip();
});
window.addEventListener('scroll',hideResourceTooltip,true);
window.addEventListener('resize',hideResourceTooltip);

function gpuCardMarkup(gpu){
  const asset=gpu.variant==='p800'?'image_37.png':'image_36.png';
  return `<span class="gpu-card ${gpu.variant}" title="${gpu.model} ${gpu.memory} x${gpu.count}" data-resource-tooltip data-resource-type="gpu" data-resource-usage="${gpu.count} 卡" data-resource-capacity="${gpu.model} ${gpu.memory}" data-resource-request="-" data-resource-percent="100" tabindex="0" role="img" aria-label="GPU ${gpu.model} ${gpu.memory}，${gpu.count} 卡"><img src="./assets/figma-workload-page-59-19541/${asset}" alt=""><span class="gpu-details"><b>${gpu.model}</b><b>${gpu.memory}</b></span><strong>x${gpu.count}</strong></span>`;
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
  const label=type==='cpu'?'CPU':'内存';
  const capacity=type==='cpu'?'8c':'32Gi';
  return `<span class="compact-usage${danger}" data-resource-tooltip data-resource-type="${type}" data-resource-usage="${percent}%" data-resource-capacity="${capacity}" data-resource-request="-" data-resource-percent="${percent}" tabindex="0" role="img" aria-label="${label}使用量 ${percent}%"><img src="${compactTableAssetPath}/${asset}" alt=""><span>${percent}%</span></span>`;
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
    <header class="group-header"><button class="cluster-toggle" data-cluster-toggle="${cluster}" aria-label="${collapsed?'展开':'收起'}">${icon(collapsed?'chevron-right':'chevron-down')}</button><div class="group-title"><strong>${clusterName}</strong><span class="rollout ${cluster}">${meta.channel}</span><span class="versions">${meta.version}&nbsp; ${meta.versions}</span></div><div class="group-summary"><span>运行中 <b class="green">${summary.running}</b></span><span>异常 <b class="red">${summary.error}</b></span><span>已屏蔽 <b class="amber">${summary.blocked}</b></span><i></i><span>共 ${allPodsInCluster.length} pod</span><button class="cluster-more" data-cluster-more="${cluster}" aria-label="${clusterName} 更多操作">${icon('more')}</button></div></header>
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
    <header class="group-header"><button class="cluster-toggle" data-cluster-toggle="${cluster}" aria-label="${collapsed?'展开':'收起'}">${icon(collapsed?'chevron-right':'chevron-down')}</button><div class="group-title"><strong>${clusterName}</strong><span class="rollout ${cluster}">${meta.channel}</span><span class="versions">${meta.version}&nbsp; ${meta.versions}</span></div><div class="group-summary"><span>运行中 <b class="green">${summary.running}</b></span><span>异常 <b class="red">${summary.error}</b></span><span>已屏蔽 <b class="amber">${summary.blocked}</b></span><i></i><span>共 ${allPodsInCluster.length} pod</span><button class="cluster-more" data-cluster-more="${cluster}" aria-label="${clusterName} 更多操作">${icon('more')}</button></div></header>
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
let stickyShowFrame=0;
let stickyHideTimer=0;

function clearWorkloadStickyStack(){
  workloadStickyStack.classList.remove('is-visible');
  workloadStickyStack.classList.add('hidden');
  workloadStickyStack.replaceChildren();
  delete workloadStickyStack.dataset.signature;
  delete workloadStickyStack.dataset.cluster;
}

function hideWorkloadStickyStack({immediate=false}={}){
  if(stickyShowFrame){
    cancelAnimationFrame(stickyShowFrame);
    stickyShowFrame=0;
  }
  if(stickyHideTimer){
    clearTimeout(stickyHideTimer);
    stickyHideTimer=0;
  }

  if(workloadStickyStack.classList.contains('hidden'))return;
  if(immediate){
    clearWorkloadStickyStack();
    return;
  }

  workloadStickyStack.classList.remove('is-visible');
  stickyHideTimer=window.setTimeout(()=>{
    stickyHideTimer=0;
    if(!workloadStickyStack.classList.contains('is-visible')) clearWorkloadStickyStack();
  },150);
}

function showWorkloadStickyStack(){
  if(stickyHideTimer){
    clearTimeout(stickyHideTimer);
    stickyHideTimer=0;
  }
  const wasHidden=workloadStickyStack.classList.contains('hidden');
  workloadStickyStack.classList.remove('hidden');
  if(wasHidden){
    stickyShowFrame=requestAnimationFrame(()=>{
      stickyShowFrame=0;
      if(!workloadStickyStack.classList.contains('hidden')) workloadStickyStack.classList.add('is-visible');
    });
  }else if(!workloadStickyStack.classList.contains('is-visible')){
    workloadStickyStack.classList.add('is-visible');
  }
}

function setPixelStyle(element,property,value){
  const nextValue=`${value}px`;
  if(element.style[property]!==nextValue) element.style[property]=nextValue;
}

function setPixelVariable(element,property,value){
  const nextValue=`${value}px`;
  if(element.style.getPropertyValue(property)!==nextValue) element.style.setProperty(property,nextValue);
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
      const surface=document.createElement('div');
      surface.className='sticky-table-surface';
      const frame=document.createElement('div');
      frame.className='table-frame sticky-table-frame';
      const scroll=document.createElement('div');
      scroll.className='table-scroll sticky-table-scroll';
      const table=sourceTable.cloneNode(false);
      table.append(sourceHead.cloneNode(true));
      scroll.append(table);
      frame.append(scroll);
      surface.append(frame);
      content.append(surface);
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
  const workloadPanel=document.querySelector('.workload-list-panel');
  if(workloadPanel?.classList.contains('hidden')){
    hideWorkloadStickyStack();
    return;
  }

  const workspaceRect=workspace.getBoundingClientRect();
  const panelRect=workloadPanel.getBoundingClientRect();
  const stickyTop=workspaceRect.top+66;
  const groups=Array.from(clusterGroups.querySelectorAll('.cluster-group'));
  const metrics=groups.map(group=>({
    groupRect:group.getBoundingClientRect(),
    headerRect:group.querySelector('.group-header').getBoundingClientRect(),
    tableFrameRect:group.querySelector('.table-frame')?.getBoundingClientRect()
  }));
  let activeIndex=-1;
  metrics.forEach(({groupRect,headerRect},index)=>{
    if(headerRect.top<=stickyTop&&groupRect.bottom>stickyTop) activeIndex=index;
  });

  if(activeIndex<0){
    hideWorkloadStickyStack();
    return;
  }

  const group=groups[activeIndex];
  const collapsed=group.classList.contains('collapsed');
  const signature=`${group.dataset.cluster}:${state.viewMode}:${collapsed}:${state.selected.size}`;
  if(workloadStickyStack.dataset.signature!==signature) buildWorkloadStickyStack(group,signature);

  const groupRect=metrics[activeIndex].groupRect;
  const tableFrameRect=metrics[activeIndex].tableFrameRect??groupRect;
  const titleRect=document.querySelector('.title-row').getBoundingClientRect();
  const boundary=metrics[activeIndex+1]?.headerRect.top??groupRect.bottom;
  const contentHeight=collapsed?52:100;
  const stackHeight=collapsed?118:166;
  const innerOffset=Math.min(0,boundary-stickyTop-contentHeight);
  const sourceScroll=group.querySelector('.table-scroll');
  const stickyScroll=workloadStickyStack.querySelector('.sticky-table-scroll');

  setPixelStyle(workloadStickyStack,'top',workspaceRect.top);
  setPixelStyle(workloadStickyStack,'left',workspaceRect.left);
  setPixelStyle(workloadStickyStack,'width',workspaceRect.width);
  setPixelStyle(workloadStickyStack,'height',stackHeight);
  setPixelVariable(workloadStickyStack,'--sticky-title-left',titleRect.left-workspaceRect.left);
  setPixelVariable(workloadStickyStack,'--sticky-title-right',workspaceRect.right-titleRect.right);
  setPixelVariable(workloadStickyStack,'--sticky-header-left',groupRect.left-workspaceRect.left);
  setPixelVariable(workloadStickyStack,'--sticky-header-right',workspaceRect.right-groupRect.right);
  setPixelVariable(workloadStickyStack,'--sticky-surface-left',panelRect.left-workspaceRect.left);
  setPixelVariable(workloadStickyStack,'--sticky-surface-right',workspaceRect.right-panelRect.right);
  setPixelVariable(workloadStickyStack,'--sticky-table-inset-left',tableFrameRect.left-panelRect.left);
  setPixelVariable(workloadStickyStack,'--sticky-table-inset-right',panelRect.right-tableFrameRect.right);
  const stickyContent=workloadStickyStack.querySelector('.sticky-workload-content');
  const nextTransform=`translateY(${innerOffset}px)`;
  if(stickyContent.style.transform!==nextTransform) stickyContent.style.transform=nextTransform;
  if(sourceScroll&&stickyScroll&&stickyScroll.scrollLeft!==sourceScroll.scrollLeft) stickyScroll.scrollLeft=sourceScroll.scrollLeft;
  showWorkloadStickyStack();
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
  delete workloadStickyStack.dataset.signature;
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

let toastTimer;
function toast(message,type='default'){
  const region=document.querySelector('#toastRegion');
  if(!region)return;
  const normalized=type==='error'?'error':type==='warning'||type==='warn'?'warning':'success';
  const iconName=normalized==='error'?'toast-error':normalized==='warning'?'runtime-attention':'toast-success';
  region.innerHTML=`<div class="toast toast-${normalized}" role="status"><svg aria-hidden="true"><use href="#i-${iconName}"/></svg><span>${message}</span></div>`;
  const el=region.firstElementChild;
  window.clearTimeout(toastTimer);
  requestAnimationFrame(()=>el.classList.add('show'));
  toastTimer=window.setTimeout(()=>{el.classList.remove('show');window.setTimeout(()=>{if(region.firstElementChild===el)region.innerHTML='';},220);},2400);
}
function actionTarget(ids){ return ids?.length ? `${ids.length} 个 Pod` : 'Payment-api'; }
function setActionControls(disabled){ document.querySelectorAll('.title-actions button,[data-action],[data-bulk-action]').forEach(button=>button.disabled=disabled); }
function closeModal(){ if(!state.executing){ modalBackdrop.classList.add('hidden'); modal.innerHTML=''; pendingAction=null; modalTrigger?.focus({preventScroll:true}); modalTrigger=null; } }

function runtimeSaveChangeCard({title,changes,impact=false}){
  return `<section class="runtime-save-change-card ${impact?'has-impact':''}">
    <header><strong>${title}</strong>${impact?'<span class="runtime-save-impact"><svg aria-hidden="true"><use href="#i-runtime-attention"/></svg>顶层修改将同步影响下级配置</span>':''}</header>
    <div class="runtime-save-change-list">${changes.map(change=>`<div class="runtime-save-change-row"><span class="runtime-save-change-rail"><b class="${change.type}">${change.type==='updated'?'更新':'修改'}</b></span><div><strong>${change.label}</strong><p>${change.value}</p></div></div>`).join('')}</div>
  </section>`;
}

function openRuntimeSaveConfirm(){
  modalTrigger=document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const cards=[
    runtimeSaveChangeCard({
      title:'应用级 / payment-service / Pod 配置',
      impact:true,
      changes:[
        {label:'实例数量',value:'3  →  2',type:'modified'},
        {label:'部署并发度',value:'最大不可用实例 10%  →  20%    |    最大可超出实例 21%  →  20%',type:'modified'},
        {label:'Pod 标签',value:'标签1，标签2，标签3',type:'updated'},
        {label:'外网访问状态',value:'开启  →  关闭',type:'modified'},
        {label:'凭证管理',value:'设置为继承自「应用」',type:'modified'}
      ]
    }),
    runtimeSaveChangeCard({
      title:'环境级 / prod / payment-service / 容器 / web1',
      changes:[
        {label:'部署路径',value:'/home/work/app',type:'modified'},
        {label:'Pod 标签',value:'标签1，标签2，标签3',type:'updated'}
      ]
    }),
    runtimeSaveChangeCard({
      title:'集群级 / nb-bddwd / payment-service / 容器 / web2',
      changes:[
        {label:'部署路径',value:'/home/work/app',type:'modified'},
        {label:'Pod 标签',value:'标签1，标签2，标签3',type:'updated'}
      ]
    })
  ];
  modal.className='action-modal runtime-save-modal';
  modal.innerHTML=`<header class="runtime-save-modal-header"><h2 id="modalTitle">保存配置</h2><button type="button" data-modal-close aria-label="关闭">${icon('close')}</button></header><div class="runtime-save-modal-body"><p>以下是本次修改的所有变更项，确定保存配置吗？</p><div class="runtime-save-change-stack">${cards.join('')}</div></div><footer class="runtime-save-modal-footer"><button type="button" class="runtime-save-discard" data-runtime-save-discard>放弃修改并切换</button><button type="button" class="runtime-save-confirm" data-runtime-save-confirm>保存配置项并切换</button></footer>`;
  modalBackdrop.classList.remove('hidden');
  modal.querySelector('[data-modal-close]')?.focus({preventScroll:true});
}

function completeRuntimeSave(shouldSave){
  if(shouldSave){
    const stateLabel=document.querySelector('#runtimeSaveState');
    if(stateLabel) stateLabel.textContent='已保存 · 刚刚';
  } else {
    document.querySelectorAll('#runtimePage input[type="number"]').forEach(input=>{if(input.defaultValue)input.value=input.defaultValue;});
    const stateLabel=document.querySelector('#runtimeSaveState');
    if(stateLabel) stateLabel.textContent='正在编辑配置';
  }
  closeModal();
  toast(shouldSave?'运行配置已保存':'已放弃本次修改并切换');
}

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
  const resourceCell=(row,type)=>`<div class="vertical-resource-cell" data-resource-cluster="${row.id}" data-resource-type="${type}"><label><input type="checkbox" checked disabled aria-label="${row.name} ${type} 请求（必填）">Req<input data-resource-request="value" value="4" aria-label="${row.name} ${type} 请求值"><select data-resource-request="unit" aria-label="${row.name} ${type} 请求单位"><option>${type==='CPU'?'c':'Gi'}</option></select></label><label><input type="checkbox" data-resource-limit-toggle aria-label="${row.name} ${type} 限制（可选）">Lim<input data-resource-limit="value" value="4" disabled aria-label="${row.name} ${type} 限制值"><select data-resource-limit="unit" disabled aria-label="${row.name} ${type} 限制单位"><option>${type==='CPU'?'c':'Gi'}</option></select></label></div>`;
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
  modalTrigger=document.activeElement instanceof HTMLElement ? document.activeElement : null;
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
  if(actionKey==='vertical') modal.querySelectorAll('.vertical-resource-cell').forEach(syncResourceLimit);
  modalBackdrop.classList.remove('hidden');
  const focusTarget=modal.querySelector('[data-modal-close], [data-modal-confirm], input, select, button');
  focusTarget?.focus({preventScroll:true});
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
  const [id,name,status,ip,,exposure,restarts,age,,,cluster,gpu]=pod;
  const paused=state.pausedPods.has(id);
  const containerProfiles=[
    {name:'ranking-inference',type:'主容器',tone:'',status:'运行中',ready:'是',restarts:'0',age:'8d',image:'registry.internal/payments/api-gateway:v2.2.5',pull:'IfNotPresent',command:'/app/server --config=/etc/app/config/server.yaml --port=8500',cpu:['7.2c','8c','16c',99],memory:['29.44Gi','32Gi','9.1Gi',99],ports:[['静态','main','8092'],['静态','prometheus','8990'],['静态','xxl-job','8209']],mounts:[['config','/etc/app/config','ConfigMap: app-config','只读'],['secrets','/etc/app/config','ConfigMap: app-config','只读'],['data','/etc/app/config','ConfigMap: app-config','读写']],env:[['POD_NAME','(metadata.name)','Field'],['POD_NAMESPACE','(metadata.namespace)','Field'],['NODE_NAME','-Xms2g -Xmx4g -XX:+UseG1GC','-']],termination:['Completed','0','2026.06.04 04:20:06','2026.06.04 04:20:06']},
    {name:'ranking-inference',type:'Sidecar',tone:'sidecar',status:'运行中',ready:'是',restarts:'1',age:'8d',image:'registry.internal/observability/log-agent:v1.12.0',pull:'IfNotPresent',command:'/agent/log-collector --config=/etc/agent/config.yaml',cpu:['0.6c','1c','0.5c',60],memory:['1.82Gi','4Gi','2Gi',46],ports:[['静态','metrics','9090'],['静态','health','9091']],mounts:[['logs','/var/log/app','EmptyDir: app-logs','只读'],['config','/etc/agent','ConfigMap: log-agent','只读']],env:[['POD_NAME','(metadata.name)','Field'],['LOG_LEVEL','info','Config'],['SCRAPE_INTERVAL','30s','Config']],termination:['Completed','0','2026.06.03 18:11:32','2026.06.03 18:11:33']},
    {name:'ranking-inference',type:'普通',tone:'regular',status:'运行中',ready:'是',restarts:'0',age:'7d',image:'registry.internal/payments/model-server:v4.7.1',pull:'Always',command:'/model/server --model=/models/ranking --grpc-port=8500',cpu:['3.8c','6c','4c',63],memory:['18.6Gi','24Gi','16Gi',78],ports:[['静态','grpc','8500'],['静态','admin','8501']],mounts:[['models','/models','PVC: ranking-models','只读'],['cache','/cache','EmptyDir: model-cache','读写']],env:[['MODEL_NAME','ranking-v47','Config'],['GRPC_PORT','8500','Config'],['CUDA_VISIBLE_DEVICES','0','Config']],termination:['Completed','0','2026.06.02 09:36:18','2026.06.02 09:36:19']},
    {name:'ranking-inference',type:'Init',tone:'init',status:'已完成',ready:'是',restarts:'0',age:'8d',image:'registry.internal/base/model-loader:v2.3.0',pull:'IfNotPresent',command:'/bin/model-loader --source=bos://models/ranking-v47',cpu:['0.2c','1c','0.2c',20],memory:['0.74Gi','2Gi','1Gi',37],ports:[],mounts:[['models','/models','PVC: ranking-models','读写'],['credentials','/etc/bos','Secret: bos-access','只读']],env:[['MODEL_VERSION','ranking-v47','Config'],['TARGET_PATH','/models','Config'],['VERIFY_CHECKSUM','true','Config']],termination:['Completed','0','2026.06.04 04:19:42','2026.06.04 04:20:01']}
  ];
  const profile=containerProfiles[state.selectedContainer] || containerProfiles[0];
  const tabs=[['detail','详细信息'],['logs','日志'],['terminal','终端'],['events','事件']];
  const tabBar=tabs.map(([key,label])=>`<button class="${key===tab?'active':''}" data-detail-tab="${key}">${label}</button>`).join('');
  const summaryArrow=state.instanceSummaryCollapsed
    ? `${figmaIconPath}/image_6.png`
    : `${drawerAssetPath}/image_61.png`;
  const summary=`<div class="instance-summary-shell ${state.instanceSummaryCollapsed?'is-collapsed':''}"><section class="instance-summary"><div class="summary-grid"><div><span>Pod IP</span><strong class="drawer-mono">${ip}</strong></div><div><span>节点 IP</span><strong class="drawer-mono">192.168.10.18</strong></div><div><span>版本</span><strong class="drawer-mono">v2.3.1</strong></div><div><span>重启次数</span><strong class="danger-text">${restarts}</strong></div><div><span>存活时间</span><strong>${age}</strong></div><div><span>暴露</span><strong>${exposure}</strong></div></div></section><button class="summary-toggle" data-summary-toggle="${id}" aria-expanded="${!state.instanceSummaryCollapsed}"><img src="${summaryArrow}" alt=""><span>${state.instanceSummaryCollapsed?'展开':'收起'}</span></button></div>`;
  const details=`<div class="pod-detail-page container-detail-view">
    <section class="drawer-detail-section drawer-basic-section">
      <h3>基本信息</h3>
      <div class="drawer-status-grid"><span>状态 <b class="drawer-status-tag">${profile.status}</b></span><span>就绪 <b>${profile.ready}</b></span><span>重启次数 <b class="danger-text">${profile.restarts}</b></span><span>存活时间 <b>${profile.age}</b></span></div>
      <dl class="drawer-description-list"><div><dt>Pod IP</dt><dd>${profile.image}<em>${profile.pull}</em></dd></div><div><dt>启动命令</dt><dd>${profile.command}</dd></div></dl>
      <div class="drawer-resource-row"><span class="drawer-field-label">资源用量</span><div class="drawer-resource-metric" data-resource-tooltip data-resource-type="cpu" data-resource-usage="${profile.cpu[0]}" data-resource-capacity="${profile.cpu[1]}" data-resource-request="${profile.cpu[2]}" data-resource-percent="${profile.cpu[3]}" tabindex="0" role="img" aria-label="CPU使用量 ${profile.cpu[0]}"><span class="cpu-mark">${icon('cpu')}</span><div><strong>${profile.cpu.slice(0,3).join('/')}</strong><span><i><b style="width:${profile.cpu[3]}%"></b></i><em>${profile.cpu[3]}%</em></span><small>CPU</small></div></div><div class="drawer-resource-divider"></div><div class="drawer-resource-metric" data-resource-tooltip data-resource-type="memory" data-resource-usage="${profile.memory[0]}" data-resource-capacity="${profile.memory[1]}" data-resource-request="${profile.memory[2]}" data-resource-percent="${profile.memory[3]}" tabindex="0" role="img" aria-label="内存使用量 ${profile.memory[0]}"><span class="memory-mark">${icon('memory')}</span><div><strong>${profile.memory.slice(0,3).join('/')}</strong><span><i><b style="width:${profile.memory[3]}%"></b></i><em>${profile.memory[3]}%</em></span><small>内存</small></div></div><div class="drawer-resource-divider"></div><div class="drawer-gpu-summary">${gpuCardMarkup(gpu)}<small>GPU</small></div></div>
    </section>
    <section class="drawer-detail-section"><div class="drawer-section-heading"><h3>端口 ${profile.ports.length}</h3><button type="button" data-copy-all-ports="${id}">${icon('clipboard')}<span>复制全部IP:PORT</span></button></div><div class="drawer-data-table port-detail-table"><div class="table-head"><span>端口类型</span><span>端口名称</span><span>端口号</span><span>操作</span></div>${profile.ports.length?profile.ports.map(item=>`<div><span>${item[0]}</span><span>${item[1]}</span><span>${item[2]}</span><button type="button" data-copy-port="${item[2]}" title="复制端口">${icon('clipboard')}</button></div>`).join(''):'<p class="drawer-empty-row">暂无端口</p>'}</div></section>
    <section class="drawer-detail-section"><h3>挂载 ${profile.mounts.length}</h3><div class="drawer-data-table mount-detail-table"><div class="table-head"><span>挂载类型</span><span>挂载路径</span><span>来源</span><span>操作</span></div>${profile.mounts.map(item=>`<div>${item.map(value=>`<span>${value}</span>`).join('')}</div>`).join('')}</div></section>
    <section class="drawer-detail-section"><h3>环境变量 ${profile.env.length}</h3><div class="drawer-data-table env-detail-table"><div class="table-head"><span>名称</span><span>值</span><span>来源</span></div>${profile.env.map(item=>`<div>${item.map(value=>`<span>${value}</span>`).join('')}</div>`).join('')}</div></section>
    <section class="drawer-detail-section drawer-termination"><h3>上一次终止</h3><dl><div><dt>原因</dt><dd>${profile.termination[0]}</dd></div><div><dt>退出码</dt><dd>${profile.termination[1]}</dd></div><div><dt>开始时间</dt><dd>${profile.termination[2]}</dd></div><div><dt>结束时间</dt><dd>${profile.termination[3]}</dd></div></dl></section>
  </div>`;
  const logs=`<div class="tool-pane"><div class="tool-toolbar"><span>当前运行</span><button data-log-mode="latest">最新日志</button><label>${icon('search')}<input placeholder="搜索日志"></label><button data-log-fullscreen="${id}" title="全屏">${icon('share')}</button></div><div class="terminal-screen log-screen">${logLines(name)}</div></div>`;
  const terminal=`<div class="tool-pane"><div class="tool-toolbar"><select><option>ranking-inference</option></select><span>/bin/bash</span><button>${icon('refresh')}重新连接</button></div><div class="terminal-screen"><p><b>root@${name.slice(-8)}:</b>/app# ps aux</p><p>PID USER COMMAND</p><p>1 root /app/server --config=/etc/app/config/server.yaml</p><p>27 root /bin/bash</p><p><b>root@${name.slice(-8)}:</b>/app# <span class="cursor"></span></p></div></div>`;
  const events=`<div class="event-pane"><div class="event-toolbar"><select><option>全部类型</option><option>Normal</option><option>Warning</option></select><button>${icon('refresh')}刷新</button></div><div class="event-table"><div class="table-head"><span>类型</span><span>原因</span><span>信息</span><span>时间</span></div><div><span class="success-text">Normal</span><span>Started</span><span>Started container ranking-inference</span><span>2 分钟前</span></div><div><span class="success-text">Normal</span><span>Pulled</span><span>Container image already present on machine</span><span>2 分钟前</span></div><div><span class="warning-text">Warning</span><span>Unhealthy</span><span>Readiness probe failed, retry succeeded</span><span>1 小时前</span></div></div></div>`;
  const containerDotAssets=['image_1.png','image_2.png','image_3.png'];
  const containers=`<nav class="container-strip" aria-label="容器选择">${containerProfiles.map((item,index)=>`<button class="${state.selectedContainer===index?'active':''}" data-container-select="${index}" ${state.selectedContainer===index?'aria-current="true"':''}>${index<3?`<img class="container-dot" src="${containerTabAssetPath}/${containerDotAssets[index]}" alt="">`:'<span class="container-dot init"></span>'}<strong>${item.name}</strong><small>${item.type}</small></button>`).join('')}<span class="container-strip-spacer" aria-hidden="true"></span></nav>`;
  const headerActions=`<div class="instance-header-actions"><button data-drawer-tab="detail" title="详细信息">${icon('detail')}</button><button data-drawer-tab="terminal" title="终端">${icon('terminal-nav')}</button><button data-detail-action="rebuild" title="删除/重建">${icon('hammer')}</button><button data-detail-action="block" title="屏蔽">${icon('block')}</button><button data-drawer-more="${id}" title="更多操作">${icon('more')}</button><i aria-hidden="true"></i><button data-open-new="${id}" title="独立展示">${icon('share')}</button><button class="close-detail" aria-label="关闭" title="关闭">${icon('close')}</button></div>`;
  return `<div class="instance-heading"><header class="instance-header"><div class="instance-title-wrap"><div class="instance-title"><h2 id="instanceTitle" title="${name}">${name}</h2><span class="status-tag ${paused?'blocked':status}">${paused?'已暂停':labels[status]}</span></div></div>${headerActions}</header><div class="instance-context"><span><small>应用</small><b>Payment-api</b></span><i></i><span><small>集群</small><b>${cluster}</b></span><i></i><span><small>工作负载</small><b>ranking-inference</b></span></div></div>${summary}<section class="instance-workbench">${containers}<nav class="detail-tabs">${tabBar}</nav><div class="detail-body" data-instance-id="${id}">${tab==='detail'?details:tab==='logs'?logs:tab==='terminal'?terminal:events}</div></section>`;
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
const runtimeContextProfiles={
  application:{label:'应用',values:[6,20,30,2],switches:[true,true,true],breadcrumb:'payment-service'},
  environment:{label:'环境',values:[4,10,20,2],switches:[true,false,true],breadcrumb:'dev / payment-service'},
  cluster:{label:'集群',values:[3,3,3,1],switches:[true,true,false],breadcrumb:'web1 / payment-service'}
};
const runtimeContextSelection={
  application:'application-base',
  environment:'development',
  cluster:'cluster-a'
};
const runtimeContextValueLabels={
  'application-base':'application-base',
  development:'development',
  staging:'staging',
  'cluster-a':'cluster-a',
  'cluster-b':'cluster-b'
};
let activeRuntimeTarget='pod-config';
function updateRuntimeEditorHeader(target=activeRuntimeTarget,targetLabel='web1'){
  const editor=document.querySelector('#runtimeEditor');
  if(!editor)return;
  activeRuntimeTarget=target;
  const displayTargetLabel=String(targetLabel).replace(/^web(\d+)$/i,'Web$1');
  const breadcrumb=editor.querySelector('.runtime-editor-breadcrumb');
  const title=editor.querySelector('.runtime-editor-title');
  const sectionTitle=document.querySelector('#runtimeEditorSectionTitle');
  const containerSection=document.querySelector('#runtime-container');
  const isContainer=target==='container-config';
  if(breadcrumb){
    breadcrumb.innerHTML=isContainer
      ? '<span>工作负载</span><span>/</span><span>容器</span><span>/</span><strong></strong>'
      : '<span>payment-service</span><span>/</span><strong>Pod配置</strong>';
    if(isContainer)breadcrumb.querySelector('strong').textContent=displayTargetLabel;
  }
  if(title)title.classList.toggle('is-container-context',isContainer);
  if(sectionTitle)sectionTitle.textContent=isContainer?displayTargetLabel:'容器配置';
  containerSection?.classList.toggle('is-container-context',isContainer);
}
updateRuntimeEditorHeader();
const runtimeHelpModeToggle=document.querySelector('#runtimeHelpMode');
const runtimeHelpDescriptions={
  '单节点副本数':'控制单个节点上最多部署此工作负载的 Pod 数量。启用后可限制 Pod 分散部署，避免单节点过载。',
  '节点架构选择':'选择支持此工作负载的处理器架构。可选择 amd64（x86_64）和 arm64（aarch64），Pod 将优先调度到支持的架构节点上。',
  '节点标签选择':'选择具有特定标签的节点来部署此工作负载。Pod 将只调度到同时满足所有标签条件的节点上。',
  '网络':'',
  '主机网络':'宿主机网络模式使 Pod 直接使用宿主机的网络命名空间，可直接访问宿主机端口。仅在需要高性能网络或特殊监听场景使用。',
  '外网访问':'控制 Pod 中的容器是否可以访问集群外的网络资源。启用后，容器可以向外部服务发起网络请求；禁用后，容器仅能与集群内部通信。通常与网络策略（NetworkPolicy）配合使用，实现细粒度的网络访问控制。',
  '修改主机名解析 (/etc/hosts)':'为 Pod 添加额外的主机名解析条目，相当于在容器上配置 /etc/hosts 文件。在 hostAliases 中指定主机名和 IP 映射关系，Pod 内的进程可直接通过主机名访问指定的 IP 地址，无需依赖 DNS 服务。',
  '凭证管理':'为 Pod 添加额外的主机名解析条目，相当于在容器上配置 /etc/hosts 文件。在 hostAliases 中指定主机名和 IP 映射关系，Pod 内的进程可直接通过主机名访问指定的 IP 地址，无需依赖 DNS 服务。',
  '用户身份':'配置容器运行时使用的用户和组身份信息。',
  '文件系统':'附加到 Pod 上的键值对元数据，用于筛选、分组与服务发现。',
  'pod标签':'附加到 Pod 上的键值对元数据，用于筛选、分组与服务发现。',
  'Pod注解':'附加到 Pod 上的键值对元数据，用于存储非标识信息。',
  '工作负载注解':'附加到工作负载上的键值对元数据，用于存储非标识信息。会加在workload上而不是每个pod上。',
  '镜像来源':'选择镜像的来源方式：代码库构建（从源代码编译）、基础镜像库（基于预置镜像）、或固定镜像（使用指定的已有镜像）。',
  '基础镜像':'选择镜像构建的基础。百度基础镜像包含优化的发行版和技术栈镜像；社区标准镜像为官方发布的镜像。',
  '预装组件':'在镜像构建时预先安装指定的系统包（如 curl、git 等），减少容器启动后的初始化时间。',
  '自定义 Dockerfile 命令':'自定义的 Dockerfile 指令，如 RUN apt-get install -y package、COPY files 等。每行一条指令，在基础镜像基础上执行。',
  '代码库':'构建镜像所用的源代码仓库（Git URL），支持多个代码库并行构建。每个代码库可关联不同的 BCloud 构建配置以适应不同的编译环境。',
  'CPU':'配置容器所需的 CPU 资源量。',
  '内存':'配置容器所需的内存资源量。',
  '临时存储':'配置容器运行期间使用的临时存储空间。',
  'GPU（可选）':'为容器分配 GPU 资源，适用于需要 GPU 加速的工作负载。',
  '启动命令':'容器启动时执行的主程序（Dockerfile 的 ENTRYPOINT），如 /app/bootstrap 或 java -jar app.jar。不设置则使用镜像的默认启动命令。',
  '默认参数':'传递给启动命令的默认参数（Dockerfile 的 CMD），如 --config=/etc/app.conf。Pod 启动时可通过 args 覆盖。',
  '环境变量':'注入到容器中的环境变量（env）。支持直接入值、引用 Pod 字段、容器字段、Secret 或 ConfigMap。',
  '流量检测':'删除pod时，向1号进程发送退出信号前，检查该pod的BNS/VIP等是否已经摘除，可配置检查完毕后等待多久发出信号，默认180s。接收到删除命令30min后kill -9强制杀掉1号进程。',
  '优雅关闭等待时间':'占位占位占位占位占位占位占位占位占位占位占位占位',
  '配置文件挂载':'将代码库中的配置文件挂载到容器中指定路径。支持多个配置文件同时挂载。容器中挂载路径为绝对路径，代码库和路径为源配置文件位置。',
  '存储卷挂载':'为容器配置存储卷挂载。存储卷定义了 Pod 中容器可使用的存储资源，支持多种卷类型：空目录、宿主机目录、配置映射、Secret、本地盘临时卷、日志卷、持久卷和 RapidFS 持久卷',
  '命名端口':'配置容器暴露的端口，支持静态端口、动态端口分配、以及预定义的端口段。每个端口可指定协议类型（TCP/UDP）。',
  '匿名端口段':'在不同端口段上申请一部分端口供容器自行使用，通过 LRS_RESOURCE_PORT_RANGES 环境变量传递给容器。如果在端口段上配置了命名端口，命名端口与匿名端口段共享端口段，且偏移量不得大于匿名端口个数。',
  '探针':'配置容器的健康检查探针。启动探针用于检查容器是否已完成启动；存活探针用于检查容器是否仍在运行；就绪探针用于检查容器是否准备好接收流量。'
};
function addRuntimeHelpDescriptions(){
  const healthLabel=document.querySelector('#runtime-container-health strong');
  if(healthLabel?.textContent.trim()==='匿名端口段')healthLabel.textContent='探针';
  document.querySelectorAll('#runtimePage .runtime-setting-row strong').forEach(label=>{
    const key=label.textContent.trim();
    const text=runtimeHelpDescriptions[key];
    if(!text||label.parentElement?.querySelector(':scope > p'))return;
    const description=document.createElement('p');
    description.textContent=text;
    label.insertAdjacentElement('afterend',description);
  });
  document.querySelectorAll('#runtimePage .runtime-subsection-title h4').forEach(label=>{
    const title=label.parentElement;
    if(!title.querySelector(':scope > .runtime-setting-icon')){
      const icon=document.createElement('span');
      icon.className='runtime-setting-icon';
      icon.innerHTML='<svg><use href="#i-runtime-open-one"/></svg>';
      title.prepend(icon);
    }
    if(title.querySelector(':scope > p'))return;
    const description=document.createElement('p');
    description.textContent='基于节点标签的高级调度规则。相比节点标签选择支持更丰富的匹配操作符 (In, NotIn, Exists, Gt, Lt 等)，并区分硬性要求与软性偏好。';
    title.append(description);
  });
}
addRuntimeHelpDescriptions();
function setRuntimeHelpMode(enabled){
  document.querySelector('#runtimePage')?.classList.toggle('is-help-mode',enabled);
}
setRuntimeHelpMode(Boolean(runtimeHelpModeToggle?.checked));
runtimeHelpModeToggle?.addEventListener('change',()=>setRuntimeHelpMode(runtimeHelpModeToggle.checked));
let activeRuntimeContext='cluster';
let runtimeContextRefreshTimer=0;
function applyRuntimeContext(context,value=runtimeContextSelection[context],{announce=true}={}){
  const profile=runtimeContextProfiles[context];
  const page=document.querySelector('#runtimePage');
  const editor=document.querySelector('#runtimeEditor');
  if(!profile||!page||!editor)return;
  activeRuntimeContext=context;
  runtimeContextSelection[context]=value;
  refreshRuntimeFieldTooltips();
  window.clearTimeout(runtimeContextRefreshTimer);
  document.querySelectorAll('.runtime-context-chip[data-runtime-context]').forEach(chip=>{
    const selected=chip.dataset.runtimeContext===context;
    chip.classList.toggle('is-current',selected);
    chip.setAttribute('aria-selected',String(selected));
    const label=chip.querySelector('span');
    if(label) label.textContent=`${runtimeContextProfiles[chip.dataset.runtimeContext].label}：${runtimeContextValueLabels[runtimeContextSelection[chip.dataset.runtimeContext]]}`;
  });
  document.querySelectorAll('#runtimeLevelDropdown [data-runtime-level]').forEach(row=>{
    const selected=row.dataset.runtimeContext===context&&row.dataset.runtimeLevel===value;
    row.classList.toggle('is-selected',selected);
  });
  page.dataset.currentContext=context;
  page.classList.add('is-context-refreshing');
  const help=document.querySelector('.runtime-context-help');
  if(help)help.lastChild.textContent=`正在修改${profile.label}配置`;
  updateRuntimeEditorHeader(activeRuntimeTarget);
  runtimeContextRefreshTimer=window.setTimeout(()=>{
    document.querySelectorAll('#runtimePage input[type="number"]').forEach((input,index)=>{
      if(index<profile.values.length)input.value=profile.values[index];
    });
    document.querySelectorAll('#runtimePage .runtime-setting-row .runtime-switch').forEach((button,index)=>{
      const enabled=profile.switches[index]??button.classList.contains('is-on');
      button.classList.toggle('is-on',enabled);
      button.setAttribute('aria-pressed',String(enabled));
    });
    editor.scrollTo({top:0,behavior:'auto'});
    syncRuntimeInheritedControls();
    page.classList.remove('is-context-refreshing');
    if(announce)toast(`已切换到${profile.label}：${runtimeContextValueLabels[value]} 配置`);
  },180);
}
let runtimeDeleteTarget=null;
function updateRuntimeDeleteVisibility(){
  ['container','resource'].forEach(type=>{
    const selector=type==='container'?'.runtime-container-items .runtime-tree-leaf':'.runtime-resource-tree .runtime-tree-resource-item';
    const rows=[...document.querySelectorAll(selector)];
    rows.forEach(row=>row.querySelector('.runtime-tree-delete')?.classList.toggle('is-hidden',rows.length<=1));
  });
}
function openRuntimeDeleteConfirm(button){
  const row=button.closest('.runtime-tree-leaf, .runtime-tree-resource-item');
  if(!row)return;
  const type=button.dataset.runtimeDeleteType;
  const label=type==='container'?'容器':'资源';
  const name=row.querySelector(':scope > span')?.textContent.trim()||'';
  runtimeDeleteTarget=row;
  modalTrigger=button;
  modal.className='action-modal runtime-delete-modal';
  modal.innerHTML=`<header class="runtime-delete-modal-header"><div class="runtime-delete-modal-title"><span class="runtime-delete-warning"><svg><use href="#i-runtime-attention"/></svg></span><h2 id="modalTitle">删除${label}</h2></div><button type="button" data-modal-close aria-label="关闭">${icon('close')}</button></header><div class="runtime-delete-modal-body">删除${label}后，其内容将被清空且无法找回，确定删除吗？</div><footer class="runtime-delete-modal-footer"><button type="button" class="runtime-delete-cancel" data-modal-close>取消</button><button type="button" class="runtime-delete-confirm" data-runtime-delete-confirm>确定</button></footer>`;
  modalBackdrop.classList.remove('hidden');
  modal.querySelector('[data-modal-close]')?.focus({preventScroll:true});
  modal.dataset.runtimeDeleteName=name;
}
function confirmRuntimeDelete(){
  if(!runtimeDeleteTarget)return;
  const type=runtimeDeleteTarget.querySelector('.runtime-tree-delete')?.dataset.runtimeDeleteType;
  const label=type==='container'?'容器':'资源';
  const name=runtimeDeleteTarget.querySelector(':scope > span')?.textContent.trim()||'';
  runtimeDeleteTarget.remove();
  runtimeDeleteTarget=null;
  updateRuntimeDeleteVisibility();
  closeModal();
  toast(`已删除${label}：${name}`);
}
updateRuntimeDeleteVisibility();
document.querySelectorAll('.runtime-context-chip[data-runtime-context]').forEach(button=>button.addEventListener('click',()=>{
  applyRuntimeContext(button.dataset.runtimeContext);
}));
document.querySelector('.runtime-context-tabs')?.addEventListener('keydown',event=>{
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  const tabs=[...document.querySelectorAll('.runtime-context-chip[data-runtime-context]')];
  const currentIndex=tabs.indexOf(document.activeElement);
  if(currentIndex<0)return;
  event.preventDefault();
  const nextIndex=event.key==='Home'?0:event.key==='End'?tabs.length-1:(currentIndex+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
  tabs[nextIndex].focus();
  applyRuntimeContext(tabs[nextIndex].dataset.runtimeContext);
});
document.querySelectorAll('[data-runtime-target]').forEach(item=>item.addEventListener('click',()=>{
  document.querySelectorAll('[data-runtime-target]').forEach(node=>node.classList.toggle('is-active',node===item));
  updateRuntimeEditorHeader(item.dataset.runtimeTarget,item.querySelector(':scope > span')?.textContent.trim()||'web1');
  document.querySelector('#runtimeEditor')?.scrollTo({top:0,behavior:'smooth'});
}));
document.querySelectorAll('[data-runtime-delete-type]').forEach(button=>button.addEventListener('click',event=>{
  event.stopPropagation();
  openRuntimeDeleteConfirm(button);
}));
const runtimeLevelSwitch=document.querySelector('#runtimeLevelSwitch');
const runtimeLevelDropdown=document.querySelector('#runtimeLevelDropdown');
const runtimeClusterAddMenu=document.querySelector('#runtimeClusterAddMenu');
let runtimeClusterAddTarget=null;
function refreshRuntimeClusterAddMenu(){
  if(!runtimeClusterAddMenu)return;
  const options=runtimeClusterAddMenu.querySelectorAll('[data-runtime-cluster-option]');
  const empty=runtimeClusterAddMenu.querySelector('.runtime-cluster-add-empty');
  if(options.length===0&&!empty){
    const emptyMessage=document.createElement('div');
    emptyMessage.className='runtime-cluster-add-empty';
    emptyMessage.textContent='暂无集群可添加';
    runtimeClusterAddMenu.append(emptyMessage);
  } else if(options.length>0&&empty){
    empty.remove();
  }
}
function closeRuntimeLevelDropdown(){
  if(!runtimeLevelDropdown||!runtimeLevelSwitch)return;
  runtimeLevelDropdown.classList.add('hidden');
  runtimeLevelSwitch.setAttribute('aria-expanded','false');
}
runtimeLevelSwitch?.addEventListener('click',event=>{
  event.stopPropagation();
  const isOpen=!runtimeLevelDropdown.classList.contains('hidden');
  if(isOpen) closeRuntimeLevelDropdown();
  else { runtimeLevelDropdown.classList.remove('hidden'); runtimeLevelSwitch.setAttribute('aria-expanded','true'); }
});
runtimeLevelDropdown?.addEventListener('click',event=>{
  event.stopPropagation();
  const addButton=event.target.closest('.runtime-level-row-action');
  if(addButton){
    runtimeClusterAddTarget=addButton.closest('[data-runtime-context="environment"]');
    const main=runtimeLevelSwitch.closest('.runtime-context-main');
    const buttonRect=addButton.getBoundingClientRect();
    const mainRect=main.getBoundingClientRect();
    runtimeClusterAddMenu.classList.remove('hidden');
    const menuRect=runtimeClusterAddMenu.getBoundingClientRect();
    const preferredLeft=buttonRect.right-mainRect.left+4;
    const maxLeft=Math.max(4,main.clientWidth-menuRect.width-4);
    runtimeClusterAddMenu.style.left=`${Math.min(preferredLeft,maxLeft)}px`;
    runtimeClusterAddMenu.style.top=`${Math.max(4,buttonRect.top-mainRect.top)}px`;
    return;
  }
  const row=event.target.closest('[data-runtime-level]');
  if(!row)return;
  applyRuntimeContext(row.dataset.runtimeContext,row.dataset.runtimeLevel);
  closeRuntimeLevelDropdown();
});
runtimeClusterAddMenu?.addEventListener('click',event=>{
  event.stopPropagation();
  const option=event.target.closest('[data-runtime-cluster-option]');
  if(!option)return;
  const clusterId=option.dataset.runtimeClusterOption;
  const clusterLabel=clusterId.replace(/^cluster-/, 'cluster-');
  if(!runtimeClusterAddTarget)return;
  const environmentRows=[];
  let sibling=runtimeClusterAddTarget.nextElementSibling;
  while(sibling&&!sibling.matches('[data-runtime-context="environment"], .runtime-level-divider')){
    if(sibling.matches('[data-runtime-context="cluster"]'))environmentRows.push(sibling);
    sibling=sibling.nextElementSibling;
  }
  const existingRow=environmentRows.find(row=>row.dataset.runtimeLevel===clusterId);
  if(existingRow){
    option.remove();
    refreshRuntimeClusterAddMenu();
    applyRuntimeContext('cluster',clusterId);
    runtimeClusterAddMenu.classList.add('hidden');
    closeRuntimeLevelDropdown();
    return;
  }
  const insertBefore=sibling||runtimeLevelDropdown?.querySelector('.runtime-level-divider');
  if(!insertBefore)return;
  const row=document.createElement('button');
  row.type='button';
  row.className='runtime-level-row runtime-level-child is-selected';
  row.setAttribute('role','menuitem');
  row.dataset.runtimeLevel=clusterId;
  row.dataset.runtimeContext='cluster';
  row.innerHTML=`<span>${clusterLabel}</span><span class="runtime-level-tag">集群</span>`;
  insertBefore.before(row);
  const emptyState=runtimeClusterAddTarget.nextElementSibling;
  if(emptyState?.classList.contains('runtime-level-empty'))emptyState.remove();
  runtimeLevelDropdown.classList.add('has-added-cluster');
  runtimeContextValueLabels[clusterId]=clusterLabel;
  runtimeContextSelection.cluster=clusterId;
  option.remove();
  refreshRuntimeClusterAddMenu();
  applyRuntimeContext('cluster',clusterId);
  toast(`已添加集群配置：${clusterLabel}`);
  runtimeClusterAddMenu.classList.add('hidden');
  closeRuntimeLevelDropdown();
});
runtimeLevelDropdown?.querySelector('.runtime-mini-switch')?.addEventListener('click',event=>{
  event.stopPropagation();
  const button=event.currentTarget;
  const active=button.classList.toggle('is-on');
  button.setAttribute('aria-pressed',String(active));
  toast(active?'已启用集群配置异构':'已关闭集群配置异构');
});
document.addEventListener('click',event=>{
  if(runtimeClusterAddMenu&&!runtimeClusterAddMenu.contains(event.target)&&!runtimeLevelDropdown.contains(event.target)) runtimeClusterAddMenu.classList.add('hidden');
  if(runtimeLevelDropdown&&!runtimeLevelDropdown.contains(event.target)&&event.target!==runtimeLevelSwitch) closeRuntimeLevelDropdown();
});
const runtimeTocItems=[...document.querySelectorAll('[data-runtime-toc]')];
document.querySelectorAll('.runtime-setting-row').forEach(row=>{
  const title=row.querySelector(':scope > div > strong');
  if(title?.textContent.trim()==='部署并发度'){
    row.classList.add('is-field-disabled');
    row.querySelectorAll('input').forEach(input=>{ input.disabled=true; });
  }
});
const runtimeTocCurrent=document.querySelector('.runtime-toc-current');
let runtimeTocFrame=0;
function updateRuntimeTocFromScroll(){
  if(!runtimeTocItems.length)return;
  const workspaceRect=workspace?.getBoundingClientRect();
  const viewportTop=(workspaceRect?.top||0)+24;
  let activeIndex=0;
  runtimeTocItems.forEach((item,index)=>{
    const target=document.querySelector(`[data-runtime-config="${item.dataset.runtimeToc}"]`);
    if(target&&target.getBoundingClientRect().top<=viewportTop)activeIndex=index;
  });
  runtimeTocItems.forEach((item,index)=>item.classList.toggle('is-current',index===activeIndex));
  const activeItem=runtimeTocItems[activeIndex];
  if(runtimeTocCurrent&&activeItem){
    runtimeTocCurrent.style.top=`${activeItem.offsetTop+Math.max(0,(activeItem.offsetHeight-runtimeTocCurrent.offsetHeight)/2)}px`;
  }
}
function scheduleRuntimeTocSync(){
  if(runtimeTocFrame)return;
  runtimeTocFrame=window.requestAnimationFrame(()=>{
    runtimeTocFrame=0;
    updateRuntimeTocFromScroll();
  });
}
runtimeTocItems.forEach(item=>item.addEventListener('click',event=>{
  event.preventDefault();
  const target=document.querySelector(`[data-runtime-config="${item.dataset.runtimeToc}"]`);
  if(target)target.scrollIntoView({behavior:'smooth',block:'start'});
  scheduleRuntimeTocSync();
}));
workspace?.addEventListener('scroll',scheduleRuntimeTocSync,{passive:true});
window.addEventListener('resize',scheduleRuntimeTocSync,{passive:true});
updateRuntimeTocFromScroll();
document.querySelectorAll('[data-runtime-collapse]').forEach(button=>button.addEventListener('click',event=>{
  event.stopPropagation();
  const items=button.dataset.runtimeCollapse==='container'
    ? button.closest('.runtime-container-header').nextElementSibling
    : button.closest('.runtime-workload-items');
  const collapsed=items.classList.toggle('is-collapsed');
  button.classList.toggle('is-collapsed',collapsed);
  button.setAttribute('aria-expanded',String(!collapsed));
}));
document.querySelectorAll('[data-runtime-add]:not([data-runtime-add="level"])').forEach(button=>button.addEventListener('click',event=>{
  event.stopPropagation();
  if(button.dataset.runtimeAdd==='container'){
    document.querySelector('#containerCreateModal')?.classList.remove('hidden');
    return;
  }
  toast(`已打开新增${button.dataset.runtimeAdd==='workload'?'工作负载':'资源'}配置`);
}));
let runtimeAffinitySelectSequence=0;
function createRuntimeAffinitySelect(label){
  const selectId=`runtimeAffinityOperator-${++runtimeAffinitySelectSequence}`;
  return `<div class="filter-select runtime-affinity-select" data-filter-select="${selectId}"><button type="button" class="filter-select-trigger" aria-haspopup="listbox" aria-expanded="false" aria-label="${label}"><span></span><svg aria-hidden="true"><use href="#i-chevron-down"/></svg></button><div class="filter-select-menu" role="listbox"></div><select id="${selectId}" class="filter-select-native" aria-label="${label}"><option value="in">在列表中(In)</option><option value="not-in">不在列表中(NotIn)</option><option value="exists">存在(Exists)</option></select></div>`;
}
function createRuntimeAffinityGroup(index){
  const group=document.createElement('div');
  group.className='runtime-affinity-group-card';
  group.innerHTML=`<div class="runtime-affinity-group-head"><strong>条件组 ${index}</strong><button class="runtime-affinity-delete" type="button"><img src="./assets/service-exposure/delete.svg" alt="">删除该组</button></div><div class="runtime-affinity-table"><div class="runtime-affinity-row runtime-affinity-head"><span>标签键</span><span>操作符</span><span>值</span><span>操作</span></div><div class="runtime-affinity-row"><input aria-label="标签键 ${index}" placeholder="如 kubernetes.io/hostname">${createRuntimeAffinitySelect(`操作符 ${index}`)}<input aria-label="值 ${index}" placeholder="多个值用逗号分隔"><button class="runtime-affinity-expression-delete" type="button" aria-label="删除表达式"><img src="./assets/service-exposure/delete.svg" alt=""></button></div></div><button class="runtime-affinity-expression-add" type="button"><img src="./assets/service-exposure/add.svg" alt="">添加表达式</button>`;
  return group;
}
function expandRuntimeHardRequirement(button){
  const block=button.closest('.runtime-rule-block');
  if(!block)return;
  let groups=block.querySelector('.runtime-affinity-groups');
  if(!groups){
    groups=document.createElement('div');
    groups.className='runtime-affinity-groups';
    block.insertBefore(groups,button);
  }
  groups.append(createRuntimeAffinityGroup(groups.querySelectorAll('.runtime-affinity-group-card').length+1));
  window.CNAPSelect?.initAll();
  button.textContent='＋ 添加条件组';
}
document.querySelector('#runtimePage')?.addEventListener('click',event=>{
  const addGroup=event.target.closest('.runtime-add-btn');
  const addGroupTitle=addGroup?.closest('.runtime-rule-block')?.querySelector(':scope > strong')?.textContent.trim();
  if(addGroup&&addGroup.textContent.includes('添加条件组')&&addGroupTitle?.startsWith('硬性要求')){ expandRuntimeHardRequirement(addGroup); return; }
  const addExpression=event.target.closest('.runtime-affinity-expression-add');
  if(addExpression){
    const table=addExpression.parentElement.querySelector('.runtime-affinity-table');
    const rowIndex=table.querySelectorAll('.runtime-affinity-row:not(.runtime-affinity-head)').length+1;
    const row=document.createElement('div');
    row.className='runtime-affinity-row';
    row.innerHTML=`<input aria-label="标签键 ${rowIndex}" placeholder="如 kubernetes.io/hostname">${createRuntimeAffinitySelect(`操作符 ${rowIndex}`)}<input aria-label="值 ${rowIndex}" placeholder="多个值用逗号分隔"><button class="runtime-affinity-expression-delete" type="button" aria-label="删除表达式"><img src="./assets/service-exposure/delete.svg" alt=""></button>`;
    table.append(row);
    window.CNAPSelect?.initAll();
    return;
  }
  const deleteGroup=event.target.closest('.runtime-affinity-delete');
  if(deleteGroup){
    const groups=deleteGroup.closest('.runtime-affinity-groups');
    if(groups.querySelectorAll('.runtime-affinity-group-card').length>1)deleteGroup.closest('.runtime-affinity-group-card')?.remove();
    return;
  }
  const deleteExpression=event.target.closest('.runtime-affinity-expression-delete');
  if(deleteExpression){
    const table=deleteExpression.closest('.runtime-affinity-table');
    if(table.querySelectorAll('.runtime-affinity-row:not(.runtime-affinity-head)').length>1)deleteExpression.closest('.runtime-affinity-row')?.remove();
  }
});
const containerCreateModal=document.querySelector('#containerCreateModal');
const closeContainerCreate=()=>containerCreateModal?.classList.add('hidden');
containerCreateModal?.querySelectorAll('.container-create-close,.container-create-cancel').forEach(button=>button.addEventListener('click',closeContainerCreate));
containerCreateModal?.addEventListener('click',event=>{if(event.target===containerCreateModal)closeContainerCreate();});
containerCreateModal?.querySelectorAll('.container-type-card').forEach(card=>card.addEventListener('click',()=>{
  containerCreateModal.querySelectorAll('.container-type-card').forEach(item=>item.classList.remove('is-selected'));
  card.classList.add('is-selected');
}));
containerCreateModal?.querySelector('.container-create-next')?.addEventListener('click',()=>toast('容器信息已保存'));
document.querySelectorAll('.runtime-section-heading .runtime-icon-btn').forEach(button=>button.addEventListener('click',()=>{
  const section=button.closest('.runtime-section');
  section.classList.toggle('is-collapsed');
  button.classList.toggle('is-collapsed',section.classList.contains('is-collapsed'));
}));
document.querySelectorAll('.runtime-switch').forEach(button=>button.addEventListener('click',()=>{
  const active=button.classList.toggle('is-on');
  button.setAttribute('aria-pressed',String(active));
}));
document.querySelector('#runtimeSearchInput').addEventListener('input',event=>{
  const query=event.target.value.trim().toLowerCase();
  document.querySelectorAll('.runtime-tree-group').forEach(group=>{
    group.classList.toggle('is-filtered',Boolean(query));
    group.querySelectorAll('[data-runtime-target]').forEach(item=>{
      item.classList.toggle('is-search-hidden',Boolean(query&&!item.textContent.toLowerCase().includes(query)));
    });
  });
});
document.querySelector('#runtimeSaveBtn').addEventListener('click',()=>{
  openRuntimeSaveConfirm();
});
const runtimeResetBtn=document.querySelector('#runtimeResetBtn');
if(runtimeResetBtn) runtimeResetBtn.addEventListener('click',()=>{
  document.querySelectorAll('#runtimePage input[type="number"]').forEach(input=>{if(input.defaultValue)input.value=input.defaultValue;});
  const stateLabel=document.querySelector('#runtimeSaveState');
  if(stateLabel) stateLabel.textContent='正在编辑配置';
  toast('已恢复当前配置');
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
  state.status=button.dataset.status; resetClusterPages(); document.querySelector('#statusSelect').value=state.status; syncFilterSelect('statusSelect'); render();
}));
document.querySelector('#statusSelect').addEventListener('change',event=>{state.status=event.target.value;syncFilterSelect('statusSelect');resetClusterPages();document.querySelectorAll('.tabs button').forEach(item=>item.classList.toggle('active',item.dataset.status===state.status));render();});
document.querySelector('#trafficSelect').addEventListener('change',event=>{state.traffic=event.target.value;syncFilterSelect('trafficSelect');resetClusterPages();render();});
document.querySelector('#titleStatusSelect').addEventListener('change',event=>{state.status=event.target.value;resetClusterPages();document.querySelector('#statusSelect').value=state.status;syncFilterSelect('statusSelect');document.querySelectorAll('.tabs button').forEach(item=>item.classList.toggle('active',item.dataset.status===state.status));render();});
document.querySelector('#titleClusterSelect').addEventListener('change',event=>{state.cluster=event.target.value;resetClusterPages();render();});
document.querySelector('#searchInput').addEventListener('input',event=>{state.query=event.target.value.trim().toLowerCase();resetClusterPages();render();});
window.CNAPSelect?.initAll();
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
    syncFilterSelect('statusSelect');
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
modal.addEventListener('click',event=>{
  if(event.target.closest('[data-modal-close]')){closeModal();return;}
  if(event.target.closest('[data-runtime-delete-confirm]')){confirmRuntimeDelete();return;}
  if(event.target.closest('[data-runtime-save-discard]')){completeRuntimeSave(false);return;}
  if(event.target.closest('[data-runtime-save-confirm]')){completeRuntimeSave(true);return;}
  if(event.target.closest('[data-modal-confirm]'))executeAction();
});
modal.addEventListener('scroll',()=>{const header=modal.querySelector('.operation-modal-header');if(header)header.classList.toggle('is-scrolled',modal.scrollTop>0);});
detailBackdrop.addEventListener('click',event=>{if(event.target===detailBackdrop)closeInstanceDetail();});
instanceModal.addEventListener('click',event=>{
  const close=event.target.closest('.close-detail');
  if(close){closeInstanceDetail();return;}
  const body=instanceModal.querySelector('.detail-body');
  const drawerTab=event.target.closest('[data-drawer-tab]');
  if(drawerTab&&body){openInstanceDetail(body.dataset.instanceId,drawerTab.dataset.drawerTab);return;}
  const drawerMore=event.target.closest('[data-drawer-more]');
  if(drawerMore){event.stopPropagation();openMenu(drawerMore,[{key:'detail',label:'查看实例详情',icon:'detail'},{key:'history',label:'查看实例变更记录',icon:'clipboard'},{key:'restart-row',label:'重启实例',icon:'restart'}]);menu.dataset.pod=drawerMore.dataset.drawerMore;return;}
  const copyPort=event.target.closest('[data-copy-port]');
  if(copyPort&&body){
    const pod=pods.find(item=>item[0]===body.dataset.instanceId);
    const value=`${pod?.[3] || ''}:${copyPort.dataset.copyPort}`;
    navigator.clipboard?.writeText(value).catch(()=>{});
    toast(`已复制 ${value}`);
    return;
  }
  const copyAllPorts=event.target.closest('[data-copy-all-ports]');
  if(copyAllPorts&&body){
    const pod=pods.find(item=>item[0]===body.dataset.instanceId);
    const ip=pod?.[3] || '';
    const values=Array.from(instanceModal.querySelectorAll('[data-copy-port]'))
      .map(button=>`${ip}:${button.dataset.copyPort}`)
      .join('\n');
    navigator.clipboard?.writeText(values).catch(()=>{});
    toast(`已复制 ${values.split('\n').filter(Boolean).length} 个端口`);
    return;
  }
  const summaryToggle=event.target.closest('[data-summary-toggle]');
  if(summaryToggle){
    const shell=summaryToggle.closest('.instance-summary-shell');
    state.instanceSummaryCollapsed=!state.instanceSummaryCollapsed;
    shell?.classList.toggle('is-collapsed',state.instanceSummaryCollapsed);
    summaryToggle.setAttribute('aria-expanded',String(!state.instanceSummaryCollapsed));
    const arrow=summaryToggle.querySelector('img');
    const label=summaryToggle.querySelector('span');
    if(arrow) arrow.src=state.instanceSummaryCollapsed
      ? `${figmaIconPath}/image_6.png`
      : `${drawerAssetPath}/image_61.png`;
    if(label) label.textContent=state.instanceSummaryCollapsed?'展开':'收起';
    return;
  }
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
  if(fullscreen){
    const isFullscreen=instanceModal.classList.toggle('fullscreen');
    fullscreen.innerHTML=icon(isFullscreen?'close':'share');
    fullscreen.title=isFullscreen?'退出全屏':'全屏';
    return;
  }
  const openNew=event.target.closest('[data-open-new]');
  if(openNew){window.open(`${window.location.href.split('#')[0]}#pod=${openNew.dataset.openNew}`,'_blank','noopener');return;}
  const action=event.target.closest('[data-detail-action]');
  if(action&&body){const id=body.dataset.instanceId;closeInstanceDetail();triggerAction(action.dataset.detailAction,[id]);}
});
function upgradeRuntimeCredentialsSection(){
  const section=document.querySelector('#runtimePage [data-runtime-config="credentials-config"]');
  if(!section||section.dataset.credentialsRefined==='true')return;
  section.dataset.credentialsRefined='true';
  section.innerHTML=`<div class="runtime-credential-list runtime-credentials-manager"><div class="runtime-credential-inner"><div class="runtime-setting-row runtime-credential-top"><span class="runtime-setting-icon"><svg><use href="#i-runtime-open-one"/></svg></span><div class="runtime-credential-title"><strong>凭证管理</strong></div><div class="runtime-inline-actions"><button type="button"><svg><use href="#i-runtime-copy"/></svg><span>复制全部</span></button><button type="button"><svg><use href="#i-runtime-visible"/></svg><span>显示全部</span></button></div><div class="runtime-credential-add-list"><button class="runtime-add-btn" type="button"><svg><use href="#i-runtime-add"/></svg>添加凭证</button><button class="runtime-add-btn" type="button"><svg><use href="#i-runtime-add"/></svg>批量添加</button></div></div></div></div>`;
  const credentialActions=section.querySelector('.runtime-credential-add-list');
  if(credentialActions)credentialActions.style.marginTop='8px';
}
upgradeRuntimeCredentialsSection();
function upgradeRuntimeImageSection(){
  const section=document.querySelector('#runtime-container-image');
  if(!section||section.dataset.imageRefined==='true')return;
  section.dataset.imageRefined='true';
  section.innerHTML=`<h4>镜像构建</h4><div class="runtime-image-list"><div class="runtime-image-source"><div class="runtime-image-source-title"><span class="runtime-setting-icon"><svg><use href="#i-runtime-open-one"/></svg></span><strong>镜像来源</strong></div><div class="runtime-image-source-controls"><div class="runtime-image-source-copy"><b>当前选择</b><span class="runtime-level-tag">其他标签</span><small>从预置的基础镜像出发，叠加自定义构建配置生成镜像</small></div><button class="runtime-select-value" type="button">基础镜像库 <svg><use href="#i-chevron-down"/></svg></button></div></div><div class="runtime-image-heading"><span class="runtime-setting-icon"><svg><use href="#i-runtime-open-one"/></svg></span><div class="runtime-image-heading-copy"><strong>基础镜像</strong><p>选择镜像构建的基础。百度基础镜像包含优化的发行版和技术栈镜像；社区标准镜像为官方发布的镜像。</p></div></div><div class="runtime-image-shell"><div class="runtime-image-tabs"><button class="is-active" type="button">百度基础镜像</button><button type="button">社区标准镜像</button></div><div class="runtime-image-panel"><div class="runtime-image-group"><p>基础OS发行版</p><div class="runtime-image-card-grid"><button class="runtime-image-card is-active" type="button"><span class="runtime-image-icon"><img src="./assets/runtime-images/ubuntu.png" alt=""></span><span>Ubuntu</span></button><button class="runtime-image-card" type="button"><span class="runtime-image-icon runtime-image-icon-light"><img src="./assets/runtime-images/alpine.png" alt=""></span><span>Alpine</span></button><button class="runtime-image-card" type="button"><span class="runtime-image-icon runtime-image-icon-light runtime-image-centos"><img src="./assets/runtime-images/centos.png" alt=""></span><span>CentOS</span></button></div><div class="runtime-image-version-card runtime-image-version-ubuntu"><span>选择 Ubuntu 版本</span><div class="runtime-version-pills"><button class="is-active" type="button">26.04 Resolute</button><button type="button">24.04 Noble</button><button type="button">24.04 Noble</button></div></div></div><div class="runtime-image-group"><p>技术栈</p><div class="runtime-image-card-grid"><button class="runtime-image-card" type="button"><span class="runtime-image-icon"><img src="./assets/runtime-images/ubuntu.png" alt=""></span><span>基础基础OS镜像</span></button><button class="runtime-image-card" type="button"><span class="runtime-image-icon runtime-image-icon-light"><img src="./assets/runtime-images/alpine.png" alt=""></span><span>百度 GCC</span></button><button class="runtime-image-card" type="button"><span class="runtime-image-icon runtime-image-icon-light runtime-image-centos"><img src="./assets/runtime-images/centos.png" alt=""></span><span>OpenJDK</span></button><button class="runtime-image-card is-active" type="button"><span class="runtime-image-icon"><img src="./assets/runtime-images/python.png" alt=""></span><span>Python</span></button><button class="runtime-image-card" type="button"><span class="runtime-image-icon runtime-image-icon-light"><img src="./assets/runtime-images/node.png" alt=""></span><span>Node</span></button><button class="runtime-image-card" type="button"><span class="runtime-image-icon runtime-image-icon-light runtime-image-centos"><img src="./assets/runtime-images/centos.png" alt=""></span><span>Go</span></button></div><div class="runtime-image-version-card runtime-image-version-python"><span>选择 Python 版本</span><div class="runtime-version-pills"><button class="is-active" type="button">3.14</button><button type="button">3.13</button><button type="button">3.12</button><button type="button">3.11</button><button type="button">2.7</button></div></div></div></div></div></div></div>`;
  const baseHeading=section.querySelector('.runtime-image-heading');
  const baseShell=section.querySelector('.runtime-image-shell');
  if(baseHeading&&baseShell){
    const baseGroup=document.createElement('div');
    baseGroup.className='runtime-image-base-group';
    baseHeading.before(baseGroup);
    baseGroup.append(baseHeading,baseShell);
  }
  const runtimeImageVariants=[
    {selector:'.runtime-image-version-ubuntu',cards:[['ubuntu-card.png','#fffdfc'],['base-os-card.png','#f5fdff'],['alpine-card.png','#fefcff']]},
    {selector:'.runtime-image-version-python',cards:[['base-os-card.png','#f8fcff'],['gcc-layer2.svg','#fffdfc'],['node-card.png','#fafdff'],['openjdk-card.png','#fafdff'],['go-card.png','#fafdff'],['python-card.png','#f5fdff']]}
  ];
  const syncRuntimeImagePreview=(group,card)=>{
    const variant=runtimeImageVariants.find(item=>group.querySelector(item.selector));
    const index=[...group.querySelectorAll('.runtime-image-card')].indexOf(card);
    const data=variant?.cards[index];
    const preview=variant&&group.querySelector(variant.selector);
    if(!data||!preview)return;
    preview.style.setProperty('--runtime-card-image',`url("./assets/runtime-images/${data[0]}")`);
    preview.style.setProperty('--runtime-card-gradient',data[1]);
  };
  runtimeImageVariants.forEach(variant=>{
    const preview=section.querySelector(variant.selector);
    const group=preview?.closest('.runtime-image-group');
    group?.querySelectorAll('.runtime-image-card').forEach((card,index)=>{
      const data=variant.cards[index];
      const image=card.querySelector('.runtime-image-icon img');
      if(data){card.dataset.runtimeCardImage=data[0];card.dataset.runtimeCardGradient=data[1];}
      if(image&&data)image.src=`./assets/runtime-images/${data[0]}`;
    });
    const active=group?.querySelector('.runtime-image-card.is-active');
    if(active)syncRuntimeImagePreview(group,active);
  });
  section.addEventListener('click',event=>{
    const tab=event.target.closest('.runtime-image-tabs button');
    if(tab){section.querySelectorAll('.runtime-image-tabs button').forEach(item=>item.classList.toggle('is-active',item===tab));return;}
    const card=event.target.closest('.runtime-image-card');
    if(card){const group=card.closest('.runtime-image-group');group?.querySelectorAll('.runtime-image-card').forEach(item=>item.classList.toggle('is-active',item===card));if(group)syncRuntimeImagePreview(group,card);return;}
    const pill=event.target.closest('.runtime-version-pills button');
    if(pill){pill.parentElement.querySelectorAll('button').forEach(item=>item.classList.toggle('is-active',item===pill));}
  });
}
upgradeRuntimeImageSection();

function upgradeRuntimeContainerBuildSection(){
  const section=document.querySelector('#runtimePage [data-runtime-config="container-image-config"]');
  const imageList=section?.querySelector('.runtime-image-list');
  if(!section||!imageList||section.dataset.buildRefined==='true')return;
  section.dataset.buildRefined='true';
  const tail=document.createElement('div');
  tail.className='runtime-container-build-tail';
  tail.innerHTML=`<div class="runtime-setting-row runtime-setting-row-block"><span class="runtime-setting-icon"><svg><use href="#i-runtime-open-one"/></svg></span><div><strong>预装组件</strong><input class="runtime-full-input" placeholder="搜索并选择要预装的 Linux 软件包，例如：输入 cuda，即可快速过滤对应版本"></div></div><div class="runtime-setting-row runtime-setting-row-block"><span class="runtime-setting-icon"><svg><use href="#i-runtime-open-one"/></svg></span><div><strong>自定义 Dockerfile 命令</strong></div><button class="runtime-add-btn" type="button"><svg><use href="#i-runtime-add"/></svg>添加标签</button></div><div class="runtime-setting-row runtime-setting-row-block runtime-code-repository-row"><span class="runtime-setting-icon"><svg><use href="#i-runtime-open-one"/></svg></span><div class="runtime-container-content"><strong>代码库</strong><div class="runtime-code-repository-content"><button class="runtime-add-btn" type="button" data-credential-add="code-repository"><svg><use href="#i-runtime-add"/></svg>添加代码库</button></div></div></div><div class="runtime-setting-row runtime-setting-row-block"><span class="runtime-setting-icon"><svg><use href="#i-runtime-open-one"/></svg></span><div><strong>部署路径</strong><textarea class="runtime-build-path" placeholder="部署到镜像中的路径，如 /home/work/app"></textarea></div></div><div class="runtime-setting-row runtime-setting-row-block runtime-command-row"><span class="runtime-setting-icon"><svg><use href="#i-runtime-open-one"/></svg></span><div><strong>启动命令</strong></div><div class="runtime-build-inline"><button class="runtime-add-btn" type="button"><svg><use href="#i-runtime-add"/></svg>添加启动命令</button><span><svg><use href="#i-runtime-attention"/></svg>未设置，将使用基础镜像默认的启动命令</span></div></div><div class="runtime-setting-row runtime-setting-row-block runtime-command-row"><span class="runtime-setting-icon"><svg><use href="#i-runtime-open-one"/></svg></span><div><strong>默认参数</strong></div><div class="runtime-build-inline"><button class="runtime-add-btn" type="button"><svg><use href="#i-runtime-add"/></svg>添加默认参数</button><span><svg><use href="#i-runtime-attention"/></svg>未设置，将使用基础镜像默认的参数</span></div></div><div class="runtime-setting-row"><span class="runtime-setting-icon"><svg><use href="#i-runtime-open-one"/></svg></span><div><strong>压缩格式</strong></div><select class="runtime-build-select"><option>gzip</option></select></div><div class="runtime-setting-row"><span class="runtime-setting-icon"><svg><use href="#i-runtime-open-one"/></svg></span><div><strong>多平台构建</strong><p>关闭（仅构建当前架构）</p></div><button class="runtime-switch" type="button" aria-pressed="false"><i></i></button></div>`;
  tail.querySelectorAll('.runtime-command-row').forEach(row=>row.remove());
  imageList.append(tail);
  const codeRow=tail.querySelector('.runtime-code-repository-row');
  const addButton=codeRow?.querySelector('[data-credential-add="code-repository"]');
  addButton?.addEventListener('click',()=>{
    if(codeRow.querySelector('.runtime-code-repository-table'))return;
    const table=document.createElement('div');
    table.className='runtime-code-repository-table';
    const rows=Array.from({length:3},(_,index)=>index+1);
    table.innerHTML=`<div class="runtime-code-repository-col runtime-code-repository-drag"><div class="runtime-code-repository-head"></div>${rows.map(()=>'<div class="runtime-code-repository-cell"><button type="button" class="runtime-repository-drag" aria-label="拖动排序"><svg><use href="#i-runtime-drag"/></svg></button></div>').join('')}</div><div class="runtime-code-repository-col runtime-code-repository-index"><div class="runtime-code-repository-head">序号</div>${rows.map(index=>`<div class="runtime-code-repository-cell">${index}</div>`).join('')}</div><div class="runtime-code-repository-col runtime-code-repository-name"><div class="runtime-code-repository-head">代码库</div>${rows.map(()=>'<div class="runtime-code-repository-cell"><div class="runtime-disabled-input"><svg><use href="#i-runtime-search"/></svg><span>输入或搜索代码库</span></div></div>').join('')}</div><div class="runtime-code-repository-col runtime-code-repository-build"><div class="runtime-code-repository-head">BCloud 构建配置</div>${rows.map(()=>'<div class="runtime-code-repository-cell"><div class="runtime-disabled-input"><span>构建配置名</span></div></div>').join('')}</div><div class="runtime-code-repository-col runtime-code-repository-operation"><div class="runtime-code-repository-head">操作</div>${rows.map(()=>'<div class="runtime-code-repository-cell"><button type="button" data-repository-action="external" aria-label="查看代码库"><svg><use href="#i-runtime-external"/></svg></button><button type="button" data-repository-action="copy" aria-label="复制代码库配置"><svg><use href="#i-runtime-copy"/></svg></button><button type="button" data-repository-action="visible" aria-label="显示代码库配置"><svg><use href="#i-runtime-visible"/></svg></button><button type="button" data-repository-action="delete" aria-label="删除代码库"><svg><use href="#i-runtime-delete"/></svg></button></div>').join('')}</div>`;
    const repositoryContent=codeRow.querySelector('.runtime-code-repository-content');
    repositoryContent.insertBefore(table,addButton);
    table.addEventListener('click',event=>{
      const action=event.target.closest('[data-repository-action]');
      if(!action)return;
      if(action.dataset.repositoryAction==='delete'){
        const cell=action.closest('.runtime-code-repository-cell');
        const column=cell?.closest('.runtime-code-repository-col');
        const rowIndex=cell&&column?Array.from(column.querySelectorAll('.runtime-code-repository-cell')).indexOf(cell):-1;
        if(rowIndex>=0)table.querySelectorAll('.runtime-code-repository-col').forEach(col=>col.querySelectorAll('.runtime-code-repository-cell')[rowIndex]?.remove());
        return;
      }
      action.classList.toggle('is-active');
    });
  });
}
upgradeRuntimeContainerBuildSection();
document.querySelectorAll('#runtimePage .runtime-input-unit input, #runtimePage .runtime-inline-control input').forEach(input=>{
  input.type='number';
  input.min='0';
});
window.CNAPInput?.initAll();
function setRuntimeFieldEnabled(scope,enabled){
  scope.classList.toggle('is-field-enabled',enabled);
  scope.classList.toggle('is-field-disabled',!enabled);
  const toggle=scope.matches('.runtime-rule-group')
    ? scope.querySelector(':scope > .runtime-subsection-title > .runtime-setting-icon')
    : scope.matches('.runtime-image-base-group')
      ? scope.querySelector(':scope > .runtime-image-heading > .runtime-setting-icon')
      : scope.matches('.runtime-image-source')
        ? scope.querySelector(':scope > .runtime-image-source-title > .runtime-setting-icon')
    : scope.querySelector(':scope > .runtime-setting-icon, :scope > .runtime-image-heading > .runtime-setting-icon');
  toggle?.classList.toggle('is-active',enabled);
  toggle?.setAttribute('aria-pressed',String(enabled));
  scope.querySelectorAll('input,select,textarea,button').forEach(control=>{
    if(control===toggle)return;
    control.disabled=!enabled;
  });
}
function syncRuntimeInheritedControls(){
  document.querySelectorAll('#runtimePage .runtime-setting-row.is-field-disabled, #runtimePage .runtime-rule-group.is-field-disabled, #runtimePage .runtime-image-list.is-field-disabled, #runtimePage .runtime-image-source.is-field-disabled, #runtimePage .runtime-image-base-group.is-field-disabled').forEach(scope=>{
    scope.querySelectorAll('input,select,textarea,button:not(.runtime-setting-icon)').forEach(control=>{
      control.disabled=true;
    });
  });
}
function getRuntimeTooltipText(state){
  if(activeRuntimeContext==='application')return '';
  const current=runtimeContextValueLabels[runtimeContextSelection[activeRuntimeContext]];
  if(activeRuntimeContext==='environment'){
    const application=runtimeContextValueLabels[runtimeContextSelection.application];
    if(state==='active')return `已在${current}的环境级配置中覆盖为本地值。点击取消覆盖`;
    if(state==='restore')return `再次点击将放弃本地覆盖，恢复继承自 ${application} 的应用级配置`;
    return `${current}的环境级配置，继承自 ${application} 的应用级配置。点击可在当前层级覆盖为本地值`;
  }
  const environment=runtimeContextValueLabels[runtimeContextSelection.environment];
  if(state==='active')return `已在${current}的集群级配置中覆盖为本地值。点击取消覆盖`;
  if(state==='restore')return `再次点击将放弃本地覆盖，恢复继承自 ${environment} 的环境级配置`;
  return `${current}的集群级配置，继承自 ${environment} 的环境级配置。点击可在当前层级覆盖为本地值`;
}
function setupRuntimeFieldActivation(){
  const scopes=[...document.querySelectorAll('#runtimePage .runtime-setting-row, #runtimePage .runtime-rule-group, #runtime-container-image .runtime-image-source, #runtime-container-image .runtime-image-base-group')].filter(Boolean);
  scopes.forEach(scope=>{
    const icon=scope.matches('.runtime-image-base-group')
      ? scope.querySelector(':scope > .runtime-image-heading > .runtime-setting-icon')
      : scope.matches('.runtime-image-source')
        ? scope.querySelector(':scope > .runtime-image-source-title > .runtime-setting-icon')
      : scope.matches('.runtime-rule-group')
        ? scope.querySelector(':scope > .runtime-subsection-title > .runtime-setting-icon')
        : scope.querySelector(':scope > .runtime-setting-icon');
    if(!icon||!icon.querySelector('svg'))return;
    let toggle=icon;
    if(icon.tagName!=='BUTTON'){
      toggle=document.createElement('button');
      toggle.type='button';
      toggle.className=icon.className;
      toggle.innerHTML=icon.innerHTML;
      icon.replaceWith(toggle);
    }
    toggle.dataset.runtimeFieldToggle='';
    toggle.dataset.runtimeFieldState='default';
    toggle.setAttribute('aria-label','启用此配置项');
    scope._runtimeInitialValues=[...scope.querySelectorAll('input,select,textarea')].map(control=>({
      control,
      value:control.value,
      checked:control.checked
    }));
    toggle.addEventListener('click',event=>{
      event.preventDefault();
      event.stopPropagation();
      scope._runtimeRestoreHotZone?.cancel();
      const state=toggle.dataset.runtimeFieldState;
      if(state==='default'){
        setRuntimeFieldEnabled(scope,true);
        scope.classList.remove('is-restore-pending');
        toggle.dataset.runtimeFieldState='active';
        toggle.setAttribute('aria-label','取消覆盖');
        ensureRuntimeFieldTooltip(scope,getRuntimeTooltipText('active'));
      } else if(state==='active'){
        scope.classList.add('is-restore-pending');
        toggle.dataset.runtimeFieldState='restore';
        toggle.setAttribute('aria-label','确认恢复继承配置');
        markRuntimeFieldRestorePending(scope);
      } else {
        scope._runtimeInitialValues?.forEach(({control,value,checked})=>{
          control.value=value;
          if('checked' in control)control.checked=checked;
        });
        setRuntimeFieldEnabled(scope,false);
        clearRuntimeFieldOverride(scope);
        scope.classList.remove('is-restore-pending');
        toggle.dataset.runtimeFieldState='default';
        toggle.setAttribute('aria-label','启用此配置项');
        ensureRuntimeFieldTooltip(scope,getRuntimeTooltipText('default'));
      }
    });
    const cancelRestoreTimer=()=>{
      clearTimeout(scope._runtimeRestoreTimer);
      scope._runtimeRestoreTimer=null;
    };
    const scheduleRestoreTimer=()=>{
      cancelRestoreTimer();
      scope._runtimeRestoreTimer=setTimeout(()=>{
        if(toggle.dataset.runtimeFieldState==='restore')restoreRuntimeFieldToBlue(scope);
      },300);
    };
    scope._runtimeRestoreHotZone={cancel:cancelRestoreTimer,schedule:scheduleRestoreTimer};
    toggle.addEventListener('pointerenter',cancelRestoreTimer);
    toggle.addEventListener('pointerleave',scheduleRestoreTimer);
    setRuntimeFieldEnabled(scope,false);
    ensureRuntimeFieldTooltip(scope,getRuntimeTooltipText('default'));
  });
}
function clearRuntimeFieldOverride(scope){
  scope._runtimeRestoreHotZone?.cancel();
  scope.querySelector('.runtime-override-tag')?.remove();
  scope.querySelector('.runtime-override-tooltip')?.remove();
  scope.querySelector('[data-runtime-field-toggle]')?.removeAttribute('aria-describedby');
  const title=scope.querySelector('.runtime-field-title');
  const label=title?.querySelector('strong, h4');
  if(title&&label)title.replaceWith(label);
}
function restoreRuntimeFieldToBlue(scope){
  if(!scope||!scope.classList.contains('is-restore-pending'))return;
  scope._runtimeRestoreHotZone?.cancel();
  scope.classList.remove('is-restore-pending');
  const toggle=scope.querySelector('[data-runtime-field-toggle]');
  if(toggle)toggle.dataset.runtimeFieldState='active';
  toggle?.setAttribute('aria-label','取消覆盖');
  const tag=scope.querySelector('.runtime-override-tag');
  if(tag){
    tag.className='runtime-override-tag';
    tag.textContent='已覆盖';
  }
  ensureRuntimeFieldTooltip(scope,getRuntimeTooltipText('active'));
}
let runtimeOverrideTooltipId=0;
function ensureRuntimeFieldTooltip(scope,text){
  const toggle=scope?.querySelector('[data-runtime-field-toggle]');
  if(!scope||!toggle)return;
  if(!text){
    scope.querySelector('.runtime-override-tooltip')?.remove();
    toggle.removeAttribute('aria-describedby');
    return;
  }
  let tooltip=scope.querySelector('.runtime-override-tooltip');
  if(!tooltip){
    tooltip=document.createElement('span');
    tooltip.className='runtime-override-tooltip';
    tooltip.setAttribute('role','tooltip');
    toggle.after(tooltip);
  }
  tooltip.textContent=text;
  if(!tooltip.id)tooltip.id=`runtime-override-tooltip-${++runtimeOverrideTooltipId}`;
  toggle.setAttribute('aria-describedby',tooltip.id);
}
function markRuntimeFieldRestorePending(scope){
  if(!scope)return;
  if(scope.matches('.runtime-rule-group'))return;
  const label=scope.matches('.runtime-image-list')
    ? scope.querySelector('.runtime-image-heading strong')
    : scope.querySelector(':scope > div:not(.runtime-setting-icon) strong');
  if(!label)return;
  let title=label.parentElement;
  if(!title?.classList.contains('runtime-field-title')){
    title=document.createElement('span');
    title.className='runtime-field-title';
    label.replaceWith(title);
    title.append(label);
  }
  let tag=title.querySelector('.runtime-override-tag');
  if(!tag){
    tag=document.createElement('span');
    title.append(tag);
  }
  tag.className='runtime-override-tag runtime-override-tag-pending';
  tag.textContent='再次点击 取消覆盖';

  const toggle=scope.querySelector('[data-runtime-field-toggle]');
  ensureRuntimeFieldTooltip(scope,getRuntimeTooltipText('restore'));
  const tooltip=scope.querySelector('.runtime-override-tooltip');
  const hotZone=scope._runtimeRestoreHotZone;
  if(hotZone&&!tooltip.dataset.hotZoneBound){
    tooltip.addEventListener('pointerenter',hotZone.cancel);
    tooltip.addEventListener('pointerleave',hotZone.schedule);
    tooltip.dataset.hotZoneBound='true';
  }
}
function refreshRuntimeFieldTooltips(){
  document.querySelectorAll('#runtimePage [data-runtime-field-toggle]').forEach(toggle=>{
    const scope=toggle.closest('.runtime-setting-row, .runtime-rule-group, .runtime-image-list');
    if(!scope)return;
    ensureRuntimeFieldTooltip(scope,getRuntimeTooltipText(toggle.dataset.runtimeFieldState||'default'));
  });
}
function markRuntimeFieldCovered(scope){
  if(!scope||!scope.classList.contains('is-field-enabled'))return;
  if(scope.matches('.runtime-rule-group'))return;
  const label=scope.matches('.runtime-image-list')
    ? scope.querySelector('.runtime-image-heading strong')
    : scope.querySelector(':scope > div:not(.runtime-setting-icon) strong');
  if(!label||label.parentElement.querySelector('.runtime-override-tag'))return;
  const title=document.createElement('span');
  title.className='runtime-field-title';
  label.replaceWith(title);
  title.append(label);
  const tag=document.createElement('span');
  tag.className='runtime-override-tag';
  tag.textContent='已覆盖';
  title.append(tag);
}
document.addEventListener('input',event=>{
  const scope=event.target.closest('#runtimePage .runtime-setting-row, #runtimePage .runtime-image-list');
  if(scope)markRuntimeFieldCovered(scope);
});
document.addEventListener('change',event=>{
  const scope=event.target.closest('#runtimePage .runtime-setting-row, #runtimePage .runtime-image-list');
  if(scope)markRuntimeFieldCovered(scope);
});
document.addEventListener('click',event=>{
  if(event.target.closest('[data-runtime-field-toggle]'))return;
  const control=event.target.closest('#runtimePage .runtime-switch, #runtimePage .runtime-choice-list button, #runtimePage .runtime-image-card');
  const scope=control?.closest('.runtime-setting-row, .runtime-image-list');
  if(scope)markRuntimeFieldCovered(scope);
});
setupRuntimeFieldActivation();
syncRuntimeInheritedControls();
document.querySelector('#closeHistoryBtn').addEventListener('click',()=>historyDrawer.classList.add('hidden'));
document.addEventListener('click',event=>{if(!event.target.closest('.filter-select'))closeFilterSelects(); if(!event.target.closest('#actionMenu'))closeMenu(); if(!event.target.closest('#accountPopover') && !event.target.closest('[data-context="account"]')) closeAccountPopover(); if(!event.target.closest('#envPopover') && !event.target.closest('[data-context="environment"]')) closeEnvPopover(); if(!event.target.closest('#clusterPopover') && !event.target.closest('[data-context="cluster"]')) closeClusterPopover(); if(!event.target.closest('#compactMorePopover') && !event.target.closest('#primaryMoreBtn')) closeCompactMore();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){closeMenu();closeAccountPopover();closeEnvPopover();closeClusterPopover();closeCompactMore();runtimeClusterAddMenu?.classList.add('hidden');closeRuntimeLevelDropdown();closeModal();closeInstanceDetail();historyDrawer.classList.add('hidden');closeServiceDrawer();closeServiceCreateModal();}});
function setupServiceExposureCardActions(){
  document.querySelectorAll('#serviceExposurePage .service-card').forEach(card=>{
    if(card.querySelector('.service-card-actions'))return;
    const actions=document.createElement('div');
    actions.className='service-card-actions';
    actions.innerHTML=`<button type="button" class="service-add-upstream" aria-label="新增上游接入"><img src="./assets/service-exposure/add.svg" alt=""></button><button type="button" aria-label="设置"><img src="./assets/service-exposure/settings.svg" alt=""></button><button type="button" aria-label="删除"><img src="./assets/service-exposure/delete.svg" alt=""></button><span class="service-tooltip">新增上游接入<i></i></span>`;
    card.append(actions);
  });
}
setupServiceExposureCardActions();
function closeServiceDrawer(){
  serviceDrawer?.classList.add('hidden');
  serviceDrawerBackdrop?.classList.add('hidden');
  serviceDrawer?.setAttribute('aria-hidden','true');
}
function openServiceDrawer(card){
  const name=card.querySelector('strong')?.textContent.trim()||'服务详情';
  const type=card.querySelector('.service-type-pill')?.textContent.trim()||'NodePort';
  const meta=card.querySelector('p')?.textContent.replace(/\s+/g,' ').trim()||'';
  const workloadMatch=meta.match(/工作负载\s+(.+)$/);
  const workloadText=workloadMatch?.[1]||'order-worker 北京.bjyz-1 南京.bjyz-1';
  const clusters=workloadText.match(/(?:北京|南京)?\.?[a-z]+-\d+/gi)||['bjyz-1','njxg-1'];
  const serviceType=type==='ALB'?'LoadBalancer':type;
  const targetWorkload=meta.includes('order-api')?'order-api（Deployment）':'order-worker（Deployment）';
  serviceDrawer.querySelector('#serviceDrawerTitle').textContent=name;
  serviceDrawer.querySelector('#drawerServiceType').textContent=serviceType;
  serviceDrawer.querySelector('#drawerTargetWorkload').textContent=targetWorkload;
  serviceDrawer.querySelector('#drawerPodName').textContent=`group.${name}.K8S.all`;
  serviceDrawer.querySelector('#drawerWorkloadOne').textContent=targetWorkload.replace(/（.*）/,'');
  serviceDrawer.querySelector('#drawerWorkloadTwo').textContent=targetWorkload.replace(/（.*）/,'');
  serviceDrawer.querySelector('#drawerClusterOne').textContent=(clusters[0]||'bjyz-1').replace(/^(北京|南京)\./,'');
  serviceDrawer.querySelector('#drawerClusterTwo').textContent=(clusters[1]||clusters[0]||'njxg-1').replace(/^(北京|南京)\./,'');
  serviceDrawer.querySelector('#drawerServicePort').textContent=type==='ClusterIP'?'80':'8080';
  serviceDrawer.querySelector('#drawerServicePortTwo').textContent=type==='ClusterIP'?'80':'8080';
  serviceDrawer.classList.remove('hidden');
  serviceDrawerBackdrop.classList.remove('hidden');
  serviceDrawer.setAttribute('aria-hidden','false');
}
document.querySelectorAll('#serviceExposurePage .service-card').forEach(card=>card.addEventListener('click',event=>{
  if(event.target.closest('button'))return;
  openServiceDrawer(card);
}));
serviceDrawerBackdrop?.addEventListener('click',closeServiceDrawer);
serviceDrawer?.querySelector('.service-drawer-close')?.addEventListener('click',closeServiceDrawer);
serviceDrawer?.querySelector('.service-drawer-delete')?.addEventListener('click',closeServiceDrawer);
function closeServiceCreateModal(){
  serviceCreateModal?.classList.add('hidden');
  serviceCreateModal?.setAttribute('aria-hidden','true');
}
function setServiceCreateStep(step){
  const modal=serviceCreateModal;
  if(!modal)return;
  const firstStepElements=modal.querySelectorAll('.service-create-scroll > .service-create-section-title,.service-create-scroll > .service-create-group');
  const basicStep=modal.querySelector('#serviceCreateBasicStep');
  const detailStep=modal.querySelector('#serviceCreateDetailStep');
  const confirmStep=modal.querySelector('#serviceCreateConfirmStep');
  firstStepElements.forEach(item=>item.classList.toggle('hidden',step!==1));
  basicStep?.classList.toggle('hidden',step!==2);
  detailStep?.classList.toggle('hidden',step!==3);
  confirmStep?.classList.toggle('hidden',step!==4);
  modal.querySelectorAll('.service-create-steps > div').forEach((item,index)=>item.classList.toggle('is-active',index===step-1));
  modal.querySelectorAll('[data-create-step-indicator]').forEach(indicator=>{
    const indicatorStep=Number(indicator.dataset.createStepIndicator||0);
    indicator.parentElement.classList.toggle('is-complete',indicatorStep<step);
    indicator.textContent=indicatorStep<step?'✓':String(indicatorStep);
  });
  modal.querySelector('.service-create-prev')?.classList.toggle('hidden',step===1);
  modal.querySelector('.service-create-next').textContent=step===4?'发起操作':'下一步';
  modal.dataset.step=String(step);
}
function openServiceCreateModal(){
  setServiceCreateStep(1);
  serviceCreateModal?.classList.remove('hidden');
  serviceCreateModal?.setAttribute('aria-hidden','false');
}
document.querySelector('.service-primary-action')?.addEventListener('click',openServiceCreateModal);
serviceCreateModal?.querySelector('.service-create-close')?.addEventListener('click',closeServiceCreateModal);
serviceCreateModal?.querySelector('.service-create-cancel')?.addEventListener('click',closeServiceCreateModal);
serviceCreateModal?.querySelector('.service-create-prev')?.addEventListener('click',()=>{
  const step=Number(serviceCreateModal.dataset.step||1);
  setServiceCreateStep(Math.max(step-1,1));
});
serviceCreateModal?.querySelector('.service-create-next')?.addEventListener('click',()=>{
  const step=Number(serviceCreateModal.dataset.step||1);
  if(step===1&&!serviceCreateModal.querySelector('.service-create-option.is-selected')){
    const toast=serviceCreateModal.querySelector('#serviceCreateToast');
    toast.classList.remove('hidden');
    window.setTimeout(()=>toast.classList.add('hidden'),1800);
    return;
  }
  if(step===4){ serviceCreateModal.classList.add('hidden'); return; }
  setServiceCreateStep(Math.min(step+1,4));
});
serviceCreateModal?.addEventListener('click',event=>{if(event.target===serviceCreateModal)closeServiceCreateModal();});
serviceCreateModal?.querySelectorAll('.service-create-option').forEach(option=>option.addEventListener('click',()=>{
  const wasSelected=option.classList.contains('is-selected');
  serviceCreateModal.querySelectorAll('.service-create-option').forEach(item=>item.classList.remove('is-selected'));
  if(!wasSelected)option.classList.add('is-selected');
}));
serviceCreateModal?.querySelectorAll('[data-create-toggle]').forEach(toggle=>toggle.addEventListener('click',()=>{
  const isOn=toggle.classList.toggle('is-on');
  toggle.setAttribute('aria-pressed',String(isOn));
  const target=toggle.dataset.createToggle==='name'
    ? serviceCreateModal.querySelector('#serviceCreateName')
    : serviceCreateModal.querySelector('#serviceCreateCluster');
  if(target)target.disabled=isOn;
}));
serviceCreateModal?.addEventListener('click',event=>{
  const addButton=event.target.closest('.service-port-add');
  if(addButton){
    const table=serviceCreateModal.querySelector('.service-port-table');
    const rowCount=table?.querySelectorAll('.service-port-row:not(.service-port-head)').length||0;
    const row=document.createElement('div');
    row.className='service-port-row';
    row.setAttribute('role','row');
    row.innerHTML=`<input aria-label="端口名称 ${rowCount+1}" placeholder="http"><input aria-label="对外端口号 ${rowCount+1}" inputmode="numeric"><input aria-label="目标端口名称 ${rowCount+1}" placeholder="http"><button class="service-port-delete" type="button" aria-label="删除端口映射 ${rowCount+1}">⌫</button>`;
    table?.append(row);
    return;
  }
  const deleteButton=event.target.closest('.service-port-delete');
  if(deleteButton){
    const row=deleteButton.closest('.service-port-row');
    if(serviceCreateModal.querySelectorAll('.service-port-row:not(.service-port-head)').length>1)row?.remove();
  }
});
renderClusterFilterOptions(); renderHistory(); render(); renderAppNavigation();
document.querySelectorAll('#runtimePage .runtime-row-hint use, #runtimePage .runtime-build-inline > span use').forEach(use=>use.setAttribute('href','#i-runtime-warning-hint'));
