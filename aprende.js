/* Guía interactiva · comportamiento de la página (antes en línea en aprende.html) */

/* ===== Cuestionario ===== */
    (function(){
      var answers={};
      document.querySelectorAll('#svyForm [data-q]').forEach(function(group){
        var key=group.getAttribute('data-q');
        group.querySelectorAll('.svyOpt').forEach(function(btn){
          btn.addEventListener('click',function(){
            group.querySelectorAll('.svyOpt').forEach(function(b){b.classList.remove('sel');});
            btn.classList.add('sel');
            answers[key]=btn.textContent.trim();
          });
        });
      });
      var sending=false;
      document.getElementById('svySend').addEventListener('click',function(){
        var btn=this;
        if(sending) return;
        if(!answers.ya_inviertes||!answers.que_te_frena||!answers.como_invertir||!answers.confianza_gestor){
          btn.textContent='Te falta alguna pregunta (la 5 y la 6 son opcionales) :)';
          setTimeout(function(){btn.textContent='Enviar respuesta';},2200);
          return;
        }
        sending=true; btn.textContent='Enviando…';
        var params=new URLSearchParams();
        params.append('entry.1015182126',answers.ya_inviertes);
        params.append('entry.363202559',answers.que_te_frena);
        params.append('entry.57009140',answers.como_invertir);
        params.append('entry.1396764850',answers.confianza_gestor);
        params.append('entry.1108347571',answers.ticket||'—');
        params.append('entry.1491001254',document.getElementById('svyComment').value.trim()||'—');
        params.append('entry.1083500339',document.getElementById('svyEmail').value.trim()||'—');
        fetch('https://docs.google.com/forms/d/e/1FAIpQLSdet8iJQnEs0GSmWf6CKIqWQAod-bfw_iBhPUMCL-FuNzbR1Q/formResponse',{
          method:'POST',
          mode:'no-cors',
          headers:{'Content-Type':'application/x-www-form-urlencoded'},
          body:params.toString()
        }).then(function(){
          document.getElementById('svyForm').classList.add('hidden');
          document.getElementById('svyOk').classList.remove('hidden');
        }).catch(function(){
          sending=false;
          btn.textContent='Error al enviar — inténtalo de nuevo';
          setTimeout(function(){btn.textContent='Enviar respuesta';},2500);
        });
      });
    })();

/* ================= Red de seguridad =================
   Si el CDN de Chart.js no carga, definimos un sustituto mínimo para que
   el resto de la página (navegación, glosario, quiz, calculadoras…) siga
   funcionando; solo quedarían vacíos los lienzos de las gráficas. */
if (typeof Chart === 'undefined') {
  window.Chart = class {
    constructor(){ this.data={labels:[],datasets:[{data:[]},{data:[]},{data:[]}]}; this.scales={}; this.canvas=null; }
    update(){} resize(){} destroy(){}
  };
  Chart.defaults = { font:{}, color:'#51607A', plugins:{ legend:{ labels:{} }, tooltip:{} } };
}

/* ================= Utilidades ================= */
const _eur0 = new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:0});
const _num0 = new Intl.NumberFormat('es-ES',{maximumFractionDigits:0});
// Separador de miles con espacio fino en lugar de punto
const eur0 = { format:(v)=>_eur0.format(v).replace(/\./g,' ') };
const num0 = { format:(v)=>_num0.format(v).replace(/\./g,' ') };
const setP = (el)=>{ const min=+el.min,max=+el.max,v=+el.value; el.style.setProperty('--p',((v-min)/(max-min)*100)+'%'); };
const css = (n)=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();

function animateValue(el, to, fmt){
  const from = el._cur ?? to;
  el._cur = to;
  const start = performance.now(), dur = 550;
  function step(t){
    const k = Math.min(1,(t-start)/dur);
    const e = 1-Math.pow(1-k,3);
    el.textContent = fmt(from + (to-from)*e);
    if(k<1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ================= Progress + scroll spy ================= */
const progress = document.getElementById('progress');
window.addEventListener('scroll', ()=>{
  const h = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.width = (window.scrollY/h*100)+'%';
}, {passive:true});

const navLinks = document.querySelectorAll('[data-nav]');
const spy = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      const id = e.target.id;
      navLinks.forEach(l=>l.classList.toggle('active', l.dataset.nav===id));
    }
  });
}, {rootMargin:'-45% 0px -50% 0px'});
['c1','c2','c3','c4','c5','c6'].forEach(id=>{ const el=document.getElementById(id); if(el) spy.observe(el); });

/* ================= Reveal ================= */
const revObs = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); revObs.unobserve(e.target);} });
},{threshold:0.12});
document.querySelectorAll('.reveal').forEach(el=>revObs.observe(el));

/* ================= Chart.js defaults ================= */
// Renderiza los lienzos a mayor densidad de píxeles (nítidos en cualquier pantalla)
Chart.defaults.devicePixelRatio = Math.min(3, Math.max(2, window.devicePixelRatio || 1));
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.color = css('--muted');
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.boxWidth = 8;
Chart.defaults.plugins.legend.labels.boxHeight = 8;
Chart.defaults.plugins.legend.labels.padding = 16;
// Desactiva los tooltips (el bocadillo negro) en todos los gráficos
Chart.defaults.plugins.tooltip.enabled = false;
Chart.defaults.plugins.tooltip.external = null;

