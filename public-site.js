(function territorioVivoPublicSite(){
  const cfg = window.TERRITORIO_VIVO_CONFIG || {};
  const $ = (sel, root=document) => root.querySelector(sel);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[c]));

  function loadStyle(){
    if (!$('#tvPublicStyles')) {
      const link = document.createElement('link');
      link.id = 'tvPublicStyles';
      link.rel = 'stylesheet';
      link.href = 'public-site.css';
      document.head.appendChild(link);
    }
    if (!$('#tvAuthPolishStyles')) {
      const style = document.createElement('style');
      style.id = 'tvAuthPolishStyles';
      style.textContent = '[hidden]{display:none!important}.form-status.tv-success{color:#1d6b4b!important}.form-status.tv-error{color:#a53b35!important}';
      document.head.appendChild(style);
    }
  }

  function createLanding(){
    if ($('#publicLanding')) return;
    const landing = document.createElement('div');
    landing.id = 'publicLanding';
    landing.className = 'public-landing';
    landing.innerHTML = `
      <header class="public-header">
        <a class="public-brand" href="#inicio" aria-label="Território Vivo — início">
          <span class="public-brand-mark">TV</span>
          <span><strong>Território Vivo</strong><small>Atenção Primária • Pimenta Bueno — RO</small></span>
        </a>
        <nav class="public-nav" aria-label="Navegação pública">
          <a href="#como-funciona">Como funciona</a>
          <a href="#unidades">Unidades</a>
          <button class="public-link" type="button" data-public-login>Entrar</button>
          <button class="button primary" type="button" data-public-signup>Criar conta</button>
        </nav>
      </header>

      <main>
        <section id="inicio" class="public-hero">
          <div class="public-hero-copy">
            <span class="public-kicker">Territorialização que vira ação</span>
            <h1>Um território vivo começa quando a informação chega a quem cuida.</h1>
            <p>Ferramentas simples para ACS e equipes organizarem carteirinhas, mudanças do território, indicadores, educação em saúde e os 5 minutos da reunião — sem criar um prontuário paralelo.</p>
            <div class="public-hero-actions">
              <button class="button primary public-big" type="button" data-public-signup>Criar minha conta</button>
              <button class="button soft public-big" type="button" data-public-login>Já tenho acesso</button>
            </div>
            <div class="public-trust-row">
              <span>✓ Perfil profissional reutilizável</span>
              <span>✓ Impressão A4 econômica</span>
              <span>✓ Dados de carteirinhas temporários</span>
            </div>
          </div>
          <div class="public-visual" aria-hidden="true">
            <div class="public-map-card">
              <div class="public-map-head"><span>Rede de cuidado</span><strong>Pimenta Bueno</strong></div>
              <div class="public-route-line r1"></div><div class="public-route-line r2"></div><div class="public-route-line r3"></div>
              <span class="public-pin p1">UBS</span><span class="public-pin p2">ACS</span><span class="public-pin p3">5′</span><span class="public-pin p4">+</span>
              <div class="public-map-note"><strong>Achado → decisão → ação</strong><small>o território volta para a reunião e a reunião volta para o território</small></div>
            </div>
          </div>
        </section>

        <section id="como-funciona" class="public-section">
          <div class="public-section-heading"><span>Como funciona</span><h2>Feito para caber na rotina da Atenção Primária.</h2><p>O profissional entra com sua unidade, equipe e microárea. O sistema reaproveita esses dados e deixa os campos de usuários/famílias temporários por padrão.</p></div>
          <div class="public-feature-grid">
            <article><span class="public-feature-icon">▣</span><h3>Carteirinhas úteis</h3><p>Modelos para família, território e gestão, com PDF e impressão de 2, 4 ou 8 unidades por A4.</p></article>
            <article><span class="public-feature-icon">5′</span><h3>5 minutos do território</h3><p>Leve uma mudança, risco, necessidade ou potencialidade para uma decisão objetiva da equipe.</p></article>
            <article><span class="public-feature-icon">▥</span><h3>Indicadores que orientam</h3><p>Números para enxergar necessidades e lacunas — sem transformar indicador em ranking de trabalhador.</p></article>
            <article><span class="public-feature-icon">✚</span><h3>Educação em saúde</h3><p>Materiais curtos, imprimíveis e com referência técnica para apoiar a conversa com a população.</p></article>
          </div>
        </section>

        <section class="public-privacy-section">
          <div><span class="public-kicker">Privacidade por desenho</span><h2>Não é um segundo prontuário.</h2><p>O banco guarda apenas dados profissionais e institucionais necessários ao funcionamento da plataforma. Informações digitadas para gerar carteirinhas não são salvas por padrão.</p></div>
          <div class="public-privacy-points"><span>Perfil do profissional</span><span>Município, unidade e equipe</span><span>Sem cadastro paralelo de pacientes</span><span>Controle de acesso por conta</span></div>
        </section>

        <section id="unidades" class="public-section public-units-section">
          <div class="public-section-heading"><span>Rede cadastrada</span><h2>Unidades e pontos de atenção.</h2><p>O catálogo usa referências públicas e registra a data de verificação. Dados que ainda precisam de validação local aparecem como “a confirmar”.</p></div>
          <div id="publicUnitsGrid" class="public-units-grid"><div class="public-loading">Carregando unidades…</div></div>
        </section>

        <section class="public-cta">
          <div><span class="public-kicker">Para equipes de saúde</span><h2>Comece pela sua unidade e sua microárea.</h2><p>O cadastro é individual. Se sua equipe ainda não estiver na lista, você pode informar o nome para validação posterior pela gestão.</p></div>
          <button class="button primary public-big" type="button" data-public-signup>Criar conta profissional</button>
        </section>
      </main>

      <footer class="public-footer"><strong>Território Vivo</strong><span>Apoio à territorialização na Atenção Primária • Pimenta Bueno/RO</span><small>Ferramenta de apoio. Não substitui e-SUS APS, PEC, prontuário ou orientação clínica individual.</small></footer>`;
    document.body.insertBefore(landing, document.body.firstChild);
  }

  function showLanding(){
    const landing = $('#publicLanding');
    const auth = $('#authView');
    if (landing) landing.hidden = false;
    if (auth) auth.hidden = true;
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function showAuth(signup=false){
    const landing = $('#publicLanding');
    const auth = $('#authView');
    if (landing) landing.hidden = true;
    if (auth) auth.hidden = false;
    if (signup) setTimeout(() => $('#showSignup')?.click(), 30);
    else setTimeout(() => $('#loginEmail')?.focus(), 30);
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function polishSignupStatus(){
    const status = $('#signupStatus');
    if (!status || status.dataset.polished === '1') return;
    status.dataset.polished = '1';
    const refresh = () => {
      const text = (status.textContent || '').trim();
      status.classList.remove('tv-success','tv-error');
      if (!text) return;
      if (/^Conta criada|^Senha atualizada|^Perfil atualizado/i.test(text)) status.classList.add('tv-success');
      else if (/não foi possível|senhas não|informe|selecione/i.test(text)) status.classList.add('tv-error');
    };
    new MutationObserver(refresh).observe(status,{childList:true,characterData:true,subtree:true});
    refresh();
  }

  async function loadUnits(){
    const root = $('#publicUnitsGrid');
    if (!root || !cfg.supabaseUrl || !cfg.supabasePublishableKey || !window.supabase) return;
    const client = window.supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);
    const {data,error} = await client.from('health_units')
      .select('cnes,short_name,unit_type,neighborhood,address,phone,data_status,source_checked_on')
      .eq('is_active',true)
      .order('display_order',{ascending:true});
    if (error) {
      root.innerHTML = '<div class="public-loading">O catálogo de unidades está temporariamente indisponível.</div>';
      return;
    }
    root.innerHTML = (data||[]).map((u) => {
      const status = u.data_status === 'team_confirmed' ? 'Confirmado localmente' : u.data_status === 'needs_review' ? 'Dados a confirmar' : 'Referência pública';
      const statusClass = u.data_status === 'team_confirmed' ? 'ok' : u.data_status === 'needs_review' ? 'review' : 'public';
      const place = [u.address,u.neighborhood].filter(Boolean).join(' — ') || 'Localização a confirmar';
      return `<article class="public-unit-card"><div class="public-unit-top"><span class="public-unit-type">${esc(u.unit_type || 'unidade')}</span><span class="public-unit-status ${statusClass}">${esc(status)}</span></div><h3>${esc(u.short_name)}</h3><p>${esc(place)}</p>${u.phone ? `<small>${esc(u.phone)}</small>` : '<small>Telefone a confirmar</small>'}<div class="public-unit-meta"><span>CNES ${esc(u.cnes)}</span>${u.source_checked_on ? `<span>Verificado ${esc(u.source_checked_on.split('-').reverse().join('/'))}</span>` : ''}</div></article>`;
    }).join('') || '<div class="public-loading">Nenhuma unidade cadastrada.</div>';
  }

  function bind(){
    document.addEventListener('click',(event) => {
      const login = event.target.closest('[data-public-login]');
      const signup = event.target.closest('[data-public-signup]');
      if (login) showAuth(false);
      if (signup) showAuth(true);
    });

    const auth = $('#authView');
    if (auth && !$('#publicBackButton')) {
      const back = document.createElement('button');
      back.type = 'button';
      back.id = 'publicBackButton';
      back.className = 'public-back-button';
      back.textContent = '← Voltar para a apresentação';
      back.addEventListener('click',showLanding);
      auth.appendChild(back);
    }

    const app = $('#appView');
    if (app) new MutationObserver(() => {
      if (!app.hidden) {
        if ($('#publicLanding')) $('#publicLanding').hidden = true;
        if ($('#authView')) $('#authView').hidden = true;
      }
    }).observe(app,{attributes:true,attributeFilter:['hidden']});

    const signupPanel = $('#signupPanel');
    if (signupPanel) new MutationObserver(polishSignupStatus).observe(signupPanel,{childList:true,subtree:true});
    polishSignupStatus();
  }

  async function init(){
    loadStyle();
    createLanding();
    bind();
    const {data:{session}} = cfg.supabaseUrl && cfg.supabasePublishableKey && window.supabase
      ? await window.supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey).auth.getSession()
      : {data:{session:null}};
    if (session) {
      $('#publicLanding').hidden = true;
    } else {
      showLanding();
    }
    loadUnits();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
