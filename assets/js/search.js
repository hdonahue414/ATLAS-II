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
function matchPreview(text,term){
  let clean=String(text).replace(/\s+/g,' ').trim(),idx=clean.toLowerCase().indexOf(term.toLowerCase());
  if(idx<0)return clean.slice(0,160);
  let start=Math.max(0,idx-55),end=Math.min(clean.length,idx+term.length+85);
  return (start?'...':'')+clean.slice(start,end)+(end<clean.length?'...':'');
}
function runGlobalSearch(query){
  let box=document.getElementById('searchResults');if(!box)return;
  let q=query.trim();if(q.length<2){box.style.display='none';box.innerHTML='';return}
  let terms=q.toLowerCase().split(/\s+/).filter(Boolean);
  let results=SEARCH_INDEX.map(item=>{
    let hay=[item.school,item.section,item.text].join(' ').toLowerCase();
    let score=terms.reduce((n,t)=>n+(hay.includes(t)?1:0),0);
    return score?{...item,score}:null;
  }).filter(Boolean).sort((a,b)=>b.score-a.score||a.school.localeCompare(b.school)).slice(0,18);
  box.innerHTML=results.length?results.map((r,i)=>`<button class="searchResult" onclick="openSearchResult(${i})" data-search-result="${i}"><div class="searchMeta">${esc(r.school)} / ${esc(r.section)}</div><div>${esc(matchPreview(r.text,q))}</div><div class="searchPreview">Open ${esc(NAV.find(x=>x[0]===r.view)?.[2]||r.view)}</div></button>`).join(''):'<div class="searchResult"><div class="searchMeta">No matches</div><div class="searchPreview">Try a school, city, resource, evidence note, or ecosystem term.</div></div>';
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
