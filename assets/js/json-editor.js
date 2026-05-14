let pendingJsonImport=null;
function openJson(){document.getElementById('jsonbox').value=JSON.stringify(DATA,null,2);document.getElementById('jsonModal').style.display='block';document.getElementById('validationResults').innerHTML='';resetJsonImport()}
function closeJson(){document.getElementById('jsonModal').style.display='none'}
function parseJsonEditor(){return JSON.parse(document.getElementById('jsonbox').value)}
function resetJsonImport(){pendingJsonImport=null;let p=document.getElementById('importPreview'),f=document.getElementById('jsonFileInput');if(p)p.innerHTML='';if(f)f.value=''}
function chooseJsonFile(){document.getElementById('jsonFileInput')?.click()}
function dragJson(e,active){e.preventDefault();document.getElementById('jsonDrop')?.classList.toggle('active',active)}
function dropJson(e){dragJson(e,false);let file=e.dataTransfer?.files?.[0];if(file)handleJsonFile(file)}
function selectJsonFile(e){let file=e.target.files?.[0];if(file)handleJsonFile(file)}
async function handleJsonFile(file){let preview=document.getElementById('importPreview'),status=document.getElementById('jsonStatus');pendingJsonImport=null;if(preview)preview.innerHTML='<div class="validationItem"><b>Reading file</b><span>'+esc(file.name)+'</span></div>';try{if(!/\.json$/i.test(file.name))throw new Error('Choose a .json file');let text=await file.text(),data=JSON.parse(text);if(!Array.isArray(data.schools)||!Array.isArray(data.categories))throw new Error('Missing schools/categories');if(status)status.textContent='Validating uploaded JSON...';let issues=await validateAtlasData(data),errors=issues.filter(x=>x.severity==='error').length,warns=issues.filter(x=>x.severity==='warn').length;renderValidationResults(issues);pendingJsonImport={data,text,fileName:file.name,issues};let title=esc(data.meta?.title||data.meta?.tool_name||'ATLAS data');if(preview)preview.innerHTML='<div class="importSummary"><div><b>'+title+'</b><span>'+esc(file.name)+' / '+data.schools.length+' schools / '+data.categories.length+' categories</span><span>'+errors+' errors / '+warns+' warnings</span></div><button class="btn primary" onclick="confirmJsonImport()" '+(errors?'disabled':'')+'>Confirm import</button><button class="btn" onclick="resetJsonImport()">Cancel</button></div>';if(status)status.textContent=errors?'Uploaded JSON has errors. Resolve before importing.':'Uploaded JSON ready to import.'}catch(e){if(status)status.textContent='Invalid upload: '+e.message;if(preview)preview.innerHTML='<div class="validationItem error"><b>Import failed</b><span>'+esc(e.message)+'</span></div>';document.getElementById('validationResults').innerHTML=''}}
function confirmJsonImport(){if(!pendingJsonImport)return;document.getElementById('jsonbox').value=JSON.stringify(pendingJsonImport.data,null,2);DATA=pendingJsonImport.data;boot();closeJson()}
async function validateJson(){
  try{
    let p=parseJsonEditor();
    if(!Array.isArray(p.schools)||!Array.isArray(p.categories))throw new Error('Missing schools/categories');
    document.getElementById('jsonStatus').textContent=`Valid JSON: ${p.schools.length} schools`;
    return p
  }catch(e){
    document.getElementById('jsonStatus').textContent='Invalid JSON: '+e.message;
    document.getElementById('validationResults').innerHTML='';
    return null
  }
}
async function validateDataFromEditor(){
  let p=await validateJson();if(!p)return null;
  document.getElementById('jsonStatus').textContent='Validating data...';
  let issues=await validateAtlasData(p);
  renderValidationResults(issues);
  let errors=issues.filter(x=>x.severity==='error').length,warns=issues.filter(x=>x.severity==='warn').length;
  document.getElementById('jsonStatus').textContent=`Data validation complete: ${errors} errors, ${warns} warnings`;
  return {data:p,issues}
}
async function formatJson(){let p=await validateJson();if(p)document.getElementById('jsonbox').value=JSON.stringify(p,null,2)}
async function loadJson(){let result=await validateDataFromEditor();if(result){DATA=result.data;boot();closeJson()}}
function downloadJson(){let text=document.getElementById('jsonbox')?.value||JSON.stringify(DATA,null,2);let b=new Blob([text],{type:'application/json'});let a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='data.json';a.click();URL.revokeObjectURL(a.href)}