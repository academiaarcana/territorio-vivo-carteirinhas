const cfg = window.TERRITORIO_VIVO_CONFIG || {};
const hasBackend = Boolean(cfg.supabaseUrl && cfg.supabasePublishableKey && window.supabase);
const sb = hasBackend ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabasePublishableKey) : null;

const DEFAULT_PROFILE = {
  full_name: '', role: 'acs', microarea: '', acs_phone: '',
  unit_name: 'UBS Madre Tereza de Calcutá', team_name: 'Equipe 02',
  unit_phone: '', unit_address: '', unit_hours: '',
  doctor_name: 'Roseane Bastos Santos',
  nurse_name: 'Maria Cecilia Costa Felipini',
  tech_name: 'Joana Rosa de Oliveira Louro'
};

const state = {
  mode: 'local', user: null, profile: { ...DEFAULT_PROFILE },
  currentTemplate: null, currentValues: {}
};

const indicatorNames = [
  'População ativa','Famílias','Pessoas idosas','Gestantes','Pessoas com deficiência',
  'Hipertensão','Diabetes','Tabagismo','Domiciliados','Acamados','Saúde mental',
  'Cadastros para atualizar','Buscas ativas pendentes'
];

const templates = [
  {id:'my-team',category:'family',icon:'⌂',title:'Minha ACS e Minha Equipe',description:'Referência simples para a família saber quem acompanha seu território.',tags:['Família','Leitura fácil'],fields:[{id:'note',label:'Recado opcional',type:'textarea'}],note:'Guarde esta carteirinha. Ela mostra quem é sua referência na UBS.'},
  {id:'welcome',category:'family',icon:'♡',title:'Bem-vindo ao Meu Território',description:'Acolhimento para nova família ou novo morador.',tags:['Acolhimento','2 ou 4/A4'],fields:[{id:'family',label:'Nome da família ou responsável'},{id:'address',label:'Endereço / referência'},{id:'firstContact',label:'Data do primeiro contato',type:'date'},{id:'note',label:'Recado para a família',type:'textarea'}],note:'Conhecer sua família ajuda a equipe a planejar melhor o cuidado.'},
  {id:'appointment',category:'family',icon:'□',title:'Meu Próximo Atendimento',description:'Lembrete visual de dia, hora, local e profissional.',tags:['Família','8/A4'],fields:[{id:'name',label:'Nome'},{id:'date',label:'Dia',type:'date'},{id:'time',label:'Hora',type:'time'},{id:'service',label:'Com quem / serviço'},{id:'note',label:'Recado ou preparo',type:'textarea'}],note:'Leve esta carteirinha e seus documentos no dia do atendimento.'},
  {id:'update-family',category:'family',icon:'↻',title:'Atualize sua Família',description:'Lembrete para comunicar mudanças importantes à ACS.',tags:['Família','Educação'],fields:[{id:'reference',label:'Nome / família'},{id:'what',label:'O que precisa atualizar',type:'select',options:['Endereço','Telefone','Pessoas da casa','Nascimento','Gestação','Outra mudança importante']},{id:'note',label:'Observação',type:'textarea'}],note:'Avise sua ACS quando houver mudança de endereço, telefone ou pessoas que moram na casa.'},
  {id:'territory-change',category:'territory',icon:'⌖',title:'O que Mudou no Território?',description:'Registre mudança relevante sem fazer um novo recadastramento.',tags:['ACS','Território'],fields:[{id:'where',label:'Quem / onde'},{id:'what',label:'O que mudou',type:'textarea'},{id:'kind',label:'Tipo',type:'select',options:['Novo morador ou família','Mudança de endereço','Imóvel fechado ou abandonado','Novo comércio, serviço ou equipamento','Risco ambiental ou sanitário','Barreira de acesso','Novo parceiro ou potencialidade','Dado cadastral para atualizar']},{id:'action',label:'Encaminhamento sugerido',type:'textarea'}],note:'Coletar menos por vez, mas aquilo que realmente ajuda a cuidar e planejar.'},
  {id:'priority',category:'territory',icon:'!',title:'Olhar Prioritário',description:'Sinalização breve de pessoa ou família que precisa entrar na discussão da equipe.',tags:['ACS','Cuidado'],fields:[{id:'reference',label:'Pessoa / família / referência'},{id:'reason',label:'Por que precisa de atenção',type:'select',options:['Pessoa idosa com dificuldade','Pessoa com deficiência ou barreira funcional','Gestante ou puérpera','Criança/adolescente em vulnerabilidade','Condição crônica sem acompanhamento','Saúde mental / álcool / tabaco','Barreira de acesso','Necessita visita domiciliar','Outra necessidade']},{id:'now',label:'O que precisa ser feito agora',type:'textarea'},{id:'responsible',label:'Responsável pelo retorno'}],note:'Não é diagnóstico: é uma sinalização para organizar o cuidado.'},
  {id:'risk-resource',category:'territory',icon:'◇',title:'Risco, Recurso ou Potencialidade?',description:'Classifique achados do território e oriente a próxima ação.',tags:['Território','Intersetorial'],fields:[{id:'location',label:'Local / referência'},{id:'classification',label:'Classificação',type:'select',options:['Risco','Ponto de atenção','Potencialidade','Recurso da rede','Precisa articulação intersetorial']},{id:'description',label:'O que foi observado',type:'textarea'},{id:'action',label:'Possível ação / parceria',type:'textarea'}],note:'Nem todo achado é problema. Alguns são recursos que fortalecem o cuidado.'},
  {id:'active-search',category:'territory',icon:'→',title:'Busca Ativa',description:'Organize uma necessidade concreta de localizar ou acompanhar alguém.',tags:['ACS','Seguimento'],fields:[{id:'reference',label:'Pessoa / família / referência'},{id:'reason',label:'Motivo'},{id:'attempt',label:'Tentativa / contato realizado',type:'textarea'},{id:'next',label:'Próximo passo',type:'textarea'}],note:'Registrar o mínimo necessário para que a pendência não se perca.'},
  {id:'system-territory',category:'management',icon:'≠',title:'Sistema × Território',description:'Compare o que está registrado com o que a equipe observa na prática.',tags:['Gestão','Reunião'],fields:[{id:'system',label:'O sistema mostra',type:'textarea'},{id:'territory',label:'No território observamos',type:'textarea'},{id:'unknown',label:'O que ainda não sabemos',type:'textarea'},{id:'action',label:'Próxima ação',type:'textarea'}],note:'Não informado não significa inexistente. A lacuna também orienta o trabalho.'},
  {id:'decision',category:'management',icon:'✓',title:'Achado → Decisão',description:'Registre o que foi decidido, quem fará e quando será revisto.',tags:['Equipe','Continuidade'],fields:[{id:'finding',label:'Achado / situação',type:'textarea'},{id:'decision',label:'Decisão da equipe',type:'textarea'},{id:'responsible',label:'Responsável'},{id:'review',label:'Revisar quando',type:'date'}],note:'O registro ganha sentido quando vira ação e volta para reavaliação.'}
];

