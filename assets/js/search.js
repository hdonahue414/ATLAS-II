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
  let raw=String(text??'').replace(/[_{}[\]"'`|]/g,' ');
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
    let keys=['summary','notes','note','residue','tone','finding','description','text','claim','question','tension','pattern','outcome_pattern','role','person'];
    let parts=keys.map(k=>researchText(value[k])).filter(Boolean);
    if(!parts.length)parts=Object.values(value).map(researchText).filter(Boolean).slice(0,3);
    return parts.join(' / ');
  }
  let text=researchCopy(String(value).replace(/\s+/g,' ').trim());
  return text==='[object Object]'?'':text;
}
function researchUnique(items,limit=3){let seen=new Set();return items.map(researchText).map(x=>x.replace(/\s+/g,' ').trim()).filter(x=>x&&x!=='[object Object]'&&!seen.has(x.toLowerCase())&&seen.add(x.toLowerCase())).slice(0,limit)}
function focusedResearchStyles(){
  if(document.getElementById('focusedResearchStylesV2'))return;
  let style=document.createElement('style');style.id='focusedResearchStylesV2';
  style.textContent='.researchArchive.focused{display:grid;gap:clamp(34px,6vw,72px)}.researchArchive.focused .researchIntro{max-width:1060px;margin-bottom:0}.researchFeatureStack{display:grid;gap:clamp(42px,8vw,92px)}.researchFeature{position:relative;min-height:clamp(760px,92vh,980px);border:1px solid rgba(255,255,255,.12);border-radius:34px;overflow:hidden;background:#080d17;box-shadow:0 30px 100px rgba(0,0,0,.38)}.researchFeature img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.78;filter:saturate(.84) contrast(1.05)}.researchFeature:before{content:"";position:absolute;inset:0;z-index:1;background:radial-gradient(circle at 24% 72%,rgba(2,6,14,.84),rgba(2,6,14,.48) 34%,rgba(2,6,14,.12) 67%,transparent),linear-gradient(90deg,rgba(2,6,14,.78),rgba(2,6,14,.34) 44%,rgba(2,6,14,.08) 76%,transparent),linear-gradient(180deg,rgba(2,6,14,.04),rgba(2,6,14,.18) 46%,rgba(2,6,14,.82))}.researchFeature:nth-child(even):before{background:radial-gradient(circle at 76% 72%,rgba(2,6,14,.84),rgba(2,6,14,.48) 34%,rgba(2,6,14,.12) 67%,transparent),linear-gradient(270deg,rgba(2,6,14,.78),rgba(2,6,14,.34) 44%,rgba(2,6,14,.08) 76%,transparent),linear-gradient(180deg,rgba(2,6,14,.04),rgba(2,6,14,.18) 46%,rgba(2,6,14,.82))}.researchFeatureBody{position:relative;z-index:2;min-height:inherit;display:flex;align-items:flex-end;padding:clamp(24px,4.5vw,50px)}.researchFeature:nth-child(even) .researchFeatureBody{justify-content:flex-end}.researchFeatureRead{width:min(820px,100%);display:grid;gap:18px;text-shadow:0 3px 24px rgba(0,0,0,.62)}.researchFeatureRead h3{margin:0;color:var(--researchAccent,#dce7f7);font-size:clamp(2.5rem,6.4vw,5.5rem);line-height:.9;letter-spacing:-.05em}.researchFeaturePlace{color:#d7e2f1;font-size:.75rem;letter-spacing:.15em;text-transform:uppercase}.researchFeatureSynthesis{margin:0;color:#f5f8ff;font-size:clamp(1.04rem,1.7vw,1.32rem);line-height:1.52}.researchEditorialBlock{border-left:1px solid rgba(157,231,215,.30);padding-left:14px;color:#dce7f7;line-height:1.55;background:linear-gradient(90deg,rgba(5,9,20,.20),transparent)}.researchEditorialBlock b{display:block;color:#f1f6ff;font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;margin-bottom:6px}.researchPull{margin:0;padding:0 0 0 18px;border-left:2px solid rgba(255,255,255,.26);color:#eef4ff;font-size:clamp(1rem,1.35vw,1.18rem);line-height:1.46;font-style:italic}.researchFeatureMeta{display:flex;gap:16px;flex-wrap:wrap;color:rgba(220,231,247,.74);font-size:.72rem;letter-spacing:.08em;text-transform:uppercase}.researchFeatureMeta span:before{content:"";display:inline-block;width:5px;height:5px;border-radius:50%;background:rgba(157,231,215,.45);margin-right:7px;vertical-align:middle}.researchQuietPanel{max-width:1040px;border:1px solid rgba(132,174,252,.12);border-radius:26px;background:linear-gradient(180deg,rgba(11,18,32,.72),rgba(5,9,20,.82));padding:22px}.researchQuietPanel p{color:#cbd7e8;line-height:1.58}.researchContactList{display:grid;gap:10px;margin-top:14px}.researchContact{border-left:1px solid rgba(132,174,252,.22);padding-left:12px;color:#dce7f7;line-height:1.45}.researchContact small{display:block;color:rgba(220,231,247,.52);font-size:.66rem;letter-spacing:.12em;text-transform:uppercase;margin-bottom:3px}@media(max-width:760px){.researchFeature{min-height:780px;border-radius:26px}.researchFeature:before,.researchFeature:nth-child(even):before{background:linear-gradient(180deg,rgba(2,6,14,.06),rgba(2,6,14,.42) 34%,rgba(2,6,14,.95))}.researchFeatureBody,.researchFeature:nth-child(even) .researchFeatureBody{justify-content:flex-start;align-items:flex-end;padding:20px}.researchFeatureRead h3{font-size:clamp(2.4rem,15vw,4rem)}}';
  document.head.appendChild(style);
}
function researchCopy(text){return typeof programDossierCopy==='function'?programDossierCopy(text):String(text||'')}
function researchSynthesis(s){return researchText(s.scores?.mentorship?.notes||s.scores?.documentary?.notes||s.alumni_current_student_outcomes?.outcome_pattern||s.identity_preservation_analysis?.summary)||'The institutional reading remains open, with evidence still accumulating across mentorship, documentary culture, and lived sustainability.'}
function researchOpenThreads(s){let items=[];researchUnique(s.contradictions||[],2).forEach(x=>items.push(['Interpretive conflict',x]));researchUnique(s.source_trace?.unresolved||[],1).forEach(x=>items.push(['Open question',x]));if(!items.length)items.push(['Open question','The central remaining uncertainty is how the documented institutional structure translates into daily creative life.']);return items.slice(0,2)}
function researchLensBlocks(s,i){let doc=researchText(s.scores?.documentary?.notes),mentor=researchText(s.scores?.mentorship?.notes),fund=researchText(s.scores?.funding?.notes),life=researchText(s.ordinary_tuesday||s.location?.energy_profile),out=researchText(s.alumni_current_student_outcomes?.outcome_pattern),ecosystem=researchUnique(s.documentary_ecosystem||[],3).join(' / ');let modes=[['Mentorship dynamics',mentor||'Mentorship evidence remains interpretive and should be read through contact quality, advisor access, and cohort structure.'],['Documentary-world placement',ecosystem||doc||'Documentary-world placement is still emerging through curriculum, faculty signals, and regional nonfiction infrastructure.'],['Sustainability and labor ecology',fund||life||'Sustainability should be read through funding pressure, daily routine feasibility, and recovery capacity.'],['Likely trajectory pattern',out||'Trajectory evidence remains partial; the filmmaker path depends on how structure, mentorship, and self-direction interact.']];return [modes[i%modes.length],modes[(i+1)%modes.length]]}
function researchFeatureCard(s,i){let c=s.brand_colors||{},loc=s.location_intelligence||s.location||{},trace=s.source_trace||{},test=researchUnique(s.public_testimony||[],1)[0]||'',fallback=s.visual_identity?.photo_local||'',blocks=researchLensBlocks(s,i),threads=researchOpenThreads(s);return `<section class="researchFeature" style="--researchAccent:${c.accent||'#dce7f7'}"><img src="${researchImage(s)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${esc(fallback)}'"><div class="researchFeatureBody"><div class="researchFeatureRead"><div><h3>${esc(s.name)}</h3><div class="researchFeaturePlace">${esc(loc.city||s.location?.city||'')}</div></div><p class="researchFeatureSynthesis">${esc(researchSynthesis(s))}</p>${blocks.map(x=>`<div class="researchEditorialBlock"><b>${esc(x[0])}</b>${esc(x[1])}</div>`).join('')}${threads.map(x=>`<div class="researchEditorialBlock"><b>${esc(x[0])}</b>${esc(x[1])}</div>`).join('')}${test?`<blockquote class="researchPull">${esc(test)}</blockquote>`:''}<div class="researchFeatureMeta"><span>${(trace.verified||[]).length} verified traces</span><span>${(trace.inferred||[]).length} inferred reads</span><span>${(trace.unresolved||[]).length} unresolved signals</span></div></div></div></section>`}
function evidenceView(){focusedResearchStyles();let contacts=DATA.schools.flatMap(s=>(s.relationship_tracker||[]).map(x=>({school:s.name,person:researchText(x.person),role:researchText(x.role),tone:researchText(x.tone),residue:researchText(x.residue)}))).slice(0,10);return `<div class="researchArchive focused"><section class="researchIntro"><div class="k">Research dossier</div><h2>Institutional evidence, open questions, and documentary-world traces.</h2><p>Research reads sequentially: one institutional environment at a time, with synthesis first, interpretive conflict next, and evidence traces supporting the reading rather than flattening it into a database.</p></section><div class="researchFeatureStack">${ranked().map(researchFeatureCard).join('')}</div><section class="researchQuietPanel"><h3>Relationship traces</h3><p>Field contacts and institutional conversations remain as human signals: partial, situated, and useful because they show how the institution behaves in relation, not because they form a complete evidence table.</p><div class="researchContactList">${contacts.map(x=>`<div class="researchContact"><small>${esc(x.school)} / ${esc(x.role||'contact')}</small>${esc([x.person,x.tone,x.residue].filter(Boolean).join(' — '))}</div>`).join('')}</div></section></div>`}
