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
