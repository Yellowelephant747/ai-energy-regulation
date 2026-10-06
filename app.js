'use strict';
const base=window.EXPLORER_DATA;
const riskCategoryByTitle = {
  "Accuracy": "Evidence & accuracy",
  "Record integrity": "Evidence & accuracy",
  "Explainability": "Evidence & accuracy",
  "Confidentiality": "Information & trust",
  "Transparency": "Information & trust",
  "Public trust": "Information & trust",
  "Bias": "People & fairness",
  "Over-reliance": "People & fairness",
  "Procurement risk": "Skills & suppliers",
  "Capacity gap": "Skills & suppliers"
};

base.risks = base.risks.map(risk => ({
  ...risk,
  category: risk.category || riskCategoryByTitle[risk.title]
}));
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const statuses=['Operational','Developing','Pilot/Experimental','Governance','Adjacent/Research','Not established'];
const examples=structuredClone(base.examples);
let view='examples';
function message(t){$('#message').textContent=t;}
function options(select,values,all){const previous=select.value;select.innerHTML=(all?'<option value="">'+esc(all)+'</option>':'')+values.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');if(values.includes(previous))select.value=previous;}
function populate(){options($('#category'),base.categories,'All categories');for(const key of ['regulator','country','audience','status']){const values=key==='audience'?['Internal','Public-facing','Sector-facing','Not established']:key==='status'?statuses:[...new Set(examples.map(e=>e[key]))].sort();options($('#'+key),values,'All '+({regulator:'regulators',country:'regions',audience:'audiences',status:'statuses'}[key]));}$('#total').textContent=examples.length;}
function sourceLinks(e){return e.sources.map(s=>{let valid=false;try{valid=['https:','http:'].includes(new URL(s.url).protocol);}catch{}return valid?`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label||'Source')} (opens in new tab)</a>`:esc(s.label||'No valid link supplied');}).join('<br>')||'No link provided in the document.';}
function card(e){return `<article class="card" style="--branch:${palette[Math.max(0,base.categories.indexOf(e.category))%palette.length]}"><p class="meta">${esc(e.country)}</p><span class="badge" data-status="${esc(e.status)}">${esc(e.status)}</span><h3>${esc(e.tool)}</h3><div class="regulator">${esc(e.regulator)}</div><p>${esc(e.description)}</p><details><summary>Explore details</summary><h4>Relevance for regulators</h4><p>${esc(e.usp)}</p><p class="editorial-note">Potential relevance; outcomes depend on how the tool is used.</p>${e.regulatorQuestion?`<h4>Question to ask before adopting</h4><p>${esc(e.regulatorQuestion)}</p>`:''}<h4>What the evidence shows</h4><p>${esc(e.statusNote)}</p><h4>Audience</h4><p>${esc(e.audience.join(' · ')||'Not established by the reviewed sources')}</p><h4>Source</h4><p>${sourceLinks(e)}</p><p>${esc(e.sourceRef)}</p><p>${esc(e.origin==='Reviewed research'?(e.evidenceLabel||'Reviewed research')+' · Reviewed '+e.reviewedDate:e.origin==='Research document'?'Original document entry; not updated':'Locally added or edited entry; review its evidence before use')}</p></details></article>`;}
function renderCards(){const isExample=view==='examples',isRisk=view==='risks';$('#filter-panel').hidden=isRisk;$$('.example-filter').forEach(e=>e.hidden=!isExample);$$('nav button').forEach(b=>{if(b.dataset.view===view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});$('#view-title').textContent=isExample?'AI in practice':isRisk?'Using AI responsibly':'Where AI could help';$('#view-description').textContent=isExample?'Discover how regulators are using and testing AI.':isRisk?'Explore four themes to understand the risks and how they can be managed.':'Explore where AI could help. These opportunities are not necessarily in use today.';
if(isRisk){$('#count').textContent=base.risks.length+' risk areas';$('#results').innerHTML='<div class="principle">AI can support preparatory, analytical and administrative work. Humans remain responsible for judgement, interpretation and decisions.</div><div class="grid">'+base.risks.map((r,i)=>`<article class="card" style="--branch:${palette[riskCategories.indexOf(r.category)]}"><p class="meta">${esc(r.category)}</p><h3>${esc(r.title)}</h3><p>${esc(r.why)}</p><div class="risk-box"><strong>How the risk can be managed</strong>${esc(r.action)}</div></article>`).join('')+'</div>';return;}
const q=$('#search').value.trim().toLowerCase();const list=(isExample?examples:base.usecases).filter(e=>(!q||JSON.stringify(e).toLowerCase().includes(q))&&(!$('#category').value||e.category===$('#category').value)&&(!isExample||['regulator','country','status','audience'].every(k=>!$('#'+k).value||(k==='audience'?(e.audience.length?e.audience:['Not established']).includes($('#'+k).value):e[k]===$('#'+k).value))));$('#count').textContent=list.length+' of '+(isExample?examples.length:base.usecases.length)+(isExample?' examples':' use cases');
$('#results').innerHTML=list.length?base.categories.map(c=>{const rows=list.filter(e=>e.category===c);return rows.length?`<h3 class="category-heading" style="--branch:${palette[Math.max(0,base.categories.indexOf(c))%palette.length]}">${esc(c)} <span>${rows.length}</span></h3><p class="category-description">${esc(base.categoryDescriptions?.[c]||'')}</p><div class="grid">${rows.map(e=>isExample?card(e):`<article class="card"><h3>${esc(e.title)}</h3><p>${esc(e.description)}</p><div class="risk-box"><strong>Key risk</strong>${esc(e.risk)}</div></article>`).join('')}</div>`:'';}).join(''):'<div class="empty"><h3>No matching results</h3><p>Try another term or clear the filters.</p></div>';}
$$('nav button').forEach(b=>b.addEventListener('click',()=>{view=b.dataset.view;render();}));$('#search').addEventListener('input',render);$$('.filters select').forEach(s=>s.addEventListener('change',render));$('#clear').onclick=()=>{$('#search').value='';$$('.filters select').forEach(s=>s.value='');render();};

const riskCategories=["Evidence & accuracy", "People & fairness", "Information & trust", "Skills & suppliers"];
let presentation='map',mapScale=1,mapX=0,mapY=0,mapWidth=1800,mapHeight=1300,overviewScale=1,focusedArea=null;let branchBounds={};
const palette=['#00B8BE','#F79433','#97CB64','#007AA4','#F15A29','#FFE22E','#C03E29','#004279'];
function filteredRecords(){const q=$('#search').value.trim().toLowerCase();return (view==='examples'?examples:base.usecases).filter(e=>(!q||JSON.stringify(e).toLowerCase().includes(q))&&(!$('#category').value||e.category===$('#category').value)&&(view!=='examples'||['regulator','country','status','audience'].every(k=>!$('#'+k).value||(k==='audience'?(e.audience.length?e.audience:['Not established']).includes($('#'+k).value):e[k]===$('#'+k).value))));}
function render(){focusedArea=null;showArea(null);renderCards();drawMap();}
function transformMap(){$('#map-world').style.transform=`translate(${mapX}px,${mapY}px) scale(${mapScale})`;}
function fitMap(){const rect=$('#map-viewport').getBoundingClientRect();if(!rect.width||!rect.height)return;mapScale=Math.min(1,(rect.width-36)/mapWidth,(rect.height-105)/mapHeight);mapScale=Math.max(.12,mapScale);overviewScale=mapScale;mapX=(rect.width-mapWidth*mapScale)/2;mapY=(rect.height-mapHeight*mapScale)/2;transformMap();}
function showArea(name){const panel=$('#area-explainer');panel.hidden=!name||view==='risks';$('#area-title').textContent=name||'';$('#area-description').textContent=base.categoryDescriptions?.[name]||'';}
function returnToOverview(){focusedArea=null;showArea(null);if($('#category').value){$('#category').value='';renderCards();drawMap();}else fitMap();}
function focusArea(name){const b=branchBounds[name];if(!b)return;focusedArea=name;showArea(name);$('#filter-panel').scrollTop=0;const r=$('#map-viewport').getBoundingClientRect();mapScale=Math.max(.12,Math.min(1.35,(r.width-48)/b.width,(r.height-105)/b.height));mapX=r.width/2-b.x*mapScale;mapY=(r.height-50)/2-b.y*mapScale;transformMap();}
function zoomMap(factor,anchor){const r=$('#map-viewport').getBoundingClientRect();const next=Math.max(.12,Math.min(2,mapScale*factor));if(factor<1&&(focusedArea||$('#category').value)&&next<=overviewScale*1.15){returnToOverview();return;}const x=anchor?.x??r.width/2,y=anchor?.y??r.height/2;mapX=x-(x-mapX)*next/mapScale;mapY=y-(y-mapY)*next/mapScale;mapScale=next;transformMap();}
function drawMap(){if(presentation!=='map')return;branchBounds={};const records=view==='risks'?base.risks:filteredRecords();let groups=view==='risks'?riskCategories.map(name=>({name,rows:records.filter(r=>r.category===name)})):base.categories.map(name=>({name,rows:records.filter(e=>e.category===name)})).filter(g=>g.rows.length||(!$('#category').value&&!$('#search').value&&view==='examples'));const left=[],right=[];let lh=0,rh=0;for(const g of groups){g.height=Math.max(135,g.rows.length*140);if(lh<=rh){left.push(g);lh+=g.height+50;}else{right.push(g);rh+=g.height+50;}}mapHeight=Math.max(550,lh,rh)+80;mapWidth=1800;const center={x:900,y:mapHeight/2};const world=$('#map-world');world.style.width=mapWidth+'px';world.style.height=mapHeight+'px';const canvas=$('#connections');canvas.width=mapWidth;canvas.height=mapHeight;const ctx=canvas.getContext('2d');const nodes=[];function node(x,y,label,sub,kind,key,color){nodes.push(`<button class="map-node ${kind}" style="left:${x}px;top:${y}px;--branch:${color||'#007f83'}" data-kind="${kind}" data-key="${esc(key)}">${esc(label)}<small>${esc(sub)}</small></button>`);}function line(x1,y1,x2,y2,color){ctx.beginPath();ctx.moveTo(x1,y1);ctx.bezierCurveTo((x1+x2)/2,y1,(x1+x2)/2,y2,x2,y2);ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();}node(center.x,center.y,'AI in Energy Regulation',view==='risks'?'10 risks · 4 themes':records.length+(view==='examples'?' research examples':' potential use cases'),'root','');
for(const [side,total] of [[left,lh],[right,rh]]){const isLeft=side===left;let top=(mapHeight-total+50)/2;for(const g of side){const color=palette[Math.max(0,(view==='risks'?riskCategories:base.categories).indexOf(g.name))%palette.length];const gx=isLeft?570:1230,gy=top+g.height/2;branchBounds[g.name]={x:isLeft?355:1445,y:gy,width:710,height:Math.max(250,g.height+30)};line(center.x,center.y,gx,gy,color);node(gx,gy,g.name,g.rows.length+(view==='examples'?' examples':view==='risks'?' safeguards':' opportunities'),'category',g.name,color);g.rows.forEach((e,i)=>{const x=isLeft?190:1610,y=top+70+i*140;line(gx,gy,x,y,color);node(x,y,e.tool||e.title,e.country?e.country+' · '+e.status:view==='risks'?'View safeguard':'View opportunity & risk','record',e.id||e.title,color);});top+=g.height+50;}}
$('#map-nodes').innerHTML=records.length?nodes.join(''):'<div class="empty"><h3>No matching records</h3><p>Clear the filters to explore the full map.</p></div>';fitMap();}
function setPresentation(next){presentation=next;document.body.classList.toggle('map-mode',next==='map');$('#map-view').setAttribute('aria-pressed',next==='map');$('#cards-view').setAttribute('aria-pressed',next==='cards');if(next==='map'){focusedArea=null;showArea(null);drawMap();}}
$('#map-view').onclick=()=>setPresentation('map');$('#cards-view').onclick=()=>setPresentation('cards');$('#zoom-in').onclick=()=>zoomMap(1.3);$('#zoom-out').onclick=()=>zoomMap(1/1.3);$('#map-fit').onclick=returnToOverview;$('#area-back').onclick=returnToOverview;
$('#map-nodes').onclick=event=>{const n=event.target.closest('button');if(!n)return;if(n.dataset.kind==='root'){returnToOverview();return;}if(n.dataset.kind==='category'){focusArea(n.dataset.key);return;}const e=(view==='examples'?examples:view==='risks'?base.risks:base.usecases).find(e=>(e.id||e.title)===n.dataset.key);if(!e)return;$('#record-content').innerHTML=view==='examples'?card(e):`<article class="card"><p class="meta">${esc(view==='risks'?'Risks & Governance':e.category)}</p><h3>${esc(e.title)}</h3><p>${esc(e.description||e.why)}</p><div class="risk-box"><strong>${view==='risks'?'How the risk can be managed':'Key risk'}</strong>${esc(e.risk||e.action)}</div><p class="meta">Based on the research reviewed for this explorer.</p></article>`;const details=$('#record-content details');if(details)details.open=true;$('#record-dialog').showModal();};$('#record-close').onclick=()=>$('#record-dialog').close();
// Pan the map without starting native text selection.
let drag = null;
const mapViewport = $('#map-viewport');
mapViewport.onpointerdown = event => {
  if (!event.isPrimary || event.button !== 0 || event.target.closest('button')) return;
  event.preventDefault();
  const selection = window.getSelection();
  if (selection?.anchorNode && mapViewport.contains(selection.anchorNode)) selection.removeAllRanges();
  drag = { x: event.clientX, y: event.clientY, ox: mapX, oy: mapY, pointerId: event.pointerId };
  mapViewport.classList.add('is-panning');
  mapViewport.setPointerCapture(event.pointerId);
};
mapViewport.onpointermove = event => {
  if (!drag || event.pointerId !== drag.pointerId) return;
  mapX = drag.ox + event.clientX - drag.x;
  mapY = drag.oy + event.clientY - drag.y;
  transformMap();
};
function finishMapPan(event) {
  if (!drag || event.pointerId !== drag.pointerId) return;
  drag = null;
  mapViewport.classList.remove('is-panning');
  if (mapViewport.hasPointerCapture(event.pointerId)) mapViewport.releasePointerCapture(event.pointerId);
}
mapViewport.onpointerup = mapViewport.onpointercancel = mapViewport.onlostpointercapture = finishMapPan;
mapViewport.addEventListener('selectstart', event => event.preventDefault());
$('#map-viewport').onkeydown=event=>{if(event.target.closest('button'))return;const moves={ArrowLeft:[50,0],ArrowRight:[-50,0],ArrowUp:[0,50],ArrowDown:[0,-50]};if(moves[event.key]){event.preventDefault();mapX+=moves[event.key][0];mapY+=moves[event.key][1];transformMap();}if(['+','=','-'].includes(event.key)){event.preventDefault();zoomMap(event.key==='-'?1/1.3:1.3);}};
$('#map-nodes').addEventListener('focusin',event=>{const b=event.target.closest('button');if(!b)return;const r=b.getBoundingClientRect(),v=$('#map-viewport').getBoundingClientRect();if(r.left<v.left||r.right>v.right||r.top<v.top||r.bottom>v.bottom){mapX+=(v.left+v.right-r.left-r.right)/2;mapY+=(v.top+v.bottom-r.top-r.bottom)/2;transformMap();}});
window.addEventListener('resize',()=>{if(presentation==='map'){if(focusedArea)focusArea(focusedArea);else fitMap();}});
$('#map-viewport').addEventListener('wheel',event=>{if(event.ctrlKey||event.metaKey)return;event.preventDefault();const rect=$('#map-viewport').getBoundingClientRect();const units=event.deltaMode===1?16:event.deltaMode===2?rect.height:1;const delta=Math.max(-160,Math.min(160,event.deltaY*units));zoomMap(Math.exp(-delta*.0025),{x:event.clientX-rect.left,y:event.clientY-rect.top});},{passive:false});
populate();render();


// Can also be pasted at the END of the existing app.js, after populate();render();
(() => {
  'use strict';
  if (window.catalogGovernanceInstalled) return;
  const nav = document.querySelector('nav[aria-label="Explorer views"]') || document.querySelector('nav:has([data-view="examples"])');
  if (!nav || typeof renderCards !== 'function' || typeof drawMap !== 'function') {
    throw new Error('Governance extension requires the current catalog app.js and Explorer views navigation.');
  }
  window.catalogGovernanceInstalled = true;
  const policies = () => base.governance || [];
  const isGovernance = () => view === 'governance';
  const counted = (count, noun, plural = noun + 's') => count + ' ' + (count === 1 ? noun : plural);
  const dateElement = document.querySelector('footer p:first-child strong');
  const reviewed = new Date((base.reviewedDate || '') + 'T00:00:00Z');
  if (dateElement && !Number.isNaN(reviewed.getTime())) {
    dateElement.textContent = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(reviewed);
  }
  const originalRenderCards = renderCards;
  const originalDrawMap = drawMap;
  const originalShowArea = showArea;
  const originalMapClick = $('#map-nodes').onclick;
  const categoryLabel = $('#category').closest('label');
  const categoryText = [...categoryLabel.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
  const originalCategoryText = categoryText?.textContent;
  let lastView = null;

  nav.dataset.governanceNav = 'true';
  const risksButton = nav.querySelector('[data-view="risks"]');
  if (risksButton) risksButton.textContent = 'Risks & safeguards';
  const governanceButton = document.createElement('button');
  governanceButton.type = 'button';
  governanceButton.dataset.view = 'governance';
  governanceButton.textContent = 'AI governance';
  nav.append(governanceButton);
  governanceButton.addEventListener('click', () => { view = 'governance'; render(); });

  const scopeLabel = document.createElement('label');
  scopeLabel.hidden = true;
  scopeLabel.textContent = 'Policy applies to';
  const scopeSelect = document.createElement('select');
  scopeSelect.id = 'governance-scope';
  scopeSelect.setAttribute('aria-label', 'Policy applies to');
  scopeLabel.append(scopeSelect);
  $('#filter-panel .filters').append(scopeLabel);
  scopeSelect.addEventListener('change', render);
  const style = document.createElement('style');
  style.textContent = `
    nav[data-governance-nav]{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:4px}
    nav[data-governance-nav] button{min-width:0;white-space:normal}
    .governance-card ul{padding-left:20px;line-height:1.55;font-size:14px}
    .governance-card li{margin-bottom:8px}
  `;
  document.head.append(style);

  function setFilters() {
    const governing = isGovernance();
    document.body.classList.toggle('governance-view', governing);
    scopeLabel.hidden = !governing;
    if (lastView !== view) {
      if (governing) {
        for (const key of ['regulator', 'country']) {
          options($('#' + key), [...new Set(policies().map(p => p[key]))].sort(), key === 'regulator' ? 'All regulators' : 'All countries');
        }
        options($('#category'), [...new Set(policies().map(p => p.policyType))].sort(), 'All policy types');
        options(scopeSelect, [...new Set(policies().flatMap(p => p.scope || []))].sort(), 'All scopes');
      } else {
        populate();
      }
      lastView = view;
    }
    if (categoryText) categoryText.textContent = governing ? 'Policy type' : originalCategoryText;
    if (governing) {
      $('#filter-panel').hidden = false;
      $$('.example-filter').forEach(label => { label.hidden = true; });
      $('#regulator').closest('label').hidden = false;
      $('#country').closest('label').hidden = false;
    }
  }

  function filteredPolicies() {
    const q = $('#search').value.trim().toLowerCase();
    return policies().filter(p =>
      (!q || JSON.stringify(p).toLowerCase().includes(q)) &&
      (!$('#category').value || p.policyType === $('#category').value) &&
      (!$('#regulator').value || p.regulator === $('#regulator').value) &&
      (!$('#country').value || p.country === $('#country').value) &&
      (!scopeSelect.value || (p.scope || []).includes(scopeSelect.value))
    );
  }

  function policyCard(p) {
    const list = values => '<ul>' + (values || []).map(value => '<li>' + esc(value) + '</li>').join('') + '</ul>';
    return `<article class="card governance-card" style="--branch:${palette[0]}">
      <p class="meta">${esc(p.country)} · ${esc(p.policyType)}</p>
      <span class="badge" data-status="Governance">${esc(p.status)}</span>
      <h3>${esc(p.title)}</h3><div class="regulator">${esc(p.regulator)}</div>
      <p>${esc(p.description)}</p><p class="meta">Applies to: ${esc((p.scope || []).join(' · '))}</p>
      <details><summary>Explore policy</summary>
        <h4>Permitted uses</h4>${list(p.permittedUses)}
        <h4>Restrictions</h4>${list(p.restrictions)}
        <h4>Human review</h4><p>${esc(p.humanOversight)}</p>
        <h4>Disclosure</h4><p>${esc(p.disclosure)}</p>
        <h4>Tools mentioned</h4><p>${esc((p.toolsMentioned || []).join(' · ') || 'No named tools in the reviewed evidence.')}</p>
        <h4>Dates</h4><p>Effective: ${esc(p.effectiveDate || 'Not stated')}<br>Reviewed: ${esc(p.reviewedDate)}</p>
        ${p.effectiveDateNote ? `<p>${esc(p.effectiveDateNote)}</p>` : ''}
        <h4>Evidence limits</h4><p>${esc(p.evidenceLimit)}</p>
        <h4>Original policy and sources</h4><p>${sourceLinks(p)}</p><p>${esc(p.sourceRef)}</p>
      </details></article>`;
  }

  renderCards = function () {
    if (!isGovernance()) {
      setFilters();
      originalRenderCards();
      return;
    }
    setFilters();
    $$('nav button').forEach(button => {
      if (button.dataset.view === view) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    $('#view-title').textContent = 'AI governance catalog';
    $('#view-description').textContent = 'Compare regulator policies for staff, utilities and participants. Each entry identifies who it applies to.';
    const rows = filteredPolicies();
    $('#count').textContent = rows.length + ' of ' + counted(policies().length, 'policy', 'policies');
    $('#results').innerHTML = rows.length
      ? '<div class="grid">' + rows.map(policyCard).join('') + '</div>'
      : '<div class="empty"><h3>No matching policies</h3><p>Try another term or clear the filters.</p></div>';
  };

  showArea = function (name) {
    if (!isGovernance()) { originalShowArea(name); return; }
    $('#area-explainer').hidden = !name;
    $('#area-title').textContent = name || '';
    $('#area-description').textContent = name ? 'Select a policy to view its scope, restrictions and original sources.' : '';
  };

  drawMap = function () {
    if (!isGovernance()) { originalDrawMap(); return; }
    if (presentation !== 'map') return;
    const records = filteredPolicies();
    const groups = [...new Set(records.map(p => p.regulator))].map(name => ({ name, rows: records.filter(p => p.regulator === name) }));
    branchBounds = {};
    const left = [], right = [];
    let lh = 0, rh = 0;
    for (const group of groups) {
      group.height = Math.max(135, group.rows.length * 140);
      if (lh <= rh) { left.push(group); lh += group.height + 50; }
      else { right.push(group); rh += group.height + 50; }
    }
    mapHeight = Math.max(550, lh, rh) + 80;
    mapWidth = right.length ? 1800 : 1200;
    const center = { x: 900, y: mapHeight / 2 };
    $('#map-world').style.width = mapWidth + 'px';
    $('#map-world').style.height = mapHeight + 'px';
    const canvas = $('#connections');
    canvas.width = mapWidth; canvas.height = mapHeight;
    const context = canvas.getContext('2d');
    const nodes = [];
    function node(x, y, label, sub, kind, key, color) {
      nodes.push(`<button class="map-node ${kind}" style="left:${x}px;top:${y}px;--branch:${color || palette[0]}" data-kind="${kind}" data-key="${esc(key)}">${esc(label)}<small>${esc(sub)}</small></button>`);
    }
    function line(x1, y1, x2, y2, color) {
      context.beginPath(); context.moveTo(x1, y1);
      context.bezierCurveTo((x1 + x2) / 2, y1, (x1 + x2) / 2, y2, x2, y2);
      context.strokeStyle = color; context.lineWidth = 2; context.stroke();
    }
    node(center.x, center.y, 'AI governance', counted(records.length, 'policy', 'policies') + ' · ' + counted(groups.length, 'regulator'), 'root', '');
    for (const [side, total] of [[left, lh], [right, rh]]) {
      const isLeft = side === left;
      let top = (mapHeight - total + 50) / 2;
      for (const group of side) {
        const color = palette[groups.indexOf(group) % palette.length];
        const gx = isLeft ? 570 : 1230, gy = top + group.height / 2;
        branchBounds[group.name] = { x: isLeft ? 355 : 1445, y: gy, width: 710, height: Math.max(250, group.height + 30) };
        line(center.x, center.y, gx, gy, color);
        node(gx, gy, group.name, counted(group.rows.length, 'policy', 'policies'), 'category', group.name, color);
        group.rows.forEach((policy, i) => {
          const x = isLeft ? 190 : 1610, y = top + 70 + i * 140;
          line(gx, gy, x, y, color);
          node(x, y, policy.title, (policy.scope || []).join(' · '), 'record', policy.id, color);
        });
        top += group.height + 50;
      }
    }
    $('#map-nodes').innerHTML = records.length ? nodes.join('') : '<div class="empty"><h3>No matching policies</h3><p>Clear the filters to explore all policies.</p></div>';
    fitMap();
  };

  $('#map-nodes').onclick = event => {
    if (!isGovernance()) { originalMapClick(event); return; }
    const node = event.target.closest('button');
    if (!node) return;
    if (node.dataset.kind === 'root') { returnToOverview(); return; }
    if (node.dataset.kind === 'category') { focusArea(node.dataset.key); return; }
    const policy = policies().find(p => p.id === node.dataset.key);
    if (!policy) return;
    $('#record-content').innerHTML = policyCard(policy);
    $('#record-content details').open = true;
    $('#record-dialog').showModal();
  };
  render();
})();
