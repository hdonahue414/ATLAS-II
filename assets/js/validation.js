const REQUIRED_TOP_LEVEL=['meta','categories','schools'];
function addValidationIssue(bucket,severity,path,message){bucket.push({severity,path,message})}
function isObject(v){return v&&typeof v==='object'&&!Array.isArray(v)}
function validUrl(value){try{let u=new URL(value);return u.protocol==='http:'||u.protocol==='https:'}catch(e){return false}}
function collectTextPaths(value,path,out,predicate){if(Array.isArray(value))value.forEach((v,i)=>collectTextPaths(v,`${path}[${i}]`,out,predicate));else if(isObject(value))Object.entries(value).forEach(([k,v])=>collectTextPaths(v,path?`${path}.${k}`:k,out,predicate));else if(typeof value==='string'&&predicate(value,path))out.push({path,value})}
function validateDataStructure(data){
  let issues=[];
  REQUIRED_TOP_LEVEL.forEach(k=>{if(!(k in (data||{})))addValidationIssue(issues,'error',k,'Missing required top-level field')});
  if(!Array.isArray(data?.categories))addValidationIssue(issues,'error','categories','categories must be an array');
  if(!Array.isArray(data?.schools))addValidationIssue(issues,'error','schools','schools must be an array');
  let categoryKeys=(data?.categories||[]).map(c=>c?.key).filter(Boolean);
  let seen=new Set();
  (data?.schools||[]).forEach((school,i)=>{
    let base=`schools[${i}]`;
    if(!school?.name||typeof school.name!=='string')addValidationIssue(issues,'error',`${base}.name`,'School name is required');
    else if(seen.has(school.name))addValidationIssue(issues,'error',`${base}.name`,`Duplicate school name: ${school.name}`);
    else seen.add(school.name);
    if(!isObject(school?.scores))addValidationIssue(issues,'error',`${base}.scores`,'School scores object is required');
    categoryKeys.forEach(key=>{
      let scoreBlock=school?.scores?.[key];
      if(!scoreBlock){addValidationIssue(issues,'error',`${base}.scores.${key}`,'Required score field is missing');return}
      if(!Array.isArray(scoreBlock.subvariables)){addValidationIssue(issues,'error',`${base}.scores.${key}.subvariables`,'Score subvariables must be an array');return}
      scoreBlock.subvariables.forEach((sub,j)=>{
        let subPath=`${base}.scores.${key}.subvariables[${j}]`;
        if(!sub?.name)addValidationIssue(issues,'warn',`${subPath}.name`,'Subvariable name is missing');
        ['value','confidence'].forEach(field=>{
          let val=sub?.[field];
          if(typeof val!=='number'||Number.isNaN(val))addValidationIssue(issues,'error',`${subPath}.${field}`,`${field} must be numeric`);
          else if(val<0||val>1)addValidationIssue(issues,'error',`${subPath}.${field}`,`${field} must be between 0 and 1`);
        });
      });
    });
    let fractionObjects=['documentary_philosophy_map','portfolio_resonance','topology_axes','environmental_rhythm','daily_cost_friction','mentorship_dependency_visual'];
    fractionObjects.forEach(k=>Object.entries(school?.[k]||{}).forEach(([field,val])=>{if(typeof val==='number'&&(val<0||val>1))addValidationIssue(issues,'error',`${base}.${k}.${field}`,'Numeric model value must be between 0 and 1')}));
    if(typeof school?.identity_preservation_analysis?.score==='number'&&(school.identity_preservation_analysis.score<0||school.identity_preservation_analysis.score>1))addValidationIssue(issues,'error',`${base}.identity_preservation_analysis.score`,'Numeric model value must be between 0 and 1');
  });
  return issues;
}
function collectAssetPaths(data){let paths=[];collectTextPaths(data,'',paths,(value,path)=>/photo_local|image|asset/i.test(path)&&!/^https?:\/\//.test(value));return paths}
function collectUrls(data){let urls=[];collectTextPaths(data,'',urls,(value,path)=>/url$/i.test(path)||/^https?:\/\//.test(value));return urls}
async function assetExists(path){try{let res=await fetch(path,{method:'HEAD',cache:'no-store'});if(res.ok)return true;if(res.status===405){let get=await fetch(path,{cache:'no-store'});return get.ok}return false}catch(e){return location.protocol==='file:'}}
async function validateAtlasData(data){
  let issues=validateDataStructure(data);
  collectUrls(data).forEach(item=>{if(!validUrl(item.value))addValidationIssue(issues,'error',item.path,`Malformed URL: ${item.value}`)});
  let assets=collectAssetPaths(data);
  for(let item of assets){if(!item.value)addValidationIssue(issues,'warn',item.path,'Image/asset path is empty');else if(!(await assetExists(item.value)))addValidationIssue(issues,'warn',item.path,`Missing asset/image path: ${item.value}`)}
  return issues;
}
function renderValidationResults(issues,targetId='validationResults'){
  let target=document.getElementById(targetId);if(!target)return;
  let errors=issues.filter(x=>x.severity==='error').length,warns=issues.filter(x=>x.severity==='warn').length;
  let summary=`<div class="validationSummary"><span class="evidenceBadge ${errors?'inferred':'verified'}">${errors} errors</span><span class="evidenceBadge ${warns?'partial':'verified'}">${warns} warnings</span></div>`;
  let rows=issues.length?issues.slice(0,80).map(x=>`<div class="validationItem ${x.severity==='error'?'error':'warn'}"><b>${esc(x.path)}</b><span>${esc(x.message)}</span></div>`).join(''):'<div class="validationItem ok"><b>Data validation passed</b><span>No schema, numeric range, asset, or URL problems found.</span></div>';
  target.innerHTML=summary+rows;
}
(function(){
function atlasCompareHardFixStyles(){if(document.getElementById('atlasCompareHardFixStyles'))return;let style=document.createElement('style');style.id='atlasCompareHardFixStyles';style.textContent='.navBtn[data-view="fit"],.navBtn[data-view="decision"],.navBtn[data-view="visuals"],.navBtn[data-view="presets"],.navBtn[data-view="search"]{display:none!important}.compareDossier{gap:clamp(22px,3.8vw,44px)!important}.comparePickers{justify-content:center!important;margin-bottom:4px!important}.comparePickers select{border-radius:14px!important;padding:11px 14px!important;background:linear-gradient(180deg,rgba(11,18,32,.82),rgba(5,9,20,.72))!important;letter-spacing:.01em!important}.compareHero{grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:clamp(14px,2.5vw,24px)!important;align-items:stretch!important}.compareCenter{grid-column:1/-1!important;order:-1!important;width:min(980px,100%)!important;justify-self:center!important;text-align:center!important;padding:clamp(17px,2.4vw,24px)!important;border-radius:26px!important;background:radial-gradient(circle at 50% 0,rgba(157,231,215,.10),transparent 44%),linear-gradient(180deg,rgba(11,18,32,.86),rgba(5,9,20,.88))!important}.compareCenter .k{margin-bottom:8px!important}.compareSide{min-height:clamp(360px,39vw,510px)!important}.compareSideBody{gap:12px!important}.compareThesis{max-width:680px!important;font-size:.94rem!important;color:rgba(243,247,255,.90)!important}.compareBlocks{gap:clamp(14px,2vw,18px)!important}.compareBlock{padding:clamp(15px,2.2vw,22px)!important;border-radius:24px!important;background:linear-gradient(180deg,rgba(11,18,32,.66),rgba(5,9,20,.54))!important;border-color:rgba(132,174,252,.10)!important}.compareBlock h3{font-size:.95rem!important;letter-spacing:.02em!important;margin-bottom:13px!important;color:rgba(243,247,255,.92)!important}.comparePair{gap:clamp(12px,2vw,18px)!important}.compareRead{padding:12px 13px 12px 14px!important;border-left:1px solid rgba(157,231,215,.18)!important;border-radius:15px!important;background:linear-gradient(90deg,rgba(157,231,215,.045),rgba(255,255,255,.018) 58%,transparent)!important;line-height:1.48!important}.compareRead b{font-size:.58rem!important;color:rgba(243,247,255,.72)!important;margin-bottom:6px!important}.compareText{margin-top:6px!important;color:rgba(232,240,252,.84)!important}.compareFuture{font-size:.96rem!important;line-height:1.48!important;padding:9px 0 9px 16px!important;background:linear-gradient(90deg,rgba(255,255,255,.05),transparent 78%)!important}.compareDetails{opacity:.82!important}.compareDetails summary{color:rgba(238,244,255,.60)!important}.compareBars{opacity:.78!important}.compareBarRow{grid-template-columns:minmax(120px,160px) 1fr 1fr!important;font-size:.74rem!important}.compareEpi{margin:0 8px 0 0!important;font-size:.50rem!important;letter-spacing:.15em!important;opacity:.68!important;text-shadow:0 0 10px currentColor!important}@media(max-width:900px){.compareHero{grid-template-columns:1fr!important}.compareCenter{order:0!important}.comparePair{grid-template-columns:1fr!important}.compareBarRow{grid-template-columns:1fr!important}}';document.head.appendChild(style)}
function atlasCompareCleanType(type){let t=String(type||'inferred').replace(/[_-]+/g,' ').trim().toLowerCase();if(/direct/.test(t))return'direct contact';if(/public/.test(t))return'public evidence';if(/contrad/.test(t))return'contradictory';if(/anec/.test(t))return'anecdotal';if(/unres|unknown|open/.test(t))return'unresolved';if(/verif/.test(t))return'verified';return'inferred'}
function atlasCompareCleanText(text){let v=(typeof researchEditorialize==='function'?researchEditorialize(text):String(text||''));v=v.replace(/^(verified|inferred|contradictory|anecdotal|unresolved|direct contact|public evidence)\s*/i,'');v=v.replace(/\b(true|false|null|undefined|nan)\b/ig,'');v=v.replace(/[{}[\]"`|]/g,' ');v=v.replace(/\b(confidence|weight|scalar|schema|metadata|source_trace|source trace|ontology|subvariable|data model)\b\s*[:=]?/ig,'');v=v.replace(/\s*[:=;,]+\s*/g,' ').replace(/\s+/g,' ').trim();if(!v||v==='[object Object]'||/^no dominant unresolved thread is recorded yet\.?$/i.test(v))return'';return v}
function atlasCompareLabel(type){let clean=atlasCompareCleanType(type);return`<span class="researchEpistemic compareEpi" data-type="${esc(clean)}">${esc(clean)}</span>`}
function atlasComparePairName(s){let n=String(s?.name||'');if(/wake forest/i.test(n))return'Wake';if(/northwestern/i.test(n))return'Northwestern';if(/stanford/i.test(n))return'Stanford';if(/syracuse/i.test(n))return'Syracuse';if(/temple/i.test(n))return'Temple';if(/depaul/i.test(n))return'DePaul';if(/buffalo/i.test(n))return'Buffalo';if(/ohio/i.test(n))return'Ohio';return n}
function atlasCompareSpecificSynthesis(a,b){let pair=`${atlasComparePairName(a)}|${atlasComparePairName(b)}`,map={
'Wake|Stanford':'Wake offers relational continuity and lower-friction documentary formation; Stanford offers elite nonfiction infrastructure with sharper pressure, culture, and identity-drift questions.',
'Stanford|Wake':'Stanford offers elite nonfiction infrastructure with sharper pressure, culture, and identity-drift questions; Wake offers relational continuity and lower-friction documentary formation.',
'Wake|Syracuse':'Wake offers relational continuity and teaching-integrated formation; Syracuse offers a broader traditional film structure with documentary promise still dependent on mentor confirmation.',
'Syracuse|Wake':'Syracuse offers a broader traditional film structure with documentary promise still dependent on mentor confirmation; Wake offers relational continuity and teaching-integrated formation.',
'Temple|DePaul':'Temple leans toward urban intellectual structure and public-media/community documentary density; DePaul leans toward practical production autonomy inside a larger, more decentralized Chicago ecosystem.',
'DePaul|Temple':'DePaul leans toward practical production autonomy inside a larger, more decentralized Chicago ecosystem; Temple leans toward urban intellectual structure and public-media/community documentary density.',
'Buffalo|DePaul':'Buffalo is mentor-dependent and potentially strong if documentary support materializes; DePaul is warmer and more accessible, but more dependent on self-direction and city-scale energy management.',
'DePaul|Buffalo':'DePaul is warmer and more accessible, but more dependent on self-direction and city-scale energy management; Buffalo is mentor-dependent and potentially strong if documentary support materializes.',
'Northwestern|Stanford':'Northwestern emphasizes intellectual and artistic expansion through a dense Chicago orbit; Stanford offers elite nonfiction infrastructure with higher prestige pressure and culture-fit uncertainty.',
'Stanford|Northwestern':'Stanford offers elite nonfiction infrastructure with higher prestige pressure and culture-fit uncertainty; Northwestern emphasizes intellectual and artistic expansion through a dense Chicago orbit.',
'Ohio|Wake':'Ohio offers low-friction routine and affordability with narrower artistic scale; Wake offers stronger relational documentary structure and clearer teaching integration.',
'Wake|Ohio':'Wake offers stronger relational documentary structure and clearer teaching integration; Ohio offers low-friction routine and affordability with narrower artistic scale.'};return map[pair]||''}
function atlasCompareShortRead(s,label){let item=typeof compareTextFor==='function'?compareTextFor(s,label):null,text=atlasCompareCleanText(item?.text||researchSynthesis?.(s));return text.replace(/\.$/,'').slice(0,112)}
function atlasInstallCompareHardFix(){if(window.ATLAS_COMPARE_HARD_FIX)return;if(typeof VIEWS==='undefined'||typeof ranked!=='function'||typeof compareDossierSide!=='function')return;window.ATLAS_COMPARE_HARD_FIX=true;atlasCompareHardFixStyles();let navPatch=()=>{if(typeof NAV!=='undefined'){let compare=NAV.find(x=>x[0]==='compare');if(compare)compare[3]='Compare institutional futures, pressures, and documentary formation paths.'}};navPatch();if(typeof renderNav==='function'){let baseNav=renderNav;renderNav=function(){navPatch();baseNav()}}
window.compareLabel=compareLabel=atlasCompareLabel;
window.compareCleanText=compareCleanText=atlasCompareCleanText;
window.compareSynthesis=compareSynthesis=function(a,b){let specific=atlasCompareSpecificSynthesis(a,b);if(specific)return specific;let am=atlasCompareShortRead(a,'Mentorship dynamics'),bm=atlasCompareShortRead(b,'Mentorship dynamics');if(am&&bm)return`${a.name} changes the future through ${am.toLowerCase()}; ${b.name} changes it through ${bm.toLowerCase()}. The comparison is about pressure, structure, sustainability, and the documentary identity each setting reinforces.`;return`${a.name} and ${b.name} describe different institutional futures: mentorship structure, daily pressure, evidence certainty, and creative-life sustainability shift in different directions.`};
window.compareDossierSide=compareDossierSide=function(s){let c=s.brand_colors||{},loc=s.location_intelligence||s.location||{},trace=s.source_trace||{},fallback=s.visual_identity?.photo_local||'assets/cities/brookstown.png',img=typeof researchImage==='function'?researchImage(s):fallback;return`<article class="compareSide" style="--compareAccent:${c.accent||'#dce7f7'}"><img src="${esc(img||fallback)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${esc(fallback)}'"><div class="compareSideBody"><div class="researchIdentity"><h2>${esc(s.name)}</h2><div class="comparePlace researchFeaturePlace">${esc(loc.city||s.location?.city||'')}</div></div><p class="compareThesis">${esc(atlasCompareCleanText(researchSynthesis(s))||'The institutional reading remains open.')}</p><div class="compareInstrumentation"><span class="compareInstrument"><b>${score(s)}</b> fit</span><span class="compareInstrument"><b>${Math.round(confidence(s)*100)}%</b> evidence</span><span class="compareInstrument">${(trace.unresolved||[]).length} unresolved</span></div></div></article>`};
if(typeof view!=='undefined'&&view==='compare'&&typeof render==='function')render()}
let tries=0,timer=setInterval(()=>{atlasCompareHardFixStyles();atlasInstallCompareHardFix();if(window.ATLAS_COMPARE_HARD_FIX||++tries>80)clearInterval(timer)},50);
})();