const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
const clean = value => String(value ?? '').replace(/[<>]/g,'').trim();
const fallback = (value, text='________________') => clean(value) || text;

function toast(message){
  const old = $('.toast'); if(old) old.remove();
  const el=document.createElement('div'); el.className='toast'; el.textContent=message;
  $('#toastRegion').appendChild(el); setTimeout(()=>el.remove(),2600);
}

function showAuth(){ $('#authView').hidden=false; $('#appView').hidden=true; }
function showApp(){ $('#authView').hidden=true; $('#appView').hidden=false; hydrateProfileUI(); renderTemplates(); renderIndicators(); switchSection('dashboard'); }

async function initAuth(){
  if(!hasBackend){ $('#authStatus').textContent='Backend ainda não configurado. Use o modo demonstração para revisar o visual.'; return; }
  const {data:{session}}=await sb.auth.getSession();
  if(session){ state.mode='online'; state.user=session.user; await loadProfile(); showApp(); }
  sb.auth.onAuthStateChange(async(_event,session)=>{
    if(session){ state.mode='online'; state.user=session.user; await loadProfile(); showApp(); }
    else if(state.mode==='online') showAuth();
  });
}

async function login(event){
  event.preventDefault();
  if(!hasBackend){ $('#authStatus').textContent='O login será ativado quando conectarmos o projeto Supabase.'; return; }
  $('#authStatus').textContent='Entrando…';
  const {error}=await sb.auth.signInWithPassword({email:$('#loginEmail').value.trim(),password:$('#loginPassword').value});
  $('#authStatus').textContent=error? 'Não foi possível entrar. Confira e-mail e senha.' : '';
}