/* ================= 1a · Inflación ================= */
const INF_LABELS = ['2020','2021','2022','2023','2024','2025','2026'];
const INF_PP = [1.000,1.003,0.974,0.899,0.869,0.845,0.823]; // poder de compra restante (IPC España, INE vía Bloomberg)
const infRange = document.getElementById('infRange');
const infAmt = document.getElementById('infAmt');
const infIn = document.getElementById('infIn'), infNow = document.getElementById('infNow'), infLoss = document.getElementById('infLoss');

const infChart = new Chart(document.getElementById('infChart'), {
  type:'line',
  data:{ labels:INF_LABELS, datasets:[{
    label:'Poder de compra real',
    data: INF_PP.map(p=>1000*p),
    borderColor: css('--rose'),
    backgroundColor:(ctx)=>{ const c=ctx.chart.ctx; const g=c.createLinearGradient(0,0,0,300); g.addColorStop(0,'rgba(251,113,133,0.28)'); g.addColorStop(1,'rgba(251,113,133,0)'); return g; },
    fill:true, tension:.35, borderWidth:2.5, pointRadius:3, pointBackgroundColor:css('--rose')
  }]},
  options:{ responsive:true, maintainAspectRatio:false,
    plugins:{ legend:{display:false},
      tooltip:{ callbacks:{ label:(c)=>'Vale '+eur0.format(c.parsed.y) } } },
    scales:{ x:{ grid:{color:'rgba(15,23,42,0.07)'} },
      y:{ grid:{color:'rgba(15,23,42,0.07)'}, ticks:{ callback:v=>eur0.format(v) } } }
  }
});
function updateInflation(){
  const amt = +infRange.value;
  setP(infRange);
  infAmt.textContent = num0.format(amt)+' €';
  const now = Math.round(amt*INF_PP[INF_PP.length-1]);
  infIn.textContent = num0.format(amt)+' €';
  animateValue(infNow, now, v=>num0.format(Math.round(v))+' €');
  animateValue(infLoss, amt-now, v=>'−'+num0.format(Math.round(v))+' €');
  infChart.data.datasets[0].data = INF_PP.map(p=>amt*p);
  infChart.update('none');
}
infRange.addEventListener('input', updateInflation);
updateInflation();

/* ================= 1b · Crisis vs recuperación (2015–2026) =================
   Fuente: Bloomberg. SPXT Index (S&P 500 TR) y NDDUWI Index (MSCI World Net TR),
   en USD, base 100 = 2015. [año, S&P, MSCI World] */
const SERIES = [
  [2015.00,100,100],[2015.50,101,103],[2016.00,101, 99],[2016.50,105,100],[2017.00,114,107],
  [2017.50,124,118],[2018.00,138,130],[2018.50,142,131],[2019.00,132,119],[2019.50,157,139],
  [2020.00,174,152],[2020.16,159,138],[2020.25,140,120],[2020.50,169,143],[2021.00,206,176],
  [2021.50,237,199],[2022.00,265,215],[2022.50,212,171],[2023.00,217,176],[2023.50,254,202],
  [2024.00,274,218],[2024.50,316,243],[2025.00,343,258],[2025.50,364,283],[2026.00,404,313],
  [2026.33,439,347]
];
// Interpolamos para un dibujado fluido, respetando el eje temporal real
const SUB = 6;
function densifyPts(idx){
  const out=[];
  for(let i=0;i<SERIES.length-1;i++){
    for(let s=0;s<SUB;s++){
      const k=s/SUB;
      out.push({
        x: Math.round((SERIES[i][0] + (SERIES[i+1][0]-SERIES[i][0])*k)*1000)/1000,
        y: Math.round((SERIES[i][idx] + (SERIES[i+1][idx]-SERIES[i][idx])*k)*100)/100
      });
    }
  }
  const last=SERIES[SERIES.length-1];
  out.push({x:last[0], y:last[idx]});
  return out;
}
const SP_D = densifyPts(1), MW_D = densifyPts(2);
const CRISES = [
  {x:2020.25, t:'COVID', short:'COVID'},
  {x:2022.16, t:'Ucrania', short:'Ucrania'},
  {x:2025.50, t:'Irán', short:'Irán'}
];

let revealed = false, playing = false;

