function openJson(){document.getElementById('jsonbox').value=JSON.stringify(DATA,null,2);document.getElementById('jsonModal').style.display='block';document.getElementById('validationResults').innerHTML=''}
function closeJson(){document.getElementById('jsonModal').style.display='none'}
function parseJsonEditor(){return JSON.parse(document.getElementById('jsonbox').value)}
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