async function logout(){
  if(state.mode==='online' && sb) await sb.auth.signOut();
  state.mode='local'; state.user=null; state.profile={...DEFAULT_PROFILE}; showAuth();
}

function demoAccess(){
  state.mode='local'; state.user={id:'demo'};
  try{ state.profile={...DEFAULT_PROFILE,...JSON.parse(localStorage.getItem('territorio-vivo-profile')||'{}')}; }catch{ state.profile={...DEFAULT_PROFILE}; }
  showApp(); toast('Modo demonstração: nada é enviado para servidor.');
}

async function loadProfile(){
  if(!state.user || !sb) return;
  const {data,error}=await sb.from('profiles').select('*').eq('id',state.user.id).maybeSingle();
  if(error){ console.warn(error); return; }
  state.profile={...DEFAULT_PROFILE,...(data||{})};
}

async function saveProfile(event){
  event.preventDefault();
  const profile={
    ...state.profile,
    full_name:clean($('#profileName').value),microarea:clean($('#profileMicroarea').value),acs_phone:clean($('#profilePhone').value),
    unit_name:clean($('#profileUnit').value),team_name:clean($('#profileTeam').value),unit_phone:clean($('#profileUnitPhone').value),
    unit_address:clean($('#profileAddress').value),unit_hours:clean($('#profileHours').value),doctor_name:clean($('#profileDoctor').value),
    nurse_name:clean($('#profileNurse').value),tech_name:clean($('#profileTech').value)
  };
  state.profile=profile;
  if(state.mode==='online' && sb && state.user){
    const {error}=await sb.from('profiles').upsert({...profile,id:state.user.id},{onConflict:'id'});
    $('#profileStatus').textContent=error?'Não foi possível salvar.':'Perfil salvo.';
    if(error) return;
  }else{
    localStorage.setItem('territorio-vivo-profile',JSON.stringify(profile));
    $('#profileStatus').textContent='Perfil salvo neste dispositivo.';
  }
  hydrateProfileUI(); toast('Dados da equipe atualizados.');
}

function hydrateProfileUI(){
  const p=state.profile;
  $('#sideName').textContent=p.full_name||'ACS'; $('#sideMicroarea').textContent=`Microárea ${p.microarea||'—'}`;
  $('#sideAvatar').textContent=(p.full_name||'A').charAt(0).toUpperCase();
  $('#connectionLabel').textContent=state.mode==='online'?'Conectado':'Modo local'; $('.online-pill').classList.toggle('connected',state.mode==='online');
  $('#fiveMicroarea').value=p.microarea||'';
  const binds={profileName:'full_name',profileMicroarea:'microarea',profilePhone:'acs_phone',profileUnit:'unit_name',profileTeam:'team_name',profileUnitPhone:'unit_phone',profileAddress:'unit_address',profileHours:'unit_hours',profileDoctor:'doctor_name',profileNurse:'nurse_name',profileTech:'tech_name'};
  Object.entries(binds).forEach(([id,key])=>{ if($('#'+id)) $('#'+id).value=p[key]||''; });
  $('#profileSummary').innerHTML=[['ACS',p.full_name||'Preencha seu perfil'],['Microárea',p.microarea||'—'],['UBS',p.unit_name],['Equipe',p.team_name],['Telefone',p.acs_phone||'—'],['Enfermeira(o)',p.nurse_name||'—']].map(([a,b])=>`<div class="summary-item"><small>${a}</small><strong>${escapeHtml(b)}</strong></div>`).join('');
}

function switchSection(id){
  $$('.app-section').forEach(el=>el.classList.toggle('active-section',el.id===id));
  $$('.nav-item').forEach(el=>el.classList.toggle('active',el.dataset.section===id));
  const titles={dashboard:'Bom trabalho no território',cards:'Carteirinhas da UBS',five:'5 minutos do território',indicators:'Indicadores para planejar',education:'Educação em saúde',profile:'Meu perfil e minha equipe'};
  $('#pageTitle').textContent=titles[id]||'Território Vivo';
  if(window.innerWidth<760) window.scrollTo({top:0,behavior:'smooth'});
}

