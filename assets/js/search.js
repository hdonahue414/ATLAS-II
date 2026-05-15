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
  let labels={
    School:'Program record',
    City:'Environment',
    Curriculum:'Program structure',
    'Points of interest':'Environmental anchors',
    'LGBTQ/community resources':'Community infrastructure',
    'Documentary ecosystem':'Documentary world',
    'Alumni outcomes':'Outcomes',
    'Evidence notes':'Research record'
  };
  return labels[section]||titleCase(section);
}
function searchFallbackSnippet(result){
  let fallbacks={
    School:'School identity matched the query. Open the program record for the full interpretive context.',
    City:'City and regional context matched the query through the environmental record.',
    Curriculum:'Program structure matched the query. Open the record for curriculum, mentorship, and fit context.',
    'Points of interest':'Environmental anchor material matched the query through City & Life records.',
    'LGBTQ/community resources':'Community infrastructure matched the query through lived-environment records.',
    'Documentary ecosystem':'Documentary-world context matched the query through professional and regional ecosystem notes.',
    'Alumni outcomes':'Outcome evidence matched the query through alumni or current-student trajectory records.',
    'Evidence notes':'Research material matched the query through documented, inferred, or unresolved evidence.'
  };
  return fallbacks[result.section]||'ATLAS records matched this query. Open the record for the surrounding context.';
}
function cleanSearchSnippet(text){
  let raw=String(text??'').replace(/[_{}[\]"'`|]/g,' ');
  raw=raw.replace(/\b(true|false|null|undefined|nan)\b/ig,' ');
  raw=raw.replace(/\b(active seeded|active_seeded|implemented|pending|enabled|disabled|school specific|school_specific)\b/ig,' ');
  raw=raw.replace(/\b(confidence|weight|weighted|score|scalar|value|formula|inputs?|outputs?|subvariables?|schema|status|data model|data_model|metadata|source trace|source_trace)\b\s*[:=]?/ig,' ');
  raw=raw.replace(/\b0?\.\d+\b/g,' ');
  raw=raw.replace(/\b\d+(?:\.\d+)?%?\b/g,m=>/^\d{4}$/.test(m)?m:' ');
  raw=raw.replace(/\s*[:=;,]+\s*/g,' ');
  raw=raw.replace(/\s+/g,' ').trim();
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
function focusedResearchStyles(){
  if(document.getElementById('focusedResearchStyles'))return;
  let style=document.createElement('style');style.id='focusedResearchStyles';
  style.textContent='.researchArchive.focused{display:grid;gap:clamp(28px,5vw,58px)}.researchArchive.focused .researchIntro{max-width:980px;margin-bottom:4px}.researchFeatureStack{display:grid;gap:clamp(30px,6vw,70px)}.researchFeature{position:relative;min-height:clamp(680px,86vh,900px);border:1px solid rgba(255,255,255,.12);border-radius:34px;overflow:hidden;background:#080d17;box-shadow:0 28px 90px rgba(0,0,0,.36)}.researchFeature img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.72;filter:saturate(.82) contrast(1.06)}.researchFeature:before{content:"";position:absolute;inset:0;z-index:1;background:linear-gradient(90deg,rgba(2,6,14,.84),rgba(2,6,14,.44) 43%,rgba(2,6,14,.10) 72%,transparent),linear-gradient(180deg,rgba(2,6,14,.08),rgba(2,6,14,.24) 45%,rgba(2,6,14,.88))}.researchFeature:nth-child(even):before{background:linear-gradient(270deg,rgba(2,6,14,.84),rgba(2,6,14,.42) 43%,rgba(2,6,14,.10) 72%,transparent),linear-gradient(180deg,rgba(2,6,14,.08),rgba(2,6,14,.24) 45%,rgba(2,6,14,.88))}.researchFeatureBody{position:relative;z-index:2;min-height:inherit;display:flex;align-items:flex-end;padding:clamp(22px,4vw,42px)}.researchFeature:nth-child(even) .researchFeatureBody{justify-content:flex-end}.researchFeatureRead{width:min(760px,100%);display:grid;gap:14px;text-shadow:0 3px 22px rgba(0,0,0,.58)}.researchFeatureRead h3{margin:0;color:var(--researchAccent,#dce7f7);font-size:clamp(2.2rem,6vw,5rem);line-height:.92;letter-spacing:-.045em}.researchFeaturePlace{color:#d4e0ef;font-size:.75rem;letter-spacing:.14em;text-transform:uppercase}.researchFeatureSynthesis{margin:0;color:#f4f8ff;font-size:clamp(1.02rem,1.6vw,1.24rem);line-height:1.5}.researchTension{border-left:1px solid rgba(157,231,215,.28);padding-left:13px;color:#d8e3f1;line-height:1.5;background:linear-gradient(90deg,rgba(5,9,20,.20),transparent)}.researchTension b{display:block;color:#eef4ff;font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;margin-bottom:5px}.researchFeatureMeta{display:flex;gap:8px;flex-wrap:wrap}.researchFeatureMeta span{border:1px solid rgba(255,255,255,.13);border-radius:999px;background:rgba(5,9,20,.48);backdrop-filter:blur(8px);padding:7px 9px;color:#dce7f7;font-size:.74rem}.researchFeatureEvidence{display:grid;gap:7px;max-width:680px}.researchFeatureEvidence .pill{background:rgba(5,9,20,.44);border-color:rgba(132,174,252,.14);color:#dce7f7}.researchQuietPanel{max-width:980px;border:1px solid rgba(132,174,252,.12);border-radius:24px;background:rgba(11,18,32,.68);padding:18px}.researchQuietPanel p{color:#cbd7e8;line-height:1.55}@media(max-width:760px){.researchFeature{min-height:720px;border-radius:26px}.researchFeature:before,.researchFeature:nth-child(even):before{background:linear-gradient(180deg,rgba(2,6,14,.08),rgba(2,6,14,.42) 36%,rgba(2,6,14,.94))}.researchFeatureBody,.researchFeature:nth-child(even) .researchFeatureBody{justify-content:flex-start;align-items:flex-end;padding:20px}.researchFeatureRead h3{font-size:clamp(2.3rem,15vw,4rem)}}';
  document.head.appendChild(style);
}
function researchCopy(text){return typeof programDossierCopy==='function'?programDossierCopy(text):String(text||'')}
function researchSynthesis(s){return researchCopy(s.scores?.mentorship?.notes||s.scores?.documentary?.notes||s.alumni_current_student_outcomes?.outcome_pattern||s.identity_preservation_analysis?.summary||'The institutional reading remains open, with evidence still accumulating across mentorship, documentary culture, and lived sustainability.')}
function researchOpenThreads(s){let items=[];(s.contradictions||[]).slice(0,1).forEach(x=>items.push(['Current tension',x]));(s.source_trace?.unresolved||[]).slice(0,1).forEach(x=>items.push(['Open question',x]));if(!items.length)items.push(['Open question','The central remaining uncertainty is how the documented institutional structure translates into daily creative life.']);return items}
function researchFeatureCard(s){let c=s.brand_colors||{},loc=s.location_intelligence||s.location||{},trace=s.source_trace||{},test=(s.public_testimony||[])[0]?.summary||'',out=s.alumni_current_student_outcomes?.outcome_pattern||'',fallback=s.visual_identity?.photo_local||'';return `<section class="researchFeature" style="--researchAccent:${c.accent||'#dce7f7'}"><img src="${researchImage(s)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${esc(fallback)}'"><div class="researchFeatureBody"><div class="researchFeatureRead"><div><h3>${esc(s.name)}</h3><div class="researchFeaturePlace">${esc(loc.city||s.location?.city||'')}</div></div><p class="researchFeatureSynthesis">${esc(researchSynthesis(s))}</p>${researchOpenThreads(s).map(x=>`<div class="researchTension"><b>${esc(x[0])}</b>${esc(researchCopy(x[1]))}</div>`).join('')}<div class="researchFeatureMeta"><span>${(trace.verified||[]).length} verified traces</span><span>${(trace.inferred||[]).length} inferred reads</span><span>${(trace.unresolved||[]).length} open questions</span></div>${test||out?`<div class="researchFeatureEvidence">${test?`<span class="pill">${esc(researchCopy(test))}</span>`:''}${out?`<span class="pill">${esc(researchCopy(out))}</span>`:''}</div>`:''}</div></div></section>`}
function evidenceView(){focusedResearchStyles();let rel=DATA.schools.flatMap(s=>(s.relationship_tracker||[]).map(x=>`${s.name}: ${x.person} / ${x.tone}`)).slice(0,10);return `<div class="researchArchive focused"><section class="researchIntro"><div class="k">Research dossier</div><h2>Institutional evidence, open questions, and documentary-world traces.</h2><p>Research now reads sequentially: one institutional environment at a time, with synthesis first, unresolved tensions second, and evidence traces supporting the interpretation rather than flattening it into a grid.</p></section><div class="researchFeatureStack">${ranked().map(researchFeatureCard).join('')}</div><section class="researchQuietPanel"><h3>Relational evidence threads</h3><p>Relationship traces remain available as supporting archival material, but they sit underneath the institutional readings instead of driving the page rhythm.</p>${pills(rel)}</section></div>`}