const crisisPlugin = {
  id:'crisisMarks',
  afterDatasetsDraw(chart){
    // Sin datos (gráfica en blanco): no dibujamos rayas ni globos.
    if(!(chart.data.datasets[0].data||[]).length) return;
    const {ctx, chartArea} = chart;
    const {top,bottom,left,right} = chartArea;
    const x = chart.scales.x;
    const narrow = (right-left) < 520;
    ctx.save();
    let lastRight = -1e9;   // para evitar que las insignias se solapen (todas al mismo nivel)
    CRISES.forEach((cr,idx)=>{
      const px = x.getPixelForValue(cr.x);
      // línea vertical roja marcada
      ctx.strokeStyle='rgba(225,29,72,0.30)'; ctx.setLineDash([5,4]); ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(px,top); ctx.lineTo(px,bottom); ctx.stroke();
      ctx.setLineDash([]);
      // punto en la parte superior de la línea
      ctx.fillStyle=css('--rose'); ctx.beginPath(); ctx.arc(px, top, 3, 0, Math.PI*2); ctx.fill();
      // insignia con el nombre (todas a la misma altura)
      const label = narrow ? cr.short : cr.t;
      ctx.font='700 '+(narrow?10:11)+'px Inter';
      const tw = ctx.measureText(label).width;
      const padX = narrow?6:9, h = narrow?17:20, w = tw+padX*2;
      let bx = Math.max(left, Math.min(px - w/2, right - w));
      if(bx < lastRight + 5) bx = lastRight + 5;        // separa si se tocarían
      bx = Math.min(bx, right - w);
      lastRight = bx + w;
      const by = top - 8 - h;
      ctx.beginPath();
      if(ctx.roundRect) ctx.roundRect(bx, by, w, h, h/2); else ctx.rect(bx,by,w,h);
      ctx.fillStyle='rgba(225,29,72,0.10)'; ctx.fill();
      ctx.strokeStyle='rgba(225,29,72,0.55)'; ctx.lineWidth=1.25; ctx.stroke();
      ctx.fillStyle='#9F1239'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(label, bx+w/2, by+h/2+0.5);
    });
    ctx.restore();
  }
};

// Etiqueta con el valor final (€) al extremo derecho de cada línea
const crisisEndLabels = {
  id:'crisisEndLabels',
  afterDatasetsDraw(chart){
    const d0=chart.data.datasets[0].data||[]; if(!d0.length) return;
    const ctx=chart.ctx;
    const label=(mi,color)=>{
      const pts=chart.getDatasetMeta(mi).data; if(!pts.length) return;
      const last=pts[pts.length-1]; const v=chart.data.datasets[mi].data[chart.data.datasets[mi].data.length-1].y;
      ctx.save();
      ctx.font='700 13px "Roboto Mono", monospace';
      ctx.fillStyle=color; ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.fillText(Math.round(v)+' €', last.x+9, last.y);
      ctx.restore();
    };
    label(1,'#64748B');
    label(0,'#059669');
  }
};
const crisisChart = new Chart(document.getElementById('crisisChart'), {
  type:'line',
  data:{ datasets:[
    { label:'S&P 500', data:[], borderColor:'#059669', borderWidth:3, tension:.35, pointRadius:0, pointHoverRadius:5,
      backgroundColor:(ctx)=>{ const c=ctx.chart.ctx; const g=c.createLinearGradient(0,0,0,380); g.addColorStop(0,'rgba(5,150,105,0.22)'); g.addColorStop(1,'rgba(5,150,105,0)'); return g; }, fill:true },
    { label:'MSCI World', data:[], borderColor:'#64748B', borderWidth:2.5, tension:.35, pointRadius:0, pointHoverRadius:5, fill:false }
  ]},
  options:{ responsive:true, maintainAspectRatio:false, layout:{padding:{top:44, left:16, right:58}}, parsing:false,
    interaction:{mode:'index',intersect:false},
    plugins:{ legend:{position:'bottom',align:'center', labels:{padding:18, boxWidth:8, boxHeight:8}},
      tooltip:{ callbacks:{
        title:(it)=> 'Año '+Math.floor(it[0].parsed.x),
        label:(c)=> c.dataset.label+': '+Math.round(c.parsed.y)+' €' } } },
    scales:{
      x:{ type:'linear', min:2015, max:2026.33, grid:{display:false}, border:{color:'rgba(15,23,42,0.12)'},
          afterBuildTicks:(a)=>{ a.ticks=[2016,2018,2020,2022,2024,2026].map(v=>({value:v})); },
          ticks:{ maxRotation:0, color:css('--faint'), callback:(v)=> ''+v } },
      y:{ type:'linear', min:90, max:470, border:{display:false},
          grid:{ color:'rgba(15,23,42,0.07)', drawTicks:false },
          afterBuildTicks:(a)=>{ a.ticks=[100,200,300,400].map(v=>({value:v})); },
          ticks:{ display:false }, title:{display:false} } }
  },
  plugins:[crisisPlugin, crisisEndLabels]
});

const recBtn = document.getElementById('recBtn');
const recBadge = document.getElementById('recBadge');
const crisisCaption = document.getElementById('crisisCaption');
function setCrisisData(n){
  crisisChart.data.datasets[0].data = SP_D.slice(0,n);
  crisisChart.data.datasets[1].data = MW_D.slice(0,n);
  crisisChart.update('none');
}
function resetCrisis(){
  revealed=false;
  setCrisisData(0);
  recBtn.textContent='Ver qué pasó después';
  crisisCaption.textContent='Empieza en blanco. Pulsa y mira cómo evolucionan esos 100 € año a año.';
  crisisCaption.style.color=css('--muted');
  recBadge.classList.add('pointer-events-none'); recBadge.style.maxHeight='0'; recBadge.style.opacity='0'; recBadge.style.marginTop='0';
}
function playCrisis(){
  if(playing) return;
  playing=true; revealed=true;
  recBadge.classList.add('pointer-events-none'); recBadge.style.maxHeight='0'; recBadge.style.opacity='0'; recBadge.style.marginTop='0';
  recBtn.textContent='Dibujando…';
  crisisCaption.textContent='Míralo avanzar: cada bajón es una de las crisis marcadas arriba…';
  crisisCaption.style.color=css('--muted');
  const total=SP_D.length, dur=3200, start=performance.now();
  function frame(t){
    const k=Math.min(1,(t-start)/dur);
    setCrisisData(Math.max(1, Math.round(k*total)));
    if(k<1){ requestAnimationFrame(frame); }
    else{
      playing=false;
      recBtn.textContent='Volver a empezar';
      crisisCaption.textContent='Cada crisis fue solo un bache: esos 100 € hoy valen más del triple.';
      crisisCaption.style.color=css('--emerald2');
      recBadge.classList.remove('pointer-events-none'); recBadge.style.maxHeight='500px'; recBadge.style.opacity='1'; recBadge.style.marginTop='1.25rem';
    }
  }
  requestAnimationFrame(frame);
}
recBtn.addEventListener('click', ()=>{
  if(playing) return;
  if(revealed) resetCrisis(); else playCrisis();
});
resetCrisis();