function renderTemplates(filter='all'){
  const items=templates.filter(t=>filter==='all'||t.category===filter);
  $('#templateGrid').innerHTML=items.map(t=>`<article class="template-card"><div class="template-icon">${t.icon}</div><h3>${t.title}</h3><p>${t.description}</p><div class="template-meta">${t.tags.map(x=>`<span>${x}</span>`).join('')}</div><button class="button soft" data-open-template="${t.id}">Preencher</button></article>`).join('');
  $$('[data-open-template]').forEach(btn=>btn.addEventListener('click',()=>openTemplate(btn.dataset.openTemplate)));
}

function openTemplate(id){
  const t=templates.find(x=>x.id===id); if(!t) return;
  state.currentTemplate=t; state.currentValues={};
  $('#dialogTitle').textContent=t.title; $('#dialogDescription').textContent=t.description;
  const groups=t.fields.map(field=>fieldMarkup(field)).join('');
  $('#dynamicCardForm').innerHTML=`<div class="field-group"><h4>Dados da carteirinha</h4>${groups}</div><div class="privacy-banner"><strong>Uso temporário:</strong> estes campos servem apenas para gerar o material. Não serão salvos no perfil do ACS.</div>`;
  $$('#dynamicCardForm input,#dynamicCardForm select,#dynamicCardForm textarea').forEach(el=>{el.addEventListener('input',updateCardPreview);el.addEventListener('change',updateCardPreview)});
  updateCardPreview(); $('#cardDialog').showModal();
}

function fieldMarkup(field){
  const base=`data-card-field="${field.id}" id="card_${field.id}"`;
  if(field.type==='textarea') return `<label>${field.label}<textarea ${base} rows="3"></textarea></label>`;
  if(field.type==='select') return `<label>${field.label}<select ${base}><option value="">Selecione</option>${field.options.map(o=>`<option>${o}</option>`).join('')}</select></label>`;
  return `<label>${field.label}<input ${base} type="${field.type||'text'}" /></label>`;
}

function collectCardValues(){
  const values={}; $$('[data-card-field]').forEach(el=>values[el.dataset.cardField]=clean(el.value)); state.currentValues=values; return values;
}

function updateCardPreview(){
  if(!state.currentTemplate) return;
  const values=collectCardValues();
  $('#cardPreview').innerHTML=''; $('#cardPreview').appendChild(buildGeneratedCard(state.currentTemplate,values));
}

function buildGeneratedCard(t,values){
  const p=state.profile; const card=document.createElement('article'); card.className='generated-card';
  if($('#easyRead')?.checked) card.classList.add('easy-read'); if($('#economyMode')?.checked) card.classList.add('economy');
  const profileFields=t.category==='family' || t.id==='my-team' || t.id==='welcome' ? [
    ['Sua ACS',p.full_name],['Microárea',p.microarea],['Telefone / contato',p.acs_phone],['UBS',p.unit_name],['Equipe',p.team_name]
  ] : [['ACS',p.full_name],['Microárea',p.microarea],['Equipe',p.team_name]];
  if(t.id==='my-team') profileFields.push(['Médica(o)',p.doctor_name],['Enfermeira(o)',p.nurse_name],['Técnica(o)',p.tech_name]);
  const valueFields=t.fields.map(f=>[f.label,values[f.id]]).filter(([,v])=>v);
  card.innerHTML=`<div class="g-head"><div><strong>Território Vivo</strong><small>${escapeHtml(p.unit_name)} • ${escapeHtml(p.team_name)}</small></div><div><strong>SUS</strong><small>Saúde da Família</small></div></div><div class="g-title">${t.title}</div><div class="g-fields">${[...profileFields,...valueFields].map(([label,val])=>`<div class="g-field"><small>${escapeHtml(label)}</small><strong>${escapeHtml(fallback(val))}</strong></div>`).join('')}</div><div class="g-note">${escapeHtml(t.note)}</div>`;
  return card;
}

function printCurrentCard(){
  if(!state.currentTemplate) return;
  const source=buildGeneratedCard(state.currentTemplate,collectCardValues());
  printCards(source,Number($('#printCount').value||4));
}

