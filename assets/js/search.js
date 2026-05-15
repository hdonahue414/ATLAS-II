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