/* ================= 2 · Glosario ================= */
const GLOSSARY = [
  {icon:'<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="color:rgba(15,23,42,0.26);filter:drop-shadow(0 1.5px 0 rgba(255,255,255,0.95))"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>', t:'Acción', s:'Un trozo de una empresa', b:'Comprar una acción de Apple es ser dueño de un trocito diminuto de Apple. Si a la empresa le va bien, tu trozo vale más.'},
  {icon:'<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="color:rgba(15,23,42,0.26);filter:drop-shadow(0 1.5px 0 rgba(255,255,255,0.95))"><path d="M12 3v18"/><path d="M4 7h16"/><path d="M7 7l-3 5a2.5 2.5 0 0 0 6 0z"/><path d="M17 7l-3 5a2.5 2.5 0 0 0 6 0z"/><path d="M8 21h8"/></svg>', t:'Renta fija vs variable', s:'Prestar vs ser socio', b:'Renta fija = prestas dinero y te devuelven con interés (menos riesgo, menos premio). Variable = eres socio (más riesgo, más potencial).'},
  {icon:'<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="color:rgba(15,23,42,0.26);filter:drop-shadow(0 1.5px 0 rgba(255,255,255,0.95))"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>', t:'Diversificación', s:'El almuerzo gratis', b:'No pongas todos los huevos en una cesta. Repartir entre muchas empresas y países reduce el riesgo sin sacrificar rendimiento. Lo más cerca de un "gratis" en finanzas.'},
  {icon:'<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="color:rgba(15,23,42,0.26);filter:drop-shadow(0 1.5px 0 rgba(255,255,255,0.95))"><line x1="3" y1="20" x2="21" y2="20"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="12" y1="20" x2="12" y2="8"/><line x1="18" y1="20" x2="18" y2="4"/></svg>', t:'Índice e indexación', s:'Compra el pajar', b:'Un índice (S&P 500) mide un grupo de empresas. Indexarte = comprar todas de golpe. No busques la aguja: compra el pajar entero.'},
  {icon:'<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="color:rgba(15,23,42,0.26);filter:drop-shadow(0 1.5px 0 rgba(255,255,255,0.95))"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/></svg>', t:'Gestión activa vs pasiva', s:'Comisiones que pesan', b:'Activa: un gestor intenta ganar al mercado, algo que casi nunca consigue, y cobra caro por intentarlo. Pasiva: replica el índice por casi nada. A largo plazo, las comisiones deciden.'},
  {icon:'<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="color:rgba(15,23,42,0.26);filter:drop-shadow(0 1.5px 0 rgba(255,255,255,0.95))"><path d="M21 8a9 9 0 0 0-15-3.7L3 7"/><path d="M3 4v3h3"/><path d="M3 16a9 9 0 0 0 15 3.7L21 17"/><path d="M21 20v-3h-3"/></svg>', t:'Fondo vs ETF', s:'La ventaja fiscal', b:'Ambos son cestas de acciones. En España el FONDO tiene un truco: puedes traspasar a otro fondo sin pagar impuestos hasta que retiras. El ETF no.'},
];
const gEl = document.getElementById('glossary');
GLOSSARY.forEach(g=>{
  const card = document.createElement('div');
  card.className='flip h-48 sm:h-56';
  card.innerHTML = `
    <div class="flip-inner">
      <div class="flip-face glass card-hover justify-between">
        <div>${g.icon}</div>
        <div>
          <h4 class="font-display text-xl font-semibold">${g.t}</h4>
          <p class="text-sm text-[color:var(--muted)] mt-1">${g.s}</p>
        </div>
        <svg class="self-end" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:rgba(15,23,42,0.20); filter:drop-shadow(0 1px 0 rgba(255,255,255,0.9))"><path d="M3 12a9 9 0 1 0 9-9 9 9 0 0 0-6.4 2.6L3 8"/><path d="M3 3v5h5"/></svg>
      </div>
      <div class="flip-face flip-back glass-hi justify-between" style="background:linear-gradient(160deg,rgba(16,185,129,0.14),rgba(16,185,129,0.03))">
        <div class="chip" style="color:var(--emerald2)">${g.t}</div>
        <p class="text-sm leading-relaxed flex-1 flex items-center py-2">${g.b}</p>
        <svg class="self-end" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--emerald2); opacity:.7"><path d="M21 12a9 9 0 1 1-9-9 9 9 0 0 1 6.4 2.6L21 8"/><path d="M21 3v5h-5"/></svg>
      </div>
    </div>`;
  card.addEventListener('click', ()=>card.classList.toggle('flipped'));
  gEl.appendChild(card);
});

