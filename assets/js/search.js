let SEARCH_INDEX=[];
function searchAdd(items,school,section,view,text){
  if(!text)return;
  let value=Array.isArray(text)?text.join(' '):String(text);
  if(value.trim())items.push({school:school.name,schoolIndex:school._searchIndex,section,view,text:value});
}
function collectSearchStrings(value,out=[]){
  if(Array.isArray(value))value.forEach(v=>collectSearchStrings(v,out));
  else if(isObject(value))Object.values(value).forEach(v=>collectSearchStrings(v,out));
  else if(value!==null&&value!==undefined)out.push(String(value));
  return out;
}
function buildSearchIndex(){
  let items=[];
  (DATA?.schools||[]).forEach((school,i)=>{
    school._searchIndex=i;
    searchAdd(items,school,'School','programs',school.name);
    searchAdd(items,school,'City','location',[school.location?.city,school.location?.state,school.location_intelligence?.city]);
    searchAdd(items,school,'Curriculum','programs',collectSearchStrings(school.scores));
    searchAdd(items,school,'Points of interest','location',school.location_intelligence?.points_of_interest);
    searchAdd(items,school,'LGBTQ/community resources','location',collectSearchStrings([school.location_intelligence?.lgbtq_resources,school.location_intelligence?.dsa_chapters]));
    searchAdd(items,school,'Documentary ecosystem','location',school.documentary_ecosystem);
    searchAdd(items,school,'Alumni outcomes','evidence',collectSearchStrings(school.alumni_current_student_outcomes));
    searchAdd(items,school,'Evidence notes','evidence',collectSearchStrings([school.source_trace,school.public_testimony,school.relationship_tracker,school.contradictions,school.scores]));
  });
  SEARCH_INDEX=items;
}
function searchTerms(query){return [...new Set(query.toLowerCase().split(/\s+/).filter(Boolean))]}
function findTermMatch(clean,terms){
  let hay=clean.toLowerCase(),best=null;
  terms.forEach(term=>{let idx=hay.indexOf(term);if(idx>=0&&(!best||idx<best.idx))best={idx,term}});
  return best;
}
function matchPreview(text,terms){
  let clean=String(text).replace(/\s+/g,' ').trim(),match=findTermMatch(clean,terms);
  if(!match)return clean.slice(0,165);
  let start=Math.max(0,match.idx-58),end=Math.min(clean.length,match.idx+match.term.length+92);
  return (start?'...':'')+clean.slice(start,end)+(end<clean.length?'...':'');
}
function highlightText(text,terms){
  let value=String(text??'');if(!terms.length)return esc(value);
  let re=new RegExp(`(${terms.map(t=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')})`,'ig');
  return value.split(re).map(part=>terms.includes(part.toLowerCase())?`<mark>${esc(part)}</mark>`:esc(part)).join('');
}
function titleCase(text){return String(text).replaceAll('/',' / ').split(/\s+/).filter(Boolean).map(w=>w==='/'?w:w[0].toUpperCase()+w.slice(1).toLowerCase()).join(' ')}
function searchActionLabel(result){return `Open ${result.section==='School'?result.school:titleCase(result.section.replace('LGBTQ/community resources','Community Resources'))}`}
function searchSectionLabel(section){
  let labels={School:'Program record',City:'Environment',Curriculum:'Program structure','Points of interest':'Environmental anchors','LGBTQ/community resources':'Community infrastructure','Documentary ecosystem':'Documentary world','Alumni outcomes':'Outcomes','Evidence notes':'Research record'};
  return labels[section]||titleCase(section);
}
function searchFallbackSnippet(result){
  let fallbacks={School:'School identity matched the query. Open the program record for the full interpretive context.',City:'City and regional context matched the query through the environmental record.',Curriculum:'Program structure matched the query. Open the record for curriculum, mentorship, and fit context.','Points of interest':'Environmental anchor material matched the query through City & Life records.','LGBTQ/community resources':'Community infrastructure matched the query through lived-environment records.','Documentary ecosystem':'Documentary-world context matched the query through professional and regional ecosystem notes.','Alumni outcomes':'Outcome evidence matched the query through alumni or current-student trajectory records.','Evidence notes':'Research material matched the query through documented, inferred, or unresolved evidence.'};
  return fallbacks[result.section]||'ATLAS records matched this query. Open the record for the surrounding context.';
}
function cleanSearchSnippet(text){
  let raw=String(text??'').replace(/[_{}[\]\"'`|]/g,' ');
  raw=raw.replace(/\b(true|false|null|undefined|nan)\b/ig,' ');
  raw=raw.replace(/\b(active seeded|active_seeded|implemented|pending|enabled|disabled|school specific|school_specific)\b/ig,' ');
  raw=raw.replace(/\b(confidence|weight|weighted|score|scalar|value|formula|inputs?|outputs?|subvariables?|schema|status|data model|data_model|metadata|source trace|source_trace)\b\s*[:=]?/ig,' ');
  raw=raw.replace(/\b0?\.\d+\b/g,' ');
  raw=raw.replace(/\b\d+(?:\.\d+)?%?\b/g,m=>/^\d{4}$/.test(m)?m:' ');
  raw=raw.replace(/\s*[:=;,]+\s*/g,' ').replace(/\s+/g,' ').trim();
  let words=raw.split(/\s+/).filter(w=>/[a-z]/i.test(w));
  if(words.length<6)return '';
  if(/\b(true|false|null|undefined|confidence|weighted|subvariables|schema|metadata)\b/i.test(raw))return '';
  return raw;
}
function editorialSearchSnippet(result,terms){
  let cleaned=cleanSearchSnippet(result.text);
  if(!cleaned)return searchFallbackSnippet(result);
  let preview=cleanSearchSnippet(matchPreview(cleaned,terms));
  return preview||searchFallbackSnippet(result);
}
function runGlobalSearch(query){
  let box=document.getElementById('searchResults');if(!box)return;
  let q=query.trim();if(q.length<2){box.style.display='none';box.innerHTML='';return}
  let terms=searchTerms(q);
  let results=SEARCH_INDEX.map(item=>{
    let hay=[item.school,item.section,item.text].join(' ').toLowerCase();
    let score=terms.reduce((n,t)=>n+(hay.includes(t)?1:0),0);
    return score?{...item,score}:null;
  }).filter(Boolean).sort((a,b)=>b.score-a.score||a.school.localeCompare(b.school)).slice(0,18);
  box.innerHTML=results.length?results.map((r,i)=>{
    let snippet=editorialSearchSnippet(r,terms);
    return `<button class="searchResult" onclick="openSearchResult(${i})" data-search-result="${i}"><div class="searchMeta">${highlightText(r.school,terms)} / ${highlightText(searchSectionLabel(r.section),terms)}</div><div class="searchSnippet">${highlightText(snippet,terms)}</div><div class="searchPreview">${highlightText(searchActionLabel(r),terms)}</div></button>`;
  }).join(''):'<div class="searchResult"><div class="searchMeta">No matches</div><div class="searchSnippet">No archival trace surfaced for this query yet.</div><div class="searchPreview">Try a school, city, evidence note, or environmental anchor.</div></div>';
  box._results=results;box.style.display='block';
}
function openSearchResult(index){
  let box=document.getElementById('searchResults'),result=box?._results?.[index];if(!result)return;
  selected=result.schoolIndex;
  setView(result.view);
  let input=document.getElementById('globalSearch');if(input)input.value='';
  box.style.display='none';box.innerHTML='';
}
function initSearch(){
  buildSearchIndex();
  let input=document.getElementById('globalSearch');if(!input)return;
  input.oninput=e=>runGlobalSearch(e.target.value);
  input.onkeydown=e=>{if(e.key==='Escape'){let box=document.getElementById('searchResults');box.style.display='none';box.innerHTML='';input.value=''}};
}
document.addEventListener('click',e=>{let box=document.getElementById('searchResults');if(box&&!e.target.closest('.searchBox'))box.style.display='none'});
function researchImage(s){
  let name=String(s?.name||'');
  let map=[[/wake forest/i,'assets/cities/brookstown.png'],[/stanford/i,'assets/cities/stanford.png'],[/depaul/i,'assets/cities/depaul.png'],[/northwestern/i,'assets/cities/northwestern.png'],[/buffalo/i,'assets/cities/ub.png'],[/ucsc|santa cruz/i,'assets/cities/ucsc.png'],[/ohio/i,'assets/cities/ohiou.png'],[/syracuse/i,'assets/cities/syracuseu.png'],[/temple/i,'assets/cities/temple.png']];
  return (map.find(([re])=>re.test(name))||[])[1]||s?.visual_identity?.photo_local||'';
}
function researchText(value){
  if(value===null||value===undefined)return '';
  if(Array.isArray(value))return value.map(researchText).filter(Boolean).join(' ');
  if(typeof value==='object'){
    let keys=['summary','notes','note','residue','tone','finding','description','text','claim','question','tension','pattern','outcome_pattern','role','person','city','state'];
    let parts=keys.map(k=>researchText(value[k])).filter(Boolean);
    if(!parts.length)parts=Object.values(value).map(researchText).filter(Boolean).slice(0,3);
    return parts.join(' / ');
  }
  let text=researchCopy(String(value).replace(/\s+/g,' ').trim());
  return text==='[object Object]'?'':text;
}
function researchUnique(items,limit=3){
  let seen=new Set();
  return items.map(researchText).map(x=>x.replace(/\s+/g,' ').trim()).filter(x=>x&&x!=='[object Object]'&&!seen.has(x.toLowerCase())&&seen.add(x.toLowerCase())).slice(0,limit);
}
function focusedResearchStyles(){
  if(document.getElementById('focusedResearchStylesV4'))return;
  let style=document.createElement('style');style.id='focusedResearchStylesV4';
  style.textContent='.researchArchive.focused{display:grid;gap:clamp(24px,5vw,64px)}.researchFeatureStack{display:grid;gap:clamp(48px,8vw,98px)}.researchFeature{position:relative;min-height:clamp(860px,98vh,1120px);border:1px solid rgba(255,255,255,.12);border-radius:34px;overflow:hidden;background:#080d17;box-shadow:0 30px 100px rgba(0,0,0,.38)}.researchFeature img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.82;filter:saturate(.86) contrast(1.05)}.researchFeature:before{content:"";position:absolute;inset:0;z-index:1;background:radial-gradient(circle at 25% 70%,rgba(2,6,14,.9),rgba(2,6,14,.58) 36%,rgba(2,6,14,.18) 68%,transparent),linear-gradient(90deg,rgba(2,6,14,.82),rgba(2,6,14,.40) 43%,rgba(2,6,14,.10) 76%,transparent),linear-gradient(180deg,rgba(2,6,14,.02),rgba(2,6,14,.16) 46%,rgba(2,6,14,.82))}.researchFeature:nth-child(even):before{background:radial-gradient(circle at 76% 72%,rgba(2,6,14,.9),rgba(2,6,14,.58) 36%,rgba(2,6,14,.18) 68%,transparent),linear-gradient(270deg,rgba(2,6,14,.82),rgba(2,6,14,.40) 43%,rgba(2,6,14,.10) 76%,transparent),linear-gradient(180deg,rgba(2,6,14,.02),rgba(2,6,14,.16) 46%,rgba(2,6,14,.82))}.researchFeatureBody{position:relative;z-index:2;min-height:inherit;display:flex;align-items:flex-end;padding:clamp(24px,4.4vw,54px)}.researchFeature:nth-child(even) .researchFeatureBody{justify-content:flex-end}.researchFeatureRead{width:min(920px,100%);display:grid;gap:16px;text-shadow:0 3px 24px rgba(0,0,0,.62)}.researchIdentity{display:grid;gap:8px;justify-items:start}.researchFeatureRead h3{margin:0;color:var(--researchAccent,#dce7f7);font-size:clamp(2.5rem,6.4vw,5.5rem);line-height:.9;letter-spacing:-.05em}.researchFeaturePlace{display:block;margin:0;color:#d7e2f1;font-size:.75rem;letter-spacing:.15em;text-transform:uppercase}.researchFeatureSynthesis{margin:0;color:#f5f8ff;font-size:clamp(1.04rem,1.7vw,1.32rem);line-height:1.52;max-width:780px}.researchEvidenceColumn{display:grid;gap:12px;margin-top:2px}.researchEvidenceNote{border-left:1px solid rgba(157,231,215,.30);padding:2px 0 2px 14px;color:#dce7f7;line-height:1.55;background:linear-gradient(90deg,rgba(5,9,20,.22),transparent)}.researchEvidenceNote b,.researchRelational b{display:block;color:#f1f6ff;font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;margin-bottom:6px}.researchThread{border-left-color:rgba(255,214,149,.42)}.researchRelational{border-left:1px solid rgba(132,174,252,.28);padding:3px 0 2px 14px;color:#dce7f7;line-height:1.45;background:linear-gradient(90deg,rgba(8,12,26,.24),transparent)}.researchRelational ul{list-style:none;margin:0;padding:0;display:grid;gap:5px}.researchRelational li{color:rgba(231,238,250,.84)}.researchRelational strong{color:#f6f8ff;font-weight:600}.researchEpistemic{display:inline-block;margin:0 8px 0 0;color:rgba(157,231,215,.78);font-size:.62rem;letter-spacing:.12em;text-transform:uppercase}.researchExpandable{display:grid;gap:8px;margin-top:2px}.researchExpandable details{border-top:1px solid rgba(255,255,255,.10);padding-top:10px}.researchExpandable summary{cursor:pointer;list-style:none;color:#eef4ff;font-size:.72rem;letter-spacing:.13em;text-transform:uppercase}.researchExpandable summary::-webkit-details-marker{display:none}.researchExpandable summary:before{content:"+";display:inline-block;width:18px;color:rgba(157,231,215,.7)}.researchExpandable details[open] summary:before{content:"-"}.researchExpandItems{display:grid;gap:8px;margin:10px 0 2px 18px;color:#dce7f7;line-height:1.48}.researchExpandItem{max-width:760px;color:rgba(231,238,250,.84)}.researchPull{margin:2px 0 0;padding:0 0 0 18px;border-left:2px solid rgba(255,255,255,.26);color:#eef4ff;font-size:clamp(1rem,1.35vw,1.18rem);line-height:1.46;font-style:italic}.researchFeatureMeta{display:flex;gap:16px;flex-wrap:wrap;color:rgba(220,231,247,.74);font-size:.72rem;letter-spacing:.08em;text-transform:uppercase}.researchFeatureMeta span:before{content:"";display:inline-block;width:5px;height:5px;border-radius:50%;background:rgba(157,231,215,.45);margin-right:7px;vertical-align:middle}@media(max-width:760px){.researchFeature{min-height:900px;border-radius:26px}.researchFeature:before,.researchFeature:nth-child(even):before{background:linear-gradient(180deg,rgba(2,6,14,.06),rgba(2,6,14,.42) 28%,rgba(2,6,14,.96))}.researchFeatureBody,.researchFeature:nth-child(even) .researchFeatureBody{justify-content:flex-start;align-items:flex-end;padding:20px}.researchFeatureRead h3{font-size:clamp(2.35rem,14vw,4rem)}}';
  document.head.appendChild(style);
}
function researchCopy(text){return typeof programDossierCopy==='function'?programDossierCopy(text):String(text||'')}
function researchSynthesis(s){
  return researchText(s.scores?.mentorship?.notes||s.scores?.documentary?.notes||s.alumni_current_student_outcomes?.outcome_pattern||s.identity_preservation_analysis?.summary)||'The institutional reading remains open, with evidence still accumulating across mentorship, documentary culture, and lived sustainability.';
}
function researchTraceItems(s,key,limit){return researchUnique(s.source_trace?.[key]||[],limit).map(text=>({type:key,text}))}
function researchOpenThreads(s){
  let items=[];
  researchUnique(s.contradictions||[],2).forEach(text=>items.push({label:'Interpretive tension',type:'contradictory',text,className:'researchThread'}));
  researchTraceItems(s,'unresolved',2).forEach(x=>items.push({label:'Open question',type:'unresolved',text:x.text,className:'researchThread'}));
  if(!items.length)items.push({label:'Open question',type:'unresolved',text:'The central remaining uncertainty is how the documented institutional structure translates into daily creative life.',className:'researchThread'});
  return items.slice(0,3);
}
function researchEvidenceCandidates(s){
  let li=s.location_intelligence||{},scores=s.scores||{},failure=s.failure_modes||{};
  let groups=[
    ['Mentorship dynamics','inferred',[scores.mentorship?.notes,scores.teaching?.notes,researchTraceItems(s,'verified',2).map(x=>x.text)]],
    ['Documentary method','inferred',[scores.documentary?.notes,s.documentary_ecosystem,scores.philosophy?.notes]],
    ['Curricular pressure','inferred',[scores.curriculum?.notes,scores.politics?.notes,scores.competitiveness?.notes]],
    ['Sustainability / labor ecology','inferred',[scores.funding?.notes,failure.financial_stress?.notes,failure.low_energy_period?.notes]],
    ['Environmental implication','inferred',[s.ordinary_tuesday,li.energy_profile,li.city,li.state,scores.livability?.notes]],
    ['Trajectory signal','inferred',[s.alumni_current_student_outcomes?.outcome_pattern,s.identity_preservation_analysis?.summary,researchTraceItems(s,'inferred',2).map(x=>x.text)]],
    ['Confidence limitation','unresolved',[researchTraceItems(s,'speculative',2).map(x=>x.text),researchTraceItems(s,'unresolved',2).map(x=>x.text)]]
  ];
  return groups.map(([label,type,values])=>({label,type,text:researchUnique(values.flat?values.flat(3):values,1)[0]})).filter(x=>x.text);
}
function researchDedupeBlocks(items,limit=5){
  let seen=new Set(),out=[];
  items.forEach(item=>{
    let label=item.label,type=item.type||'inferred',className=item.className;
    let text=researchText(item.text);
    let key=text.toLowerCase();
    if(label&&text&&key&&!seen.has(key)){seen.add(key);out.push({label,type,text,className});}
  });
  return out.slice(0,limit);
}
function researchRelationSignals(s,limit=4){
  return (s.relationship_tracker||[]).map(x=>{
    let person=researchText(x.person)||researchText(x.role)||'Institutional contact';
    let tone=researchText(x.tone),residue=researchText(x.residue),role=researchText(x.role);
    let text=[tone,residue].filter(Boolean).join(' - ');
    return {person,role,text:text||role,type:'direct contact'};
  }).filter(x=>x.person&&x.text).slice(0,limit);
}
function researchExpandItem(item){return `<div class="researchExpandItem"><span class="researchEpistemic">${esc(item.type||'inferred')}</span>${esc(researchText(item.text))}</div>`}
function researchExpandableSection(title,items){
  let clean=researchDedupeBlocks(items.map(x=>({label:title,type:x.type,text:x.text})),8);
  if(!clean.length)return '';
  return `<details><summary>${esc(title)}</summary><div class="researchExpandItems">${clean.map(researchExpandItem).join('')}</div></details>`;
}
function researchExpandableSections(s){
  let scores=s.scores||{},failure=s.failure_modes||{};
  let sections=[
    ['Evidence fragments',[...researchTraceItems(s,'verified',3),...researchTraceItems(s,'inferred',3),...researchUnique(s.public_testimony||[],2).map(text=>({type:'anecdotal',text}))]],
    ['Unresolved questions',[...researchTraceItems(s,'unresolved',4),...researchUnique(s.contradictions||[],3).map(text=>({type:'contradictory',text}))]],
    ['Curriculum interpretation',[scores.curriculum?.notes,scores.teaching?.notes,scores.philosophy?.notes].map(text=>({type:'inferred',text}))],
    ['Documentary-world placement',[scores.documentary?.notes,s.documentary_ecosystem].map(text=>({type:'inferred',text}))],
    ['Environmental / labor implications',[scores.funding?.notes,scores.livability?.notes,failure.financial_stress?.notes,failure.low_energy_period?.notes,s.ordinary_tuesday].map(text=>({type:'inferred',text}))],
    ['Alumni and trajectory signals',[s.alumni_current_student_outcomes?.outcome_pattern,s.identity_preservation_analysis?.summary].map(text=>({type:'inferred',text}))],
    ['Relational evidence',researchRelationSignals(s,8).map(x=>({type:'direct contact',text:`${x.person}: ${x.text}`}))]
  ];
  return sections.map(([title,items])=>researchExpandableSection(title,items)).join('');
}
function researchFeatureCard(s,i){
  let c=s.brand_colors||{},loc=s.location_intelligence||s.location||{},trace=s.source_trace||{},fallback=s.visual_identity?.photo_local||'';
  let evidence=researchDedupeBlocks(researchEvidenceCandidates(s),4);
  let threads=researchDedupeBlocks(researchOpenThreads(s),2);
  let relations=researchRelationSignals(s,3);
  let used=new Set([researchText(researchSynthesis(s)).toLowerCase(),...evidence.map(x=>x.text.toLowerCase()),...threads.map(x=>x.text.toLowerCase())]);
  let test=researchUnique(s.public_testimony||[],2).find(x=>!used.has(x.toLowerCase()))||'';
  return `<section class="researchFeature" style="--researchAccent:${c.accent||'#dce7f7'}"><img src="${researchImage(s)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${esc(fallback)}'"><div class="researchFeatureBody"><div class="researchFeatureRead"><div class="researchIdentity"><h3>${esc(s.name)}</h3><div class="researchFeaturePlace">${esc(loc.city||s.location?.city||'')}</div></div><p class="researchFeatureSynthesis">${esc(researchSynthesis(s))}</p><div class="researchEvidenceColumn">${evidence.map(x=>`<div class="researchEvidenceNote"><b>${esc(x.label)}</b><span class="researchEpistemic">${esc(x.type)}</span>${esc(x.text)}</div>`).join('')}${threads.map(x=>`<div class="researchEvidenceNote ${esc(x.className||'')}"><b>${esc(x.label)}</b><span class="researchEpistemic">${esc(x.type)}</span>${esc(x.text)}</div>`).join('')}${relations.length?`<div class="researchRelational"><b>Relational signals</b><ul>${relations.map(x=>`<li><strong>${esc(x.person)}</strong>${x.text?` - ${esc(x.text)}`:''}</li>`).join('')}</ul></div>`:''}</div>${test?`<blockquote class="researchPull">${esc(test)}</blockquote>`:''}<div class="researchExpandable">${researchExpandableSections(s)}</div><div class="researchFeatureMeta"><span>${(trace.verified||[]).length} verified traces</span><span>${(trace.inferred||[]).length} inferred reads</span><span>${(trace.unresolved||[]).length} unresolved signals</span></div></div></div></section>`;
}
function evidenceView(){
  focusedResearchStyles();
  return `<div class="researchArchive focused"><div class="researchFeatureStack">${ranked().map(researchFeatureCard).join('')}</div></div>`;
}
