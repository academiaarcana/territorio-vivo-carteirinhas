(function territorioVivoNetworkContext(){
  const cfg = window.TERRITORIO_VIVO_CONFIG || {};
  if (!cfg.supabaseUrl || !cfg.supabasePublishableKey || !window.supabase) return;
  const client = window.supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);
  const $ = (sel,root=document) => root.querySelector(sel);
  let context = { municipality:'Pimenta Bueno', state:'RO', unit:'', team:'', microarea:'' };

  function genericizeStaticCopy(){
    const eyebrow = $('.auth-brand .eyebrow');
    if (eyebrow) eyebrow.textContent = 'Atenção Primária • Pimenta Bueno — RO';
    const intro = $('.auth-intro');
    if (intro) intro.textContent = 'Uma área de trabalho simples para profissionais da Atenção Primária organizarem informações, gerarem carteirinhas e apoiarem o cuidado no território.';
    const sideContext = $('.sidebar-brand span');
    if (sideContext) sideContext.textContent = 'Atenção Primária';
    document.title = 'Território Vivo — Atenção Primária';
  }

  function generalizeMicroareaField(){
    const old = $('#profileMicroarea');
    if (!old || old.tagName !== 'SELECT') return;
    const input = document.createElement('input');
    input.id = 'profileMicroarea';
    input.type = 'text';
    input.maxLength = 40;
    input.placeholder = 'Ex.: 08';
    input.autocomplete = 'off';
    input.value = old.value || '';
    old.replaceWith(input);
  }

  async function loadContext(){
    const {data:{session}} = await client.auth.getSession();
    if (!session) return;
    const {data:profile} = await client.from('profiles')
      .select('unit_cnes,unit_name,team_name,microarea,municipality_code')
      .eq('id',session.user.id).maybeSingle();
    if (!profile) return;

    let municipality = null;
    let unit = null;
    if (profile.municipality_code) {
      const {data} = await client.from('municipalities').select('name,state_code').eq('code',profile.municipality_code).maybeSingle();
      municipality = data;
    }
    if (profile.unit_cnes) {
      const {data} = await client.from('health_units').select('short_name,name').eq('cnes',profile.unit_cnes).maybeSingle();
      unit = data;
    }
    context = {
      municipality: municipality?.name || 'Pimenta Bueno',
      state: municipality?.state_code || 'RO',
      unit: unit?.short_name || profile.unit_name || '',
      team: profile.team_name || '',
      microarea: profile.microarea || ''
    };
    applyContext();
  }

  function contextLine(){
    return [context.unit,context.team,context.microarea ? `Microárea ${context.microarea}` : ''].filter(Boolean).join(' • ') || 'Atenção Primária';
  }

  function printHeader(){
    return ['Território Vivo',context.municipality ? `${context.municipality}/${context.state}` : '',context.unit,context.team].filter(Boolean).join(' • ');
  }

  function applyContext(){
    const sideContext = $('.sidebar-brand span');
    if (sideContext) sideContext.textContent = [context.unit,context.team].filter(Boolean).join(' • ') || 'Atenção Primária';
    const topEyebrow = $('.topbar .eyebrow');
    if (topEyebrow) topEyebrow.textContent = `Atenção Primária • ${context.municipality} — ${context.state}`;
    const authEyebrow = $('.auth-brand .eyebrow');
    if (authEyebrow) authEyebrow.textContent = `Atenção Primária • ${context.municipality} — ${context.state}`;
  }

  function repairEducationHeader(root=document){
    root.querySelectorAll?.('.education-print-sheet').forEach((sheet) => {
      const header = sheet.firstElementChild;
      if (header) header.innerHTML = `<strong>${printHeader()}</strong>`;
    });
  }

  function observePrintSheets(){
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!(node instanceof Element)) continue;
          if (node.matches('.education-print-sheet')) repairEducationHeader(node.parentElement || document);
          else if (node.querySelector?.('.education-print-sheet')) repairEducationHeader(node);
        }
      }
    });
    observer.observe(document.body,{childList:true,subtree:true});
    window.addEventListener('beforeprint',() => repairEducationHeader(document));
  }

  function keepContextFresh(){
    client.auth.onAuthStateChange((_event,session) => {
      if (session) setTimeout(loadContext,150);
      else {
        context = { municipality:'Pimenta Bueno',state:'RO',unit:'',team:'',microarea:'' };
        genericizeStaticCopy();
      }
    });
    const profileForm = $('#profileForm');
    if (profileForm) profileForm.addEventListener('submit',() => setTimeout(loadContext,600));
  }

  function init(){
    genericizeStaticCopy();
    generalizeMicroareaField();
    observePrintSheets();
    keepContextFresh();
    loadContext();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