/* ================= 2b · Las dos fuerzas: rentabilidad vs riesgo ================= */
/* ================= 3 · Interés compuesto ================= */
const ciInitial=document.getElementById('ciInitial'), ciMonthly=document.getElementById('ciMonthly'), ciYears=document.getElementById('ciYears'), ciRate=document.getElementById('ciRate');
const ciIlbl=document.getElementById('ciIlbl'), ciMlbl=document.getElementById('ciMlbl'), ciYlbl=document.getElementById('ciYlbl'), ciRlbl=document.getElementById('ciRlbl');
const ciPrincipal=document.getElementById('ciPrincipal'), ciFinal=document.getElementById('ciFinal'), ciGain=document.getElementById('ciGain');

const ciChart = new Chart(document.getElementById('ciChart'), {
  type:'line',
  data:{ labels:[], datasets:[
    { label:'Invertido (interés compuesto)', data:[], borderColor:css('--emerald2'), borderWidth:3, tension:.3, pointRadius:0,
      backgroundColor:(ctx)=>{ const c=ctx.chart.ctx; const g=c.createLinearGradient(0,0,0,420); g.addColorStop(0,'rgba(52,211,153,0.30)'); g.addColorStop(1,'rgba(52,211,153,0)'); return g; }, fill:true },
    { label:'Ahorrado (bajo el colchón)', data:[], borderColor:css('--faint'), borderWidth:2, tension:.1, pointRadius:0, borderDash:[6,5], fill:false }
  ]},
  options:{ responsive:true, maintainAspectRatio:false,
    interaction:{mode:'index',intersect:false},
    plugins:{ legend:{position:'top',align:'end'},
      tooltip:{ callbacks:{ title:(it)=>'Año '+it[0].label, label:(c)=>c.dataset.label+': '+eur0.format(c.parsed.y) } } },
    scales:{ x:{ grid:{display:false}, ticks:{maxRotation:0, autoSkip:true, maxTicksLimit:9}, title:{display:true,text:'Años',color:css('--faint')} },
      y:{ grid:{color:'rgba(15,23,42,0.07)'}, ticks:{ callback:v=> v>=1000? (v/1000)+'k€' : v+' €' } } }
  }
});
function computeCompound(){
  const I=+ciInitial.value, P=+ciMonthly.value, Y=+ciYears.value, R=+ciRate.value;
  setP(ciInitial); setP(ciMonthly); setP(ciYears); setP(ciRate);
  ciIlbl.textContent = num0.format(I)+' €';
  ciMlbl.textContent = num0.format(P)+' €';
  ciYlbl.textContent = Y+(Y===1?' año':' años');
  ciRlbl.textContent = (R%1===0?R:R.toFixed(1))+'%';
  const r = R/100/12;
  const labels=[], inv=[], sav=[];
  for(let y=0;y<=Y;y++){
    const n=y*12;
    labels.push(y);
    const principal = I + P*n;
    const fv = (r===0 ? principal : I*Math.pow(1+r,n) + P*((Math.pow(1+r,n)-1)/r));
    sav.push(Math.round(principal));
    inv.push(Math.round(fv));
  }
  ciChart.data.labels=labels;
  ciChart.data.datasets[0].data=inv;
  ciChart.data.datasets[1].data=sav;
  ciChart.update('none');
  const principal=I + P*Y*12;
  const final=inv[inv.length-1];
  animateValue(ciPrincipal, principal, v=>eur0.format(Math.round(v)));
  animateValue(ciFinal, final, v=>eur0.format(Math.round(v)));
  animateValue(ciGain, final-principal, v=>eur0.format(Math.round(v)));
}
[ciInitial,ciMonthly,ciYears,ciRate].forEach(s=>s.addEventListener('input',computeCompound));
computeCompound();

