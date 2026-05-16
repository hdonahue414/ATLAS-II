(function(){
  function installAtlasUiFinalizer(){
    if(window.ATLAS_UI_FINALIZER_INSTALLED)return;
    window.ATLAS_UI_FINALIZER_INSTALLED=true;

    function ensureStyles(){
      if(document.getElementById('atlasUiFinalizerStyles'))return;
      let style=document.createElement('style');
      style.id='atlasUiFinalizerStyles';
      style.textContent=`
        .sideUtilityGroup{margin-top:auto;display:grid;gap:4px;width:100%;padding-top:12px;border-top:1px solid rgba(132,174,252,.12)}
        .sideUtilityGroup .sideEditorSlot,.sideUtilityGroup .sideSearchSlot,.sideUtilityGroup .sideProfile{position:static!important;left:auto!important;right:auto!important;bottom:auto!important;width:100%!important;margin:0!important;padding:0!important;z-index:auto!important}
        .shell.open .sideUtilityGroup .sideSearchSlot{width:100%!important}
        .programDossierNav{align-items:center}
        .programDossierNav .schoolBtn{white-space:nowrap}
        .atlasChip,.environmentAnchors span,.toriAnchorLine span,.toriModalAnchors span{display:inline-flex;align-items:center;gap:6px}
        .schoolHero .heroBody,.toriCinematicHero .toriHeroBody{display:flex!important;flex-direction:column!important;gap:9px!important;height:100%!important;justify-content:flex-end!important}
        .schoolHero .atlasContextBtn,.schoolHero .harperContextBtn,.toriCinematicHero .toriContextBtn{align-self:center!important;margin-top:12px!important;margin-bottom:0!important}
      `;
      document.head.appendChild(style);
    }

    function buttonIndex(btn){
      let onclick=btn.getAttribute('onclick')||'';
      let m=onclick.match(/(?:selected|atlasPracticeSelect)\s*(?:=|\()\s*(\d+)/);
      return m?Number(m[1]):NaN;
    }

    function normalizeSelectionState(){
      if(typeof view==='undefined'||typeof DATA==='undefined'||!DATA?.schools)return;
      if(view==='development'&&Number.isInteger(window.atlasPracticeSchoolIndex))selected=window.atlasPracticeSchoolIndex;
      if(view==='programs')window.atlasPracticeSchoolIndex=selected;
      let active=Number.isInteger(selected)?selected:0;
      document.querySelectorAll('.programDossierNav').forEach(nav=>{
        let matched=false;
        nav.querySelectorAll('.schoolBtn').forEach(btn=>{
          let is=buttonIndex(btn)===active;
          btn.classList.toggle('active',is&&!matched);
          if(is&&!matched)matched=true;
        });
      });
      document.querySelectorAll('.programDossierNav').forEach(nav=>{
        let actives=[...nav.querySelectorAll('.schoolBtn.active')];
        actives.slice(1).forEach(btn=>btn.classList.remove('active'));
      });
    }

    function restoreSidebarStructure(){
      let side=document.querySelector('.side'),sideNav=document.getElementById('sideNav');
      if(!side||!sideNav)return;
      let utility=side.querySelector('.sideUtilityGroup');
      if(!utility){
        utility=document.createElement('div');
        utility.className='sideUtilityGroup';
        sideNav.insertAdjacentElement('afterend',utility);
      }
      let editorBtn=sideNav.querySelector('.navBtn[data-view="editor"]')||side.querySelector('.sideEditorSlot .navBtn[data-view="editor"]');
      if(!editorBtn&&window.VIEWS?.editor){
        let slot=document.createElement('div');
        slot.className='sideEditorSlot';
        slot.innerHTML='<button type="button" class="navBtn" data-view="editor" data-tip="Editor" onclick="setView(\'editor\')"><span class="ico">✎</span><span class="label">Editor</span></button>';
        editorBtn=slot.firstElementChild;
      }
      let editorSlot=side.querySelector('.sideEditorSlot')||document.createElement('div');
      editorSlot.className='sideEditorSlot';
      if(editorBtn&&editorBtn.parentElement!==editorSlot)editorSlot.appendChild(editorBtn);
      let searchSlot=side.querySelector('.sideSearchSlot');
      let profile=side.querySelector('.sideProfile');
      [editorSlot,searchSlot,profile].filter(Boolean).forEach(node=>utility.appendChild(node));
    }

    function bindModalEvents(){
      if(window.ATLAS_MODAL_FINALIZER_BOUND)return;
      window.ATLAS_MODAL_FINALIZER_BOUND=true;
      document.addEventListener('click',e=>{
        let close=e.target.closest('.atlasToriContextClose');
        if(close&&typeof atlasCloseToriContext==='function'){
          e.preventDefault();
          e.stopPropagation();
          atlasCloseToriContext();
          scheduleFinalization('modal-close');
          return;
        }
        if(e.target&&e.target.id==='atlasToriContextOverlay'&&typeof atlasCloseToriContext==='function'){
          atlasCloseToriContext();
          scheduleFinalization('modal-outside');
        }
      },true);
      document.addEventListener('keydown',e=>{
        if(e.key==='Escape'&&document.getElementById('atlasToriContextOverlay')&&typeof atlasCloseToriContext==='function'){
          atlasCloseToriContext();
          scheduleFinalization('modal-escape');
        }
      });
    }

    function enrichChips(){
      document.querySelectorAll('.environmentAnchors span,.toriAnchorLine span,.toriModalAnchors span,.programDossierSignals span,.researchEvidenceLine .pill').forEach(el=>el.classList.add('atlasChip'));
    }

    function normalizeLayout(){
      document.querySelectorAll('.schoolHero .heroBody,.toriCinematicHero .toriHeroBody').forEach(el=>el.classList.add('atlasCardFlow'));
      document.querySelectorAll('.atlasContextBtn,.harperContextBtn,.toriContextBtn').forEach(btn=>btn.setAttribute('type','button'));
    }

    function finalizeAtlasUi(){
      ensureStyles();
      normalizeSelectionState();
      restoreSidebarStructure();
      bindModalEvents();
      enrichChips();
      normalizeLayout();
    }

    let pending=false;
    function scheduleFinalization(){
      if(pending)return;
      pending=true;
      requestAnimationFrame(()=>requestAnimationFrame(()=>{pending=false;finalizeAtlasUi()}));
    }
    window.atlasFinalizeUi=finalizeAtlasUi;
    window.atlasScheduleFinalization=scheduleFinalization;

    if(typeof render==='function'&&!render.ATLAS_FINALIZED){
      let baseRender=render;
      render=function(){let out=baseRender.apply(this,arguments);scheduleFinalization('render');return out};
      render.ATLAS_FINALIZED=true;
    }
    if(typeof setView==='function'&&!setView.ATLAS_FINALIZED){
      let baseSetView=setView;
      setView=function(){let out=baseSetView.apply(this,arguments);scheduleFinalization('view');return out};
      setView.ATLAS_FINALIZED=true;
    }
    if(typeof atlasOpenToriContext==='function'&&!atlasOpenToriContext.ATLAS_FINALIZED){
      let baseOpen=atlasOpenToriContext;
      atlasOpenToriContext=function(){let out=baseOpen.apply(this,arguments);scheduleFinalization('modal-open');return out};
      atlasOpenToriContext.ATLAS_FINALIZED=true;
    }
    if(typeof atlasCloseToriContext==='function'&&!atlasCloseToriContext.ATLAS_FINALIZED){
      let baseClose=atlasCloseToriContext;
      atlasCloseToriContext=function(){let out=baseClose.apply(this,arguments);scheduleFinalization('modal-close');return out};
      atlasCloseToriContext.ATLAS_FINALIZED=true;
    }
    scheduleFinalization('initial');
  }

  let core=document.createElement('script');
  core.src='assets/js/app-core.js?v=20260516d';
  core.onload=installAtlasUiFinalizer;
  document.currentScript.insertAdjacentElement('afterend',core);
})();
