const EMBEDDED_DATA=window.EMBEDDED_DATA||null;
function init(){try{DATA=location.protocol!=='file:'?null:EMBEDDED_DATA}catch(e){DATA=EMBEDDED_DATA};if(!DATA)fetch('data.json',{cache:'no-store'}).then(r=>r.json()).then(d=>{DATA=d;boot()}).catch(()=>{DATA=EMBEDDED_DATA;boot()});else boot();}
function boot(){weights={...(DATA.scenario_presets?.baseline?.weights||Object.fromEntries((DATA.categories||[]).map(c=>[c.key,c.weight])))};renderNav();if(sessionStorage.getItem('atlas_auth')==='true')document.getElementById('gate').style.display='none';setView(view||'overview');}