/* ================= 3b · Simulador de comisiones ================= */
const feeRange=document.getElementById('feeRange'), feeLbl=document.getElementById('feeLbl');
const feeIndexed=document.getElementById('feeIndexed'), feeActive=document.getElementById('feeActive'), feeLoss=document.getElementById('feeLoss');
const FEE_P=100, FEE_Y=30, FEE_GROSS=8, FEE_INDEX=0.20;
function fvMonthly(P, years, annualPct){
  const r=annualPct/100/12, n=years*12;
  return r===0 ? P*n : P*((Math.pow(1+r,n)-1)/r);
}
const feeChart = new Chart(document.getElementById('feeChart'), {
  type:'bar',
  data:{ labels:['Indexado 0,20%','Tu fondo'], datasets:[{
    data:[Math.round(fvMonthly(FEE_P,FEE_Y,FEE_GROSS-FEE_INDEX)), Math.round(fvMonthly(FEE_P,FEE_Y,FEE_GROSS-(+feeRange.value)))],
    backgroundColor:(c)=>{
      const {chart,dataIndex}=c; const area=chart.chartArea; if(!area) return 'rgba(16,185,129,0.6)';
      const g=chart.ctx.createLinearGradient(0,area.bottom,0,area.top);
      if(dataIndex===0){ g.addColorStop(0,'rgba(52,211,153,0.5)'); g.addColorStop(1,'rgba(5,150,105,0.95)'); }
      else { g.addColorStop(0,'rgba(251,113,133,0.4)'); g.addColorStop(1,'rgba(225,29,72,0.85)'); }
      return g;
    },
    borderRadius:{topLeft:12,topRight:12,bottomLeft:0,bottomRight:0}, borderSkipped:false,
    barPercentage:0.62, categoryPercentage:0.8, maxBarThickness:110 }]},
  options:{ responsive:true, maintainAspectRatio:false, layout:{padding:{top:10}},
    plugins:{ legend:{display:false}, tooltip:{ callbacks:{ label:(c)=>eur0.format(c.parsed.y) } } },
    scales:{ x:{ grid:{display:false}, border:{display:false}, ticks:{ color:css('--muted'), font:{size:12} } },
      y:{ beginAtZero:true, grid:{color:'rgba(15,23,42,0.06)'}, border:{display:false}, ticks:{ maxTicksLimit:5, color:css('--faint'), callback:v=> v>=1000? (v/1000)+'k€' : v+' €' } } }
  }
});
function updateFees(){
  const fee=+feeRange.value; setP(feeRange);
  feeLbl.textContent=fee.toFixed(2).replace('.',',')+'%';
  const a=fvMonthly(FEE_P,FEE_Y,FEE_GROSS-FEE_INDEX);
  const b=fvMonthly(FEE_P,FEE_Y,FEE_GROSS-fee);
  animateValue(feeIndexed,a,v=>eur0.format(Math.round(v)));
  animateValue(feeActive,b,v=>eur0.format(Math.round(v)));
  animateValue(feeLoss,a-b,v=>'−'+eur0.format(Math.round(Math.max(0,v))));
  feeChart.data.datasets[0].data=[Math.round(a),Math.round(b)];
  feeChart.update('none');
}
feeRange.addEventListener('input',updateFees);
updateFees();
// El gráfico se dibuja siempre; al entrar en pantalla se reajusta y anima suavemente
new IntersectionObserver((ents,obs)=>{ ents.forEach(e=>{ if(e.isIntersecting){ feeChart.resize(); feeChart.update(); obs.unobserve(e.target); } }); },{threshold:0.2}).observe(document.getElementById('feeChart'));

/* ================= 3c · Capacidad de riesgo por edad ================= */
const RISK_AGES = ['20','25','30','35','40','45','50','55','60','65','70'];
const RISK_VAL  = [95,95,88,80,70,60,50,40,30,22,15];
const RISK_PTS  = [20,25,30,35,40,45,50,55,60,65,70];
function riskAt(age){
  if(age<=RISK_PTS[0]) return RISK_VAL[0];
  if(age>=RISK_PTS[RISK_PTS.length-1]) return RISK_VAL[RISK_VAL.length-1];
  for(let i=0;i<RISK_PTS.length-1;i++){
    if(age>=RISK_PTS[i]&&age<=RISK_PTS[i+1]){ const t=(age-RISK_PTS[i])/(RISK_PTS[i+1]-RISK_PTS[i]); return Math.round(RISK_VAL[i]+(RISK_VAL[i+1]-RISK_VAL[i])*t); }
  }
  return RISK_VAL[0];
}
let riskAge = 25;
const riskBand = {
  id:'riskBand',
  beforeDatasetsDraw(chart){
    const {ctx, chartArea:{top,bottom}, scales:{x}} = chart;
    const x0 = x.getPixelForValue(0), x1 = x.getPixelForValue(1);
    ctx.save();
    ctx.fillStyle='rgba(16,185,129,0.13)';
    ctx.fillRect(x0, top, x1-x0, bottom-top);
    ctx.strokeStyle='rgba(16,185,129,0.55)'; ctx.setLineDash([5,4]); ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(x1,top); ctx.lineTo(x1,bottom); ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
  }
};
const riskMarker = {
  id:'riskMarker',
  afterDatasetsDraw(chart){
    const {ctx, chartArea:{left,right,bottom}, scales:{y}} = chart;
    const frac=Math.max(0,Math.min(1,(riskAge-20)/50));
    const px=left+frac*(right-left);
    const py=y.getPixelForValue(riskAt(riskAge));
    ctx.save();
    ctx.strokeStyle='rgba(16,185,129,0.55)'; ctx.setLineDash([4,4]); ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px,bottom); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle='#fff'; ctx.strokeStyle=css('--emerald2'); ctx.lineWidth=3.5;
    ctx.beginPath(); ctx.arc(px,py,6,0,Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
};
const riskChart = new Chart(document.getElementById('riskChart'), {
  type:'line',
  data:{ labels:RISK_AGES, datasets:[{
    label:'Capacidad para asumir riesgo', data:RISK_VAL,
    borderColor:css('--emerald2'), borderWidth:3, tension:.4, pointRadius:0,
    backgroundColor:(ctx)=>{ const c=ctx.chart.ctx; const g=c.createLinearGradient(0,0,0,340); g.addColorStop(0,'rgba(16,185,129,0.30)'); g.addColorStop(1,'rgba(16,185,129,0)'); return g; }, fill:true
  }]},
  options:{ responsive:true, maintainAspectRatio:false,
    plugins:{ legend:{display:false}, tooltip:{enabled:false} },
    scales:{ x:{ grid:{display:false}, ticks:{maxRotation:0}, title:{display:true,text:'Tu edad',color:css('--faint')} },
      y:{ grid:{color:'rgba(15,23,42,0.07)'}, min:0, max:100, ticks:{callback:v=>v+'%'}, title:{display:true,text:'Margen para arriesgar',color:css('--faint')} } }
  },
  plugins:[riskBand, riskMarker]
});
const riskAgeEl=document.getElementById('riskAge'), riskAgeLbl=document.getElementById('riskAgeLbl'), riskPct=document.getElementById('riskPct'), riskMsg=document.getElementById('riskMsg');
function updateRisk(){
  riskAge=+riskAgeEl.value; setP(riskAgeEl);
  riskAgeLbl.textContent=riskAge+' años';
  riskPct.textContent=riskAt(riskAge)+'%';
  let m;
  if(riskAge<=25) m='de margen para asumir riesgo. Estás en tu mejor momento: aprovéchalo al máximo.';
  else if(riskAge<=40) m='de margen. Aún tienes el tiempo de tu lado para asumir bastante riesgo.';
  else if(riskAge<=55) m='de margen. Toca ir moderando: baja el riesgo según se acerca la meta.';
  else m='de margen. Prioriza proteger lo acumulado con menos riesgo.';
  riskMsg.textContent=m;
  riskChart.update('none');
}
riskAgeEl.addEventListener('input',updateRisk);
updateRisk();

/* ================= 4 · Vinted steps ================= */
document.querySelectorAll('.stepBtn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.stepBtn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const s=btn.dataset.step;
    document.querySelectorAll('.stepPane').forEach(p=>p.classList.toggle('hidden', p.dataset.pane!==s));
  });
});
// step 2 demand
let hoodie=45;
const hp=document.getElementById('hoodiePrice'), hf=document.getElementById('hoodieFill');
function renderHoodie(){ hp.textContent=hoodie+' €'; hf.style.width=Math.max(5,Math.min(100,hoodie))+'%'; }
document.getElementById('demandUp').addEventListener('click', ()=>{ hoodie=Math.min(95,hoodie+12); renderHoodie(); });
document.getElementById('demandDown').addEventListener('click', ()=>{ hoodie=Math.max(8,hoodie-12); renderHoodie(); });
// step 3 arbitrage
const arbA=document.getElementById('arbA'), arbB=document.getElementById('arbB');
document.getElementById('arbBtn').addEventListener('click', ()=>{
  let a=40,b=50,steps=0;
  const iv=setInterval(()=>{ a=Math.min(45,a+1); b=Math.max(45,b-1); arbA.textContent=a+' €'; arbB.textContent=b+' €';
    if(++steps>=5){ clearInterval(iv); arbA.classList.add('grad-em'); arbB.classList.remove('text-rose-300'); arbB.classList.add('grad-em'); }
  },80);
});

