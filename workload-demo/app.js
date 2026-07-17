const pods = [
  ['…nference-5f6b9-1234d','running','192.168.10.18','grpc:8500','ENS','7','3d','99%','9.7Gi'],
  ['…nference-5f6b9-p9wd','running','192.168.10.18','grpc:8500','ENS','5','7d','85%','9.1Gi'],
  ['…nference-5f6b9-p1234','running','192.168.10.18','grpc:8500 +1','ENS','5','8d','91%','9.6Gi'],
  ['…nference-51234-p9wqa','blocked','192.168.10.18','grpc:8500 +1','ENS','4','8d','91%','9.4Gi'],
  ['…nference-12349-p9wqd','blocked','192.168.10.18','grpc:8500 +1','ENS','2','8d','12%','2.3Gi'],
  ['…nference-12349-p9wqd','running','192.168.10.18','grpc:8500 +1','ENS','1','1h','12%','2.1Gi'],
  ['…nference-12349-p9wqd','running','192.168.10.18','grpc:8500 +1','ALB','1','1h','12%','2.1Gi'],
  ['…nference-12349-p9wqd','error','192.168.10.18','grpc:8500 +2','-','1','6d','8%','1.2Gi'],
  ['…nference-5f6b9-p9wqa','running','192.168.10.19','grpc:8500','ENS','1','6d','22%','3.2Gi'],
  ['…nference-5f6b9-p9wqb','running','192.168.10.20','grpc:8500','ENS','1','6d','18%','2.8Gi'],
  ['…nference-5f6b9-p9wqc','running','192.168.10.21','grpc:8500','ENS','1','6d','16%','2.6Gi']
];

const state = { status:'all', cluster:'all', query:'', page:1, pageSize:10, collapsed:false };
const labels = { running:'运行中', error:'异常', blocked:'等待中' };
const rows = document.querySelector('#podRows');
const pagination = document.querySelector('#pagination');

function filteredPods(){
  return pods.filter(pod => (state.status === 'all' || pod[1] === state.status) && (!state.query || pod[0].toLowerCase().includes(state.query) || pod[2].includes(state.query)));
}

const icon = name => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;

function rowMarkup(pod){
  const [name,status,ip,port,exposure,restarts,age,cpu,memory] = pod;
  const hot = parseInt(cpu,10) >= 80 ? 'metric-hot' : 'metric-cool';
  const actions = [
    ['power','重启'], ['refresh','删除/重建'], ['apps','屏蔽'],
    ['unfold','接流'], ['user','临时授权'], ['more','更多操作']
  ].map(([iconName,label])=>`<button type="button" aria-label="${label}" title="${label}">${icon(iconName)}</button>`).join('');
  return `<tr><td><input type="checkbox" aria-label="选择 ${name}"></td><td title="${name}">${name}</td><td><span class="status-tag ${status}">${labels[status]}</span></td><td>${ip}</td><td>${port}</td><td><span class="exposure-dot"></span>${exposure}</td><td class="${restarts >= 4 ? 'metric-hot' : ''}">${restarts}</td><td>${age}</td><td class="${hot}"><span class="cpu-mark">${icon('cpu')}</span>${cpu}</td><td><span class="memory-mark">${icon('memory')}</span>${memory}</td><td><span class="row-actions">${actions}</span></td></tr>`;
}

function render(){
  const result = filteredPods();
  const pageCount = Math.max(1,Math.ceil(result.length/state.pageSize));
  state.page = Math.min(state.page,pageCount);
  const visible = result.slice((state.page-1)*state.pageSize,state.page*state.pageSize);
  rows.innerHTML = visible.map(rowMarkup).join('');
  document.querySelector('#podCount').textContent = result.length;
  document.querySelector('#allCount').textContent = String(pods.length).padStart(2,'0');
  document.querySelector('#runningCount').textContent = String(pods.filter(p=>p[1]==='running').length).padStart(2,'0');
  document.querySelector('#errorCount').textContent = String(pods.filter(p=>p[1]==='error').length).padStart(2,'0');
  document.querySelector('#blockedCount').textContent = String(pods.filter(p=>p[1]==='blocked').length).padStart(2,'0');
  document.querySelector('#emptyState').classList.toggle('hidden',result.length!==0);
  document.querySelector('#workloadGroup').classList.toggle('hidden',result.length===0);
  if(result.length<=state.pageSize){ pagination.innerHTML=''; return; }
  const buttons=Array.from({length:pageCount},(_,index)=>`<button class="page-btn ${index+1===state.page?'current':''}" data-page="${index+1}">${index+1}</button>`).join('');
  pagination.innerHTML=`<button class="page-btn" data-page="prev" aria-label="上一页" ${state.page===1?'disabled':''}>${icon('chevron-right')}</button>${buttons}<button class="page-btn" data-page="next" aria-label="下一页" ${state.page===pageCount?'disabled':''}>${icon('chevron-right')}</button><select class="page-size" aria-label="每页条数"><option value="10" ${state.pageSize===10?'selected':''}>10 条/页</option><option value="20" ${state.pageSize===20?'selected':''}>20 条/页</option></select>`;
}

function setCollapsed(collapsed){
  state.collapsed=collapsed;
  document.querySelector('#tableRegion').classList.toggle('hidden',collapsed);
  const toggle=document.querySelector('#groupToggle');
  toggle.innerHTML=icon(collapsed?'chevron-right':'chevron-down');
  toggle.setAttribute('aria-label',collapsed?'展开':'收起');
}

function toast(message){const el=document.querySelector('#toast');el.textContent=message;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1400)}

document.querySelectorAll('.tabs button').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('.tabs button').forEach(item=>item.classList.toggle('active',item===button));
  state.status=button.dataset.status;state.page=1;document.querySelector('#statusSelect').value=state.status;render();
}));
document.querySelector('#statusSelect').addEventListener('change',event=>{state.status=event.target.value;state.page=1;document.querySelectorAll('.tabs button').forEach(item=>item.classList.toggle('active',item.dataset.status===state.status));render()});
document.querySelector('#clusterSelect').addEventListener('change',event=>{state.cluster=event.target.value;state.page=1;render()});
document.querySelector('#searchInput').addEventListener('input',event=>{state.query=event.target.value.trim().toLowerCase();state.page=1;render()});
document.querySelector('#groupToggle').addEventListener('click',()=>setCollapsed(!state.collapsed));
document.querySelector('#collapseAllBtn').addEventListener('click',()=>setCollapsed(true));
document.querySelector('#expandAllBtn').addEventListener('click',()=>setCollapsed(false));
document.querySelector('#refreshBtn').addEventListener('click',()=>toast('刷新成功'));
pagination.addEventListener('click',event=>{const button=event.target.closest('[data-page]');if(!button)return;const count=Math.max(1,Math.ceil(filteredPods().length/state.pageSize));state.page=button.dataset.page==='prev'?state.page-1:button.dataset.page==='next'?state.page+1:Number(button.dataset.page);state.page=Math.max(1,Math.min(count,state.page));render()});
pagination.addEventListener('change',event=>{if(!event.target.classList.contains('page-size'))return;state.pageSize=Number(event.target.value);state.page=1;render()});
render();