function printCards(source,count=4){
  const valid=[2,4,8].includes(count)?count:4; const root=$('#printRoot'); root.innerHTML='';
  const sheet=document.createElement('section'); sheet.className=`print-sheet per-${valid}`;
  for(let i=0;i<valid;i++){const slot=document.createElement('div');slot.className='print-slot';slot.appendChild(source.cloneNode(true));sheet.appendChild(slot)}
  root.appendChild(sheet); setTimeout(()=>window.print(),70);
}

async function downloadCurrentCard(){
  if(!state.currentTemplate || !window.html2pdf){ toast('Gerador de PDF indisponível neste momento.'); return; }
  const card=buildGeneratedCard(state.currentTemplate,collectCardValues());
  const wrap=document.createElement('div');wrap.style.padding='12mm';wrap.style.background='#fff';wrap.appendChild(card);document.body.appendChild(wrap);
  await html2pdf().set({margin:0,filename:`${slug(state.currentTemplate.title)}.pdf`,image:{type:'jpeg',quality:.98},html2canvas:{scale:2},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'}}).from(wrap).save();
  wrap.remove();
}

function renderIndicators(){
  $('#indicatorForm').innerHTML=indicatorNames.map((name,i)=>`<div class="indicator-field"><label for="ind_${i}">${name}</label><input id="ind_${i}" inputmode="numeric" placeholder="—" /></div>`).join('');
}

function buildIndicatorCard(){
  const t={title:'Indicadores da Minha Microárea',category:'management',note:'Os números servem para planejar e acompanhar necessidades, não para comparar ACS.'};
  const fields=indicatorNames.map((n,i)=>[n,clean($('#ind_'+i).value)]).filter(([,v])=>v);
  const p=state.profile; const card=document.createElement('article');card.className='generated-card';
  card.innerHTML=`<div class="g-head"><div><strong>Território Vivo</strong><small>${escapeHtml(p.unit_name)} • ${escapeHtml(p.team_name)}</small></div><div><strong>Microárea ${escapeHtml(p.microarea||'—')}</strong><small>${escapeHtml(p.full_name||'ACS')}</small></div></div><div class="g-title">Indicadores da Minha Microárea</div><div class="g-fields">${fields.map(([a,b])=>`<div class="g-field"><small>${escapeHtml(a)}</small><strong>${escapeHtml(b)}</strong></div>`).join('')}</div><div class="g-note">${t.note}</div>`;return card;
}

function printIndicatorCard(){printCards(buildIndicatorCard(),2)}
async function downloadIndicatorCard(){
  if(!window.html2pdf) return; const el=buildIndicatorCard(); const wrap=document.createElement('div');wrap.style.padding='12mm';wrap.appendChild(el);document.body.appendChild(wrap);
  await html2pdf().set({filename:'indicadores-microarea.pdf',html2canvas:{scale:2},jsPDF:{unit:'mm',format:'a4'}}).from(wrap).save();wrap.remove();
}

function printFiveNote(){
  const fake={title:'Nota — 5 minutos do território',category:'management',note:'Levar à reunião para decidir: atualizar, visitar, buscar, notificar, articular ou acompanhar.'};
  const vals={where:clean($('#fiveWhere').value),what:clean($('#fiveWhat').value),decision:clean($('#fiveDecision').value)};
  fake.fields=[{id:'where',label:'Quem / onde'},{id:'what',label:'O que mudou'},{id:'decision',label:'O que precisa ser decidido'}];
  printCards(buildGeneratedCard(fake,vals),8);
}

function showEducation(type){
  const detail=$('#educationDetail'); detail.hidden=false;
  if(type==='pressure'){
    detail.innerHTML=`<span class="section-tag">Pressão arterial</span><h3>Mapa da pressão — leitura simples</h3><p class="muted">Material educativo para conversar com a população. Uma medida isolada não substitui avaliação e diagnóstico pela equipe de saúde.</p><div class="bp-map"><div class="bp-zone"><strong>NORMAL</strong><span>até 120/80 mmHg</span></div><div class="bp-zone"><strong>ATENÇÃO</strong><span>121–139 e/ou 81–89 mmHg</span></div><div class="bp-zone"><strong>ALERTA</strong><span>140/90 mmHg ou mais</span></div></div><ul class="check-list"><li>Medir sentado, após alguns minutos de repouso, seguindo a técnica orientada pela equipe.</li><li>Registrar data, horário e resultado quando estiver acompanhando a pressão em casa.</li><li>Não alterar medicamentos com base apenas em uma medição sem orientação profissional.</li></ul><div class="actions"><button type="button" class="button primary" onclick="window.print()">Imprimir página</button></div><p class="source-note"><strong>Fonte:</strong> Ministério da Saúde — Linha de Cuidado da Hipertensão Arterial Sistêmica; referência complementar: Diretriz Brasileira de Hipertensão Arterial 2025. Conteúdo educativo, não prescrição individual.</p>`;
  }else{
    detail.innerHTML=`<span class="section-tag">Diabetes</span><h3>Como usar insulina — passos essenciais</h3><p class="muted">A dose e o tipo de insulina devem seguir a prescrição. Este material orienta a técnica geral de aplicação e não autoriza mudança de dose.</p><h4>Antes de aplicar</h4><ol class="step-list"><li>Confira o nome da insulina, a dose prescrita e o material de aplicação.</li><li>Escolha um local de aplicação orientado pela equipe e faça rodízio dos pontos para proteger a pele.</li><li>No domicílio, mantenha o local de aplicação limpo e seco; em ambiente institucional, siga a rotina de assepsia.</li></ol><h4>Com caneta</h4><ol class="step-list"><li>Coloque uma agulha nova e teste o fluxo conforme orientação do fabricante.</li><li>Selecione a dose prescrita, introduza a agulha e pressione o botão até completar a aplicação.</li><li>Mantenha a agulha no tecido por pelo menos 10 segundos antes de retirar.</li></ol><h4>Com seringa</h4><ol class="step-list"><li>Prepare a dose prescrita e elimine bolhas de ar quando presentes.</li><li>Introduza a agulha conforme a técnica ensinada pela equipe e injete continuamente.</li><li>Mantenha a agulha por pelo menos 5 segundos antes de retirar.</li></ol><div class="privacy-banner"><strong>Atenção:</strong> agulhas e seringas não devem ser reutilizadas. Descarte perfurocortantes conforme a orientação da UBS.</div><p class="source-note"><strong>Fonte:</strong> Ministério da Saúde — Linha de Cuidado do Diabetes Mellitus tipo 2, “Cuidados com a insulinoterapia”. Conteúdo educativo; em caso de dúvida sobre dose, tipo de insulina, armazenamento ou hipoglicemia, procurar a equipe de saúde.</p>`;
  }
  detail.scrollIntoView({behavior:'smooth',block:'start'});
}

function escapeHtml(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]))}
function slug(v){return clean(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'carteirinha'}

function attachEvents(){
  $('#loginForm').addEventListener('submit',login); $('#demoAccess').addEventListener('click',demoAccess); $('#logoutBtn').addEventListener('click',logout);
  $$('.nav-item').forEach(b=>b.addEventListener('click',()=>switchSection(b.dataset.section))); $$('[data-section-jump]').forEach(b=>b.addEventListener('click',()=>switchSection(b.dataset.sectionJump)));
  $$('.chip').forEach(b=>b.addEventListener('click',()=>{$$('.chip').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderTemplates(b.dataset.cardFilter)}));
  $('#profileForm').addEventListener('submit',saveProfile); $('#closeDialog').addEventListener('click',()=>$('#cardDialog').close());
  $('#easyRead').addEventListener('change',updateCardPreview); $('#economyMode').addEventListener('change',updateCardPreview); $('#printCard').addEventListener('click',printCurrentCard); $('#downloadCard').addEventListener('click',downloadCurrentCard);
  $('#printFive').addEventListener('click',printFiveNote); $('#clearFive').addEventListener('click',()=>{['fiveWhere','fiveWhat','fiveDecision'].forEach(id=>$('#'+id).value='')});
  $('#printIndicators').addEventListener('click',printIndicatorCard); $('#downloadIndicators').addEventListener('click',downloadIndicatorCard);
  $$('[data-education]').forEach(b=>b.addEventListener('click',()=>showEducation(b.dataset.education)));
}

attachEvents();
initAuth();