/* ================= 5 · Decoder ================= */
const TOKENS = [
  {w:'Vanguard', role:'Gestora', d:'La empresa que gestiona el fondo. Vanguard es de las más grandes y baratas del mundo.'},
  {w:'Global', role:'Mercado', d:'Dónde invierte: "Global" = empresas de todo el mundo desarrollado.'},
  {w:'Stock', role:'Activo', d:'"Stock" = acciones. Es renta variable, no bonos ni deuda.'},
  {w:'Index', role:'Indexado', d:'Replica un índice de forma pasiva. Es decir: comisiones mínimas.'},
  {w:'Fund', role:'Vehículo', d:'Es un fondo de inversión (no un ETF): en España permite traspasos sin tributar.'},
  {w:'EUR', role:'Divisa', d:'La clase del fondo está en euros. Práctico si tu dinero está en euros.'},
  {w:'Acc', role:'Acumulación', d:'Reinvierte los dividendos automáticamente en vez de repartirlos. Más interés compuesto y menos papeleo fiscal.'},
];
const dec = document.getElementById('decoder');
const decRole = document.getElementById('decRole'), decDesc = document.getElementById('decDesc');
const decWord = document.getElementById('decWord'), decPos = document.getElementById('decPos');
const decDots = document.getElementById('decDots');
let decIdx = 0;
const decVisited = new Set();
TOKENS.forEach((tk,i)=>{
  const b=document.createElement('button');
  b.className='tok font-display font-semibold text-base sm:text-lg px-3 py-1.5 rounded-xl';
  b.textContent=tk.w;
  b.addEventListener('click', ()=>selectTok(i));
  dec.appendChild(b);
  const dot=document.createElement('button');
  dot.className='decDot';
  dot.setAttribute('aria-label','Ir a la palabra '+tk.w);
  dot.addEventListener('click', ()=>selectTok(i));
  decDots.appendChild(dot);
});
function selectTok(i){
  decIdx = i; decVisited.add(i);
  [...dec.children].forEach((c,ci)=>{
    c.classList.toggle('on', ci===i);
    c.classList.toggle('seen', ci!==i && decVisited.has(ci));
  });
  [...decDots.children].forEach((d,ci)=>{
    d.classList.toggle('on', ci===i);
    d.classList.toggle('seen', decVisited.has(ci));
  });
  decWord.textContent = TOKENS[i].w;
  decRole.textContent = TOKENS[i].role;
  decDesc.textContent = TOKENS[i].d;
  decPos.textContent = (i+1)+' / '+TOKENS.length;
}
document.getElementById('decPrev').addEventListener('click', ()=>selectTok((decIdx-1+TOKENS.length)%TOKENS.length));
document.getElementById('decNext').addEventListener('click', ()=>selectTok((decIdx+1)%TOKENS.length));
selectTok(0);

/* ================= 5 · Copy ISIN ================= */
document.querySelectorAll('.copyBtn').forEach(btn=>{
  const orig = btn.innerHTML;
  let t;
  btn.addEventListener('click', async (e)=>{
    e.preventDefault(); e.stopPropagation();
    const isin=btn.dataset.isin;
    try{ await navigator.clipboard.writeText(isin); }
    catch(err){ const ta=document.createElement('textarea'); ta.value=isin; document.body.appendChild(ta); ta.select(); try{document.execCommand('copy');}catch(_){} ta.remove(); }
    btn.classList.add('copied');
    btn.innerHTML='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>¡Copiado!';
    clearTimeout(t);
    t=setTimeout(()=>{ btn.classList.remove('copied'); btn.innerHTML=orig; }, 1500);
  });
});

/* ================= 5 · Quiz ================= */
const QUIZ = [
  { q:'¿Qué significa "Time in the market beats timing the market"?',
    o:['Hay que adivinar el mejor día para entrar','Importa más el tiempo invertido que acertar el momento','Cuanto más operas, más ganas'], a:1 },
  { q:'¿Cuál es la ventaja fiscal clave de los fondos indexados en España?',
    o:['No pagan nunca impuestos','Puedes traspasar entre fondos sin tributar hasta retirar','Dan dividendos garantizados'], a:1 },
  { q:'Con interés compuesto, tu mayor activo siendo joven es…',
    o:['Tener mucho dinero de golpe','El tiempo','Elegir la acción de moda'], a:1 },
];
const quizEl=document.getElementById('quiz');
let answers = new Array(QUIZ.length).fill(null);
function renderQuiz(){
  quizEl.innerHTML='';
  answers = new Array(QUIZ.length).fill(null);
  document.getElementById('quizResult').classList.add('hidden');
  QUIZ.forEach((item,qi)=>{
    const block=document.createElement('div');
    block.innerHTML = `<p class="font-semibold mb-3"><span class="mono text-emerald-300 text-sm mr-2">Q${qi+1}</span>${item.q}</p>`;
    const opts=document.createElement('div'); opts.className='grid gap-2';
    item.o.forEach((opt,oi)=>{
      const b=document.createElement('button');
      b.className='quizOpt text-left text-sm px-4 py-3 rounded-xl glass-hi border border-white/10 hover:border-white/25 transition';
      b.textContent=opt;
      b.addEventListener('click', ()=>{
        if(answers[qi]!==null) return;
        answers[qi]=oi;
        [...opts.children].forEach((c,ci)=>{
          c.style.pointerEvents='none';
          if(ci===item.a){ c.classList.add('!border-emerald-400'); c.style.background='rgba(16,185,129,0.12)'; }
          else if(ci===oi){ c.classList.add('!border-rose-400'); c.style.background='rgba(251,113,133,0.10)'; }
        });
        if(answers.every(a=>a!==null)) showResult();
      });
      opts.appendChild(b);
    });
    block.appendChild(opts);
    quizEl.appendChild(block);
  });
}
function showResult(){
  const score=answers.reduce((s,a,i)=>s+(a===QUIZ[i].a?1:0),0);
  document.getElementById('quizScore').textContent=score+' / '+QUIZ.length;
  const msgs=['Repasa la sección 03, ¡el interés compuesto es clave!','Vas por buen camino, casi lo tienes.','¡Buen tino! Ya piensas como inversor.','Impecable. Ya tienes las ideas claras para empezar.'];
  document.getElementById('quizMsg').textContent=msgs[score];
  document.getElementById('quizResult').classList.remove('hidden');
}
document.getElementById('quizReset').addEventListener('click', renderQuiz);
renderQuiz();


/* ================= Antes de invertir (acordeón) ================= */
document.querySelectorAll('.preHead').forEach(h=>{
  h.addEventListener('click', ()=>{
    const item = h.parentElement;
    const body = item.querySelector('.preBody');
    body.classList.toggle('hidden');
    const opened = !body.classList.contains('hidden');
    item.classList.toggle('open', opened);
    const ch = h.querySelector('.preChevron'); if(ch) ch.classList.toggle('rotate-180', opened);
  });
});

/* ================= Ranking de plataformas (acordeón) ================= */
document.querySelectorAll('.rankHead').forEach(h=>{
  h.addEventListener('click', ()=>{
    const item = h.parentElement;
    const body = item.querySelector('.rankBody');
    body.classList.toggle('hidden');
    const opened = !body.classList.contains('hidden');
    item.classList.toggle('open', opened);
    const ch = h.querySelector('.rank-chevron'); if(ch) ch.classList.toggle('rotate-180', opened);
    const tx = h.querySelector('.rank-toggle-text'); if(tx) tx.textContent = opened ? 'Ocultar' : (h.dataset.label||'Ver más');
  });
});
