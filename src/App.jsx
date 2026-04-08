import { useState, useEffect } from "react";

// ─── SUPABASE ─────────────────────────────────────────────────────────────────
// Supabase — initialised from CDN (loaded in index.html)
const SUPA_URL = "https://xjtxnfxrndnkzorrhzxl.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqdHhuZnhybmRua3pvcnJoenhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NDUwNTgsImV4cCI6MjA5MDMyMTA1OH0.1ntf9v4NZCz5qMh4JaTrBxJkei4QBsUoghsLs3SnCjY";

function getSb() {
  if (window._sb) return window._sb;
  if (window.supabase?.createClient) {
    window._sb = window.supabase.createClient(SUPA_URL, SUPA_KEY);
    return window._sb;
  }
  return null;
}
// Alias for direct use
const sb = { 
  auth: { 
    signUp: (...a) => getSb()?.auth.signUp(...a),
    signInWithPassword: (...a) => getSb()?.auth.signInWithPassword(...a),
    resetPasswordForEmail: (...a) => getSb()?.auth.resetPasswordForEmail(...a),
  },
  from: (table) => getSb()?.from(table),
};

async function supaSignUp(email, password, name, coupleCode=null) {
  const { data: authData, error: authErr } = await sb.auth.signUp({ email, password });
  if (authErr) return { error: authErr.message };
  const uid = authData.user?.id;
  if (!uid) return { error: "Erro ao criar utilizador." };

  const code = coupleCode || ("ATN-" + Math.random().toString(36).substr(2,6).toUpperCase());

  const { error: profErr } = await sb.from("profiles").insert({ id: uid, name, email, couple_code: code });
  if (profErr) return { error: profErr.message };

  if (coupleCode) {
    await sb.from("couples").update({ partner_b: uid }).eq("code", coupleCode);
  } else {
    await sb.from("couples").insert({ code, partner_a: uid });
  }

  return { data: { id: uid, name, email, couple_code: code } };
}

async function supaSignIn(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  const uid = data.user?.id;

  const { data: profile, error: profErr } = await sb.from("profiles").select("*").eq("id", uid).single();
  if (profErr) return { error: profErr.message };

  return { data: { ...profile } };
}

async function supaResetPassword(email) {
  const { error } = await sb.auth.resetPasswordForEmail(email);
  if (error) return { error: error.message };
  return { data: true };
}

async function supaGetAssessments(userId) {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const { data, error } = await sb.from("assessments")
    .select("*")
    .eq("user_id", userId)
    .gte("date", sixMonthsAgo.toISOString().split("T")[0])
    .order("date", { ascending: true });
  if (error) { console.error(error); return []; }
  return data || [];
}

async function supaSaveAssessment(userId, coupleCode, entry) {
  const { data, error } = await sb.from("assessments")
    .insert({ user_id: userId, couple_code: coupleCode, ...entry })
    .select();
  if (error) { console.error(error); return null; }
  return data?.[0] || null;
}

async function supaUpdateAssessment(id, patch) {
  const { error } = await sb.from("assessments").update(patch).eq("id", id);
  if (error) console.error(error);
}

async function supaGetAllCouples() {
  const { data, error } = await sb.from("couples").select("*, partner_a_profile:profiles!couples_partner_a_fkey(name,email,couple_code), partner_b_profile:profiles!couples_partner_b_fkey(name,email,couple_code)");
  if (error) { console.error(error); return []; }
  return data || [];
}

async function supaGetCoupleAssessments(coupleCode) {
  const { data, error } = await sb.from("assessments").select("*, profiles(name)").eq("couple_code", coupleCode).order("date", { ascending: false });
  if (error) { console.error(error); return []; }
  return data || [];
}



// ─── GOOGLE FONTS ─────────────────────────────────────────────────────────────
if (typeof document !== "undefined" && !document.getElementById("att-fonts")) {
  const l = document.createElement("link");
  l.id = "att-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap";
  document.head.appendChild(l);
}

// ─── PALETTE ─────────────────────────────────────────────────────────────────
const C = {
  roxo:"#4C305E", roxoL:"#6b4585",
  lav:"#CBBBC4",  lavL:"#e8dce4",
  gz:"#848290",
  pet:"#2C4951",  petL:"#3d6170",
  iv:"#FAF7F4",   wh:"#FFFFFF",
  bg:"#F5F2F7",
  bad:"#c0605a",  ok:"#4a8a6e", warn:"#c09040",
  sep:"rgba(60,60,67,0.1)",
};

// ─── LOGO ─────────────────────────────────────────────────────────────────────
function Logo({h=24,dark=false}){
  const c=dark?"#fff":C.roxo,a=dark?"rgba(203,187,196,0.85)":C.lav;
  return(<svg height={h} viewBox="0 0 310 52" fill="none" style={{display:"block",flexShrink:0}}>
    <path d="M4 47L18 5L32 47M46 7L98 7M57 7L57 47M87 7L87 47" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M106 7L106 34Q106 47 117 47Q128 47 128 34L128 7" stroke={c} strokeWidth="1.4" strokeLinecap="round" fill="none"/>
    <path d="M136 47L136 7L156 47L156 7M164 7L164 47M164 7L186 7M164 27L182 27M164 47L186 47" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M200 48L216 4L232 48M193 42L240 10" stroke={a} strokeWidth="1.15" strokeLinecap="round"/>
  </svg>);
}

// ─── DATA ─────────────────────────────────────────────────────────────────────
const SAFETY_QS = [
  {id:1, text:"Sinto medo da reação do meu parceiro ou parceira."},
  {id:2, text:"Evito dizer certas coisas para não piorar a situação."},
  {id:3, text:"Sinto que sou controlado/a em excesso."},
  {id:4, text:"Já me senti humilhado/a ou rebaixado/a nesta relação."},
  {id:5, text:"Já existiu agressão física, ameaça física ou intimidação.", critical:true},
  {id:6, text:"Já me senti pressionado/a sexualmente contra a minha vontade.", critical:true},
  {id:7, text:"Sinto que estou a ficar mais isolado/a por causa desta relação."},
  {id:8, text:"Sinto que não posso ser honesto/a sobre o que vivo."},
  {id:9, text:"Quando há conflito, sinto medo em vez de apenas tensão."},
  {id:10,text:"Sinto que a minha segurança emocional está comprometida nesta relação."},
];

const DIMS = [
  {id:"seguranca",   label:"Segurança Emocional",              short:"Segurança",   icon:"◇"},
  {id:"comunicacao", label:"Comunicação e Reparação",           short:"Comunicação", icon:"○"},
  {id:"intimidade",  label:"Intimidade e Sexualidade",          short:"Intimidade",  icon:"◉"},
  {id:"projeto",     label:"Projeto e Equipa",                  short:"Projeto",     icon:"□"},
  {id:"vinculo",     label:"Vínculo, Admiração e Investimento", short:"Vínculo",     icon:"△"},
];

const MAIN_QS = [
 {id:1, dim:"seguranca", text:"Quando expresso algo sensível, o meu parceiro ou parceira reage com respeito.", reverse:false},
 {id:2, dim:"seguranca", text:"Sinto-me seguro/a para mostrar vulnerabilidade sem ser atacado/a.", reverse:false},
 {id:3, dim:"seguranca", text:"Consigo prever como o meu parceiro ou parceira vai reagir nas situações difíceis.", reverse:false},
 {id:4, dim:"seguranca", text:"Na nossa relação existe confiança mútua.", reverse:false},
 {id:5, dim:"seguranca", text:"Sinto que posso ser autêntico/a sem medo de julgamento.", reverse:false},
 {id:6, dim:"seguranca", text:"Quando estou em baixo, sinto apoio emocional na relação.", reverse:false},
 {id:7, dim:"seguranca", text:"Guardo o que sinto para evitar conflito.", reverse:true},
 {id:8, dim:"seguranca", text:"Esta relação é, para mim, um lugar emocionalmente seguro.", reverse:false},
 {id:9, dim:"comunicacao", text:"Conseguimos falar sobre temas difíceis sem desistir da conversa.", reverse:false},
 {id:10,dim:"comunicacao", text:"Sinto que sou ouvido/a quando falo do que é importante para mim.", reverse:false},
 {id:11,dim:"comunicacao", text:"As nossas conversas difíceis não escalam demasiado depressa.", reverse:false},
 {id:12,dim:"comunicacao", text:"Consigo dizer claramente aquilo de que preciso.", reverse:false},
 {id:13,dim:"comunicacao", text:"Depois de uma discussão, conseguimos voltar a aproximar-nos.", reverse:false},
 {id:14,dim:"comunicacao", text:"O meu parceiro ou parceira reconhece quando me magoa.", reverse:false},
 {id:15,dim:"comunicacao", text:"Na nossa relação, conseguimos pedir desculpa de forma genuína.", reverse:false},
 {id:16,dim:"comunicacao", text:"Mesmo quando uma conversa custa, ela pode aproximar-nos.", reverse:false},
 {id:17,dim:"intimidade", text:"Sinto desejo nesta relação.", reverse:false},
 {id:18,dim:"intimidade", text:"Sinto que existe desejo mútuo entre nós.", reverse:false},
 {id:19,dim:"intimidade", text:"Sinto-me confortável no meu corpo nesta relação.", reverse:false},
 {id:20,dim:"intimidade", text:"A iniciativa íntima é relativamente equilibrada entre nós.", reverse:false},
 {id:21,dim:"intimidade", text:"Sinto-me globalmente satisfeito/a com a nossa intimidade.", reverse:false},
 {id:22,dim:"intimidade", text:"Existe frustração sexual não falada entre nós.", reverse:true},
 {id:23,dim:"intimidade", text:"Consigo falar sobre desejos, limites e preferências.", reverse:false},
 {id:24,dim:"intimidade", text:"A intimidade entre nós aproxima-nos.", reverse:false},
 {id:25,dim:"projeto", text:"Sinto que funcionamos como equipa.", reverse:false},
 {id:26,dim:"projeto", text:"A carga mental e emocional da relação está relativamente equilibrada.", reverse:false},
 {id:27,dim:"projeto", text:"As decisões importantes são tomadas em conjunto.", reverse:false},
 {id:28,dim:"projeto", text:"Sinto que temos uma visão de futuro minimamente alinhada.", reverse:false},
 {id:29,dim:"projeto", text:"Quando surge um problema, estamos do mesmo lado.", reverse:false},
 {id:30,dim:"projeto", text:"Existe partilha razoável de responsabilidades no dia a dia.", reverse:false},
 {id:31,dim:"projeto", text:"Temos objetivos em comum que nos unem.", reverse:false},
 {id:32,dim:"projeto", text:"Sinto apoio nas minhas ambições pessoais e profissionais.", reverse:false},
 {id:33,dim:"vinculo", text:"Ainda sinto admiração pelo meu parceiro ou parceira.", reverse:false},
 {id:34,dim:"vinculo", text:"Sinto amizade dentro da relação.", reverse:false},
 {id:35,dim:"vinculo", text:"Investimos ativamente no cuidado da relação.", reverse:false},
 {id:36,dim:"vinculo", text:"Sinto que a relação é uma prioridade para nós.", reverse:false},
 {id:37,dim:"vinculo", text:"Existe carinho genuíno no nosso dia a dia.", reverse:false},
 {id:38,dim:"vinculo", text:"Reconhecemos qualidades um no outro.", reverse:false},
 {id:39,dim:"vinculo", text:"Temos momentos que são só nossos.", reverse:false},
 {id:40,dim:"vinculo", text:"Sinto que o nosso vínculo continua vivo.", reverse:false},
];

const TASK_LIBRARY = {
  seguranca: {
    "Fragilidade": {
      title:"Microcheck-in emocional",
      text:"Hoje, cada um completa esta frase individualmente: \"Hoje senti-me mais seguro(a) quando…\"\nDepois, combinem 1 horário fixo por dia — mesmo que curto — sem telemóvel e sem resolver problemas.",
      rule:"O objetivo não é falar muito. É criar previsibilidade. A regularidade é mais importante do que a profundidade.",
      icon:"🏡",
      nivel:"Fragilidade",
      tipo:"Estabilizar + criar previsibilidade"
    },
    "Boa Base": {
      title:"Mapa de gatilhos",
      text:"Cada parceiro identifica 3 situações que ativam defesa, alarme ou retirada.\nEscrevam separadamente. Partilhem com a frase: \"Quando isso acontece, o que preciso de ti é…\"",
      rule:"Não é para resolver. É para conhecer. Ouvir sem contra-argumentar.",
      icon:"🗺️",
      nivel:"Boa Base",
      tipo:"Treinar competência"
    },
    "Com Recursos": {
      title:"Vulnerabilidade guiada",
      text:"Cada um partilha um medo relacional real, usando este script:\n\"Uma coisa que temo nesta relação é… e o que preciso quando isso acontece é…\"",
      rule:"O outro escuta sem interromper. Sem minimizar. Sem resolver. Só estar presente.",
      icon:"💬",
      nivel:"Com Recursos",
      tipo:"Aprofundar padrão"
    },
    "Forte": {
      title:"Aprofundar a base segura",
      text:"Falem sobre o que torna a vossa relação um lugar seguro.\nO que cada um faz que o outro sente como protetor? O que gostariam de aprofundar?",
      rule:"Esta é uma conversa de reconhecimento e crescimento, não de resolução de problema.",
      icon:"✨",
      nivel:"Forte",
      tipo:"Reforçar e aprofundar"
    },
  },
  comunicacao: {
    "Fragilidade": {
      title:"Ouvir sem interromper",
      text:"Cada um fala 5 minutos sobre algo que importa — não sobre o relacionamento. O outro ouve.\nNo final, quem ouviu diz: \"O que percebi foi…\" sem adicionar a sua perspectiva.",
      rule:"Se for difícil não responder, é normal. Treino de escuta pura. Repetir 3 vezes esta semana.",
      icon:"👂",
      nivel:"Fragilidade",
      tipo:"Educar + criar hábito"
    },
    "Boa Base": {
      title:"Queixa em pedido",
      text:"Identifiquem 1 queixa recorrente cada um.\nTransformem-na num pedido específico usando o formato:\n\"Quando X acontece, sinto Y. O que preciso é Z.\"",
      rule:"Sem crítica ao carácter do outro. Só comportamento e necessidade.",
      icon:"💡",
      nivel:"Boa Base",
      tipo:"Treinar competência"
    },
    "Com Recursos": {
      title:"Repair após conflito",
      text:"Escolham um conflito recente que ficou por resolver.\nCada um responde: O que eu fiz que não ajudou? O que o outro fez que me ajudou a acalmar?\nDepois: o que podemos fazer diferente da próxima vez?",
      rule:"Não é para ter razão. É para perceber o padrão e encontrar uma resposta nova.",
      icon:"🔄",
      nivel:"Com Recursos",
      tipo:"Consolidar padrão"
    },
    "Forte": {
      title:"Conversa difícil intencional",
      text:"Escolham um tema que habitualmente evitam.\nUsem 20 minutos com esta estrutura: 8 min fala A, 8 min fala B, 4 min para o que ficou.",
      rule:"Se escalar, parem. O objetivo é praticar entrar no tema, não resolver tudo.",
      icon:"🗣️",
      nivel:"Forte",
      tipo:"Aprofundar"
    },
  },
  intimidade: {
    "Fragilidade": {
      title:"Proximidade sem pressão",
      text:"Reservem 10 minutos por dia para estarem fisicamente presentes — um ao lado do outro, sem telemóvel, sem objetivo.\nPode ser a ver uma série, ler, ou simplesmente estar.",
      rule:"Sem pressão sexual. Sem expectativa. Só contacto e presença.",
      icon:"🕯️",
      nivel:"Fragilidade",
      tipo:"Estabilizar"
    },
    "Boa Base": {
      title:"Sim / Não / Talvez",
      text:"Cada um preenche individualmente uma lista de formas de contacto afetivo e intimidade.\nPara cada item: Sim (gosto), Não (não me sinto confortável), Talvez (depende do contexto).\nDepois partilham sem pressão de alinhamento imediato.",
      rule:"Não é negociação. É conhecimento mútuo. Sem julgamento do que o outro respondeu.",
      icon:"💛",
      nivel:"Boa Base",
      tipo:"Treinar comunicação"
    },
    "Com Recursos": {
      title:"Conversa sobre desejo",
      text:"Cada um responde individualmente:\n\"O que me aproxima de mim quando estou com o outro é…\"\n\"Quando me sinto desejado(a) é porque…\"\n\"Uma coisa que gostaria de mais ou diferente é…\"",
      rule:"Partilhar devagar. Escutar sem defender. A vulnerabilidade aqui requer segurança.",
      icon:"🌿",
      nivel:"Com Recursos",
      tipo:"Aprofundar padrão"
    },
    "Forte": {
      title:"Plano de reaproximação",
      text:"Criem juntos um plano de 3 semanas para aprofundar a intimidade.\nCada semana: 1 momento de contacto afetivo intencional, 1 conversa sobre o que funcionou, 1 pedido para a semana seguinte.",
      rule:"Sem comparação com o passado. Construção para o presente.",
      icon:"🔍",
      nivel:"Forte",
      tipo:"Consolidar e aprofundar"
    },
  },
  projeto: {
    "Fragilidade": {
      title:"O que precisamos resolver esta semana?",
      text:"Reservem 15 minutos no início da semana.\nCada um diz 1 coisa prática que precisa de ser resolvida juntos.\nEscolham 1 e resolvam-na — só 1.",
      rule:"Não é o momento para temas grandes. É microcoordenação funcional para reestabelecer equipa.",
      icon:"📋",
      nivel:"Fragilidade",
      tipo:"Estabilizar"
    },
    "Boa Base": {
      title:"Mapa de carga mental",
      text:"Cada um faz uma lista de tudo o que pensa, organiza e acompanha na vida a dois.\nComparem as listas: o que é visível? O que está invisível? O que parece desigual?",
      rule:"Sem acusação. O objetivo é tornar o invisível visível para ambos.",
      icon:"⚖️",
      nivel:"Boa Base",
      tipo:"Treinar competência"
    },
    "Com Recursos": {
      title:"Visão partilhada a 6 meses",
      text:"Cada um responde individualmente:\n\"Daqui a 6 meses, gostaria que a nossa relação fosse…\"\n\"O que precisamos de mudar ou manter para isso acontecer é…\"\nDepois partilhem e identifiquem 1 ponto em comum.",
      rule:"Não é um plano de negócios. É uma conversa sobre o que importa.",
      icon:"🗓️",
      nivel:"Com Recursos",
      tipo:"Consolidar"
    },
    "Forte": {
      title:"Conversa sobre valores e prioridades",
      text:"Escolham 1 tema de fundo — parentalidade, trabalho, tempo, dinheiro, família de origem.\nCada um partilha o que valoriza e o que precisa de ser reorganizado.\nO objetivo é alinhar, não decidir tudo de uma vez.",
      rule:"Temas grandes precisam de mais do que 1 conversa. Esta é a primeira.",
      icon:"🌅",
      nivel:"Forte",
      tipo:"Aprofundar"
    },
  },
  vinculo: {
    "Fragilidade": {
      title:"Uma apreciação por dia",
      text:"Durante 7 dias, cada um envia ao outro 1 mensagem com uma apreciação concreta.\nNão genérica. Algo específico que o outro fez ou é.\n\"Hoje apreciei quando fizeste…\" ou \"Admiro em ti…\"",
      rule:"Sem ironia. Sem 'mas'. Mesmo que pareça estranho no início, continua.",
      icon:"⭐",
      nivel:"Fragilidade",
      tipo:"Reativar vínculo"
    },
    "Boa Base": {
      title:"Gratidão relacional",
      text:"3 vezes por semana, cada um partilha ao vivo:\n1 coisa que o outro fez que notou.\n1 memória positiva recente.\n1 coisa que ainda os une.",
      rule:"Curto. Concreto. Sem condicionar com 'mas'.",
      icon:"🔄",
      nivel:"Boa Base",
      tipo:"Treinar competência"
    },
    "Com Recursos": {
      title:"História do casal",
      text:"Sentem-se juntos e falem sobre o percurso:\nComo se conheceram. O que os aproximou. Um momento difícil que superaram.\nO que isso diz sobre o que conseguem fazer juntos?",
      rule:"Não é nostalgia. É reconexão com recursos que já existem.",
      icon:"🎯",
      nivel:"Com Recursos",
      tipo:"Consolidar"
    },
    "Forte": {
      title:"Micro-rituais de proximidade",
      text:"Criem 3 rituais pequenos e consistentes que sejam só vossos.\nPode ser uma mensagem, um gesto, um momento fixo da semana.\nEscrevano e comprometam-se a manter por 21 dias.",
      rule:"A consistência é mais poderosa do que a intensidade.",
      icon:"💫",
      nivel:"Forte",
      tipo:"Reforçar e aprofundar"
    },
  },
};

function getTask(lowest, level){
  return TASK_LIBRARY[lowest]?.[level] || TASK_LIBRARY[lowest]?.["Boa Base"];
}



const DIM_RESULTS = {
  seguranca:   {titulo:"O ponto a cuidar é a segurança emocional",   desc:"Parece existir dificuldade em sentir confiança, previsibilidade ou abertura segura na relação."},
  comunicacao: {titulo:"O ponto a cuidar é a comunicação",            desc:"As conversas difíceis podem estar a criar mais distância do que aproximação."},
  intimidade:  {titulo:"O ponto a cuidar é a intimidade",             desc:"Pode existir distância emocional ou sexual, ou dificuldade em falar com abertura sobre esta área."},
  projeto:     {titulo:"O ponto a cuidar é a parceria",               desc:"A relação pode não estar a funcionar como equipa nas áreas importantes da vida."},
  vinculo:     {titulo:"O ponto a cuidar é o vínculo",               desc:"O laço, a admiração ou o investimento na relação podem estar mais frágeis."},
};

const GLOBAL_TEXT = {
  "Fragilidade":"A relação está sob pressão importante. As tarefas foco-se em estabilizar e proteger.",
  "Boa Base":"Existem recursos, mas com inconsistência. As tarefas ajudam a treinar competências específicas.",
  "Com Recursos":"A relação tem uma base sólida. As tarefas consolidam novos padrões.",
  "Forte":"A relação mostra recursos consistentes. As tarefas reforçam e aprofundam o que já funciona.",
};

function scoreSafety(answers) {
  const total = SAFETY_QS.reduce((s, q) => s + (answers[q.id] || 0), 0);
  const criticalHigh = SAFETY_QS
    .filter(q => q.critical)
    .some(q => (answers[q.id] || 0) >= 3);
  if (criticalHigh || total >= 20) return "alto";
  if (total >= 10) return "moderado";
  return "baixo";
}

function scoreMain(answers) {
  const byDim = {};
  for (const dim of DIMS) {
    const qs = MAIN_QS.filter(q => q.dim === dim.id);
    const scores = qs.map(q => {
      const raw = answers[q.id] ?? 5;
      return q.reverse ? (10 - raw) : raw;
    });
    byDim[dim.id] = +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
  }
  const global = +(Object.values(byDim).reduce((a, b) => a + b, 0) / 5).toFixed(1);
  const lowest = Object.entries(byDim).sort((a, b) => a[1] - b[1])[0][0];
  return { byDim, global, lowest };
}

function getLevel(score) {
  if (score <= 4.4) return "Fragilidade";
  if (score <= 6.4) return "Boa Base";
  if (score <= 8.0) return "Com Recursos";
  return "Forte";
}

function levelColor(level) {
  return { "Fragilidade":C.bad, "Boa Base":C.warn, "Com Recursos":C.ok, "Forte":C.pet }[level] || C.gz;
}

// ─── PHONE SHELL ─────────────────────────────────────────────────────────────
function PhoneShell({ios,children}){
  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#0f0719,#1a0d2e 45%,#0a1a2e)",display:"flex",alignItems:"center",justifyContent:"center",padding:"12px",fontFamily:"Poppins,sans-serif"}}>
      <div style={{width:"100%",maxWidth:390,height:844,background:"#F5F2F7",borderRadius:44,overflow:"hidden",position:"relative",boxShadow:"0 32px 80px rgba(0,0,0,0.8)"}}>
        {ios?(<><div style={{height:50,display:"flex",alignItems:"flex-end",justifyContent:"space-between",padding:"0 28px 10px",position:"absolute",top:0,left:0,right:0,zIndex:300,pointerEvents:"none"}}><span style={{fontSize:"0.85rem",fontWeight:700,color:"#2C4951"}}>9:41</span><svg width="27" height="13" viewBox="0 0 27 13" fill="none"><rect x="0.5" y="0.5" width="22" height="12" rx="3.5" stroke="#2C4951" strokeOpacity="0.35"/><rect x="1.5" y="1.5" width="18" height="10" rx="2.5" fill="#2C4951"/></svg></div><div style={{position:"absolute",top:10,left:"50%",transform:"translateX(-50%)",width:126,height:34,background:"#0a0a0a",borderRadius:20,zIndex:320}}/></>):(<div style={{height:28,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 14px",position:"absolute",top:0,left:0,right:0,zIndex:300,background:"#4C305E",pointerEvents:"none"}}><span style={{fontSize:"0.78rem",fontWeight:600,color:"white"}}>9:41</span></div>)}
        <div style={{position:"absolute",top:ios?50:28,left:0,right:0,bottom:0,overflowY:"auto",overflowX:"hidden"}}>{children}</div>
        {ios&&<div style={{position:"absolute",bottom:6,left:"50%",transform:"translateX(-50%)",width:134,height:5,background:"rgba(0,0,0,0.18)",borderRadius:3,zIndex:300}}/>}
      </div>
    </div>
  );
}

// ─── ATOMS ───────────────────────────────────────────────────────────────────
function AppButton({ onClick, children, variant="primary", dis=false, sx={} }) {
  const styles = {
    primary:   { bg:C.roxo,   text:"#fff", sh:"0 4px 16px rgba(76,48,94,0.35)", border:"none" },
    secondary: { bg:"transparent", text:C.roxo, sh:"none", border:"1.5px solid "+C.roxo },
    ghost:     { bg:"rgba(76,48,94,0.07)", text:C.roxo, sh:"none", border:"none" },
    danger:    { bg:C.bad,    text:"#fff", sh:"0 4px 16px rgba(192,96,90,0.3)", border:"none" },
    warn:      { bg:C.warn,   text:"#fff", sh:"0 4px 16px rgba(192,144,64,0.3)", border:"none" },
  };
  const s = styles[variant] || styles.primary;
  return (
    <button onClick={onClick} disabled={dis} style={{ width:"100%", padding:"10px 18px", borderRadius:11, fontFamily:"Poppins", fontSize:"0.86rem", fontWeight:500, background:dis?"rgba(132,130,144,0.1)":s.bg, color:dis?"rgba(132,130,144,0.4)":s.text, border:dis?"1px solid rgba(132,130,144,0.15)":s.border, cursor:dis?"not-allowed":"pointer", boxShadow:dis?"none":s.sh, display:"flex", alignItems:"center", justifyContent:"center", gap:8, transition:"all 0.15s", ...sx }}>
      {children}
    </button>
  );
}

function ProgressBar({ current, total, color=C.roxo }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div style={{ padding:"0 18px 10px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
        <span style={{ fontSize:"0.67rem", color:C.gz, fontWeight:500 }}>Pergunta {current} de {total}</span>
        <span style={{ fontSize:"0.67rem", color:C.gz }}>{pct}%</span>
      </div>
      <div style={{ height:3, background:"rgba(132,130,144,0.12)", borderRadius:2 }}>
        <div style={{ width:pct+"%", height:"100%", background:`linear-gradient(90deg,${color},${C.roxoL})`, borderRadius:2, transition:"width 0.3s ease" }}/>
      </div>
    </div>
  );
}

function FooterNote({ text="Resultado orientador com base em auto-relato. Não substitui avaliação psicológica." }) {
  return <p style={{ fontSize:"0.68rem", color:"rgba(132,130,144,0.6)", textAlign:"center", lineHeight:1.55, marginTop:8 }}>{text}</p>;
}

function SC({ children, pad="22px 20px" }) {
  return <div style={{ minHeight:"100%", padding:pad, fontFamily:"Poppins", background:C.iv }}>{children}</div>;
}

// ─── SCALE SELECTOR ──────────────────────────────────────────────────────────
function ScaleSelector({min=0,max=10,value,onChange,color=C.roxo}){
  const L={0:"Nunca",1:"Raramente",2:"Às vezes",3:"Muitas vezes",4:"Quase sempre"};
  return(<div>
    <style>{`input[type=range]{-webkit-appearance:none;appearance:none;outline:none;cursor:pointer;height:6px;border-radius:4px;width:100%}input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:28px;height:28px;border-radius:50%;background:${color};cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.2)}`}</style>
    <div style={{textAlign:"center",marginBottom:14}}>
      <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:56,height:56,borderRadius:"50%",background:`linear-gradient(135deg,${color},${C.roxoL})`,marginBottom:6}}>
        <span style={{color:"white",fontSize:"1.3rem",fontWeight:700}}>{value}</span>
      </div>
      <p style={{fontSize:"0.77rem",color:value<=(max*0.35)?C.bad:value<=(max*0.65)?C.warn:C.ok,fontWeight:500,minHeight:20}}>{max===4?L[value]||"":value===0?"Nada verdadeiro":value===max?"Totalmente verdadeiro":""}</p>
    </div>
    <input type="range" min={min} max={max} step={1} value={value} onChange={e=>onChange(Number(e.target.value))} style={{background:`linear-gradient(to right,${color} ${(value/max)*100}%,rgba(132,130,144,0.18) ${(value/max)*100}%)`}}/>
    <div style={{display:"flex",justifyContent:"space-between",padding:"4px 2px 0"}}>
      {Array.from({length:max+1},(_,i)=><button key={i} onClick={()=>onChange(i)} style={{fontFamily:"Poppins",fontSize:i===value?"0.71rem":"0.62rem",color:i===value?color:"rgba(132,130,144,0.35)",fontWeight:i===value?700:400,background:"none",border:"none",cursor:"pointer",padding:0,minWidth:max===4?36:12}}>{i}</button>)}
    </div>
    {max===10&&<div style={{display:"flex",justifyContent:"space-between",marginTop:3}}><span style={{fontSize:"0.6rem",color:C.gz}}>Nada</span><span style={{fontSize:"0.6rem",color:C.gz}}>Totalmente</span></div>}
  </div>);
}

// ─── LEGAL MODALS ─────────────────────────────────────────────────────────────
const LEGAL = {
  privacidade: {
    title:"Política de Privacidade",
    body:"Política de Privacidade — Março 2026\n\nRESPONSÁVEL: Ana Mafalda Ferreira, Psicóloga Clínica (OPP-11511)\npsicologia@attunea.pt | +351 965 365 807\nwww.attunea.pt/ana-mafalda-ferreira\n\nDADOS RECOLHIDOS: nome, e-mail, password encriptada, respostas ao questionário, histórico de avaliações até 6 meses, cookies.\n\nFINALIDADE (consentimento RGPD Art. 6 e 9):\n- Orientação relacional e monitorização pessoal\n- Melhoria contínua da app e do modelo de avaliação\n- Acompanhamento clínico individual, se solicitado\n- Comunicação de exercícios e recomendações terapêuticas\n- Comunicação e marketing de produtos e serviços Attunea\n\nDADOS SENSÍVEIS: acesso restrito à Psicóloga Ana Mafalda Ferreira, sujeito ao sigilo profissional da OPP. Nunca partilhados sem consentimento.\n\nCONSERVAÇÃO: máximo 6 meses. Eliminação automática findo o prazo.\n\nDIREITOS: psicologia@attunea.pt\nSEGURANÇA: AES-256 + TLS 1.3.\nCNPD: www.cnpd.pt"
  },
  termos: {
    title:"Termos de Utilização",
    body:"Termos de Utilização — Março 2026\n\n1. NATUREZA DO SERVIÇO\nFerramenta de orientação relacional baseada em auto-relato. Não substitui terapia.\n\n2. CONTA E AUTENTICAÇÃO\nConta com nome e e-mail para guardar e monitorizar resultados.\n\n3. HISTORIAL — LIMITE DE 6 MESES\nDados conservados até 6 meses, depois eliminados automaticamente.\n\n4. SUPERVISÃO CLÍNICA E MELHORIA DA APP\nAo utilizares a Attunea autorizas que a Psicóloga Ana Mafalda Ferreira aceda aos dados para melhoria do instrumento, desenvolvimento de conteúdos terapêuticos, e acompanhamento clínico individual se expressamente solicitado.\n\n5. COMUNICAÇÃO TERAPÊUTICA\nA Attunea poderá enviar exercícios personalizados e recomendações com base no teu perfil.\n\n6. COMUNICAÇÃO COMERCIAL E MARKETING\nAutorizas comunicações de marketing de produtos e serviços de Ana Mafalda Ferreira. Podes cancelar a qualquer momento.\n\n7. CONFIDENCIALIDADE DE DADOS SENSÍVEIS\nRespostas ao questionário são dados de saúde, acesso restrito à Psicóloga Ana Mafalda Ferreira, sujeito ao sigilo profissional da OPP. Nunca partilhados sem consentimento.\n\n8. AGENDAMENTO COM A PSICÓLOGA\nSujeito a disponibilidade e confirmação. Não constitui início de relação terapêutica.\n\n9. EM SITUAÇÕES DE RISCO: APAV 116 006 | CIG 800 202 148\n\n10. PROPRIEDADE INTELECTUAL\nTodo o conteúdo é propriedade de Ana Mafalda Ferreira / Attunea.\n\nCONTACTO: psicologia@attunea.pt | +351 965 365 807 | www.attunea.pt"
  },
  cookies: {
    title:"Política de Cookies",
    body:"Política de Cookies — Março 2026\n\nCOOKIES ESSENCIAIS: autenticação e sessão. Não requerem consentimento.\nCOOKIES DE ANÁLISE: melhoria da app. Apenas com consentimento.\nCOOKIES DE MARKETING: comunicações Attunea. Apenas com consentimento.\n\nDuração: sessão ou até 6 meses.\nContacto: psicologia@attunea.pt"
  },
};
function LegalModal({ type, onClose }) {
  const doc = LEGAL[type];
  if (!doc) return null;
  return (
    <div style={{ position:"absolute", inset:0, background:"rgba(76,48,94,0.55)", zIndex:900, display:"flex", alignItems:"flex-end", fontFamily:"Poppins" }}>
      <div style={{ background:C.wh, width:"100%", borderRadius:"22px 22px 0 0", maxHeight:"90%", display:"flex", flexDirection:"column" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 18px", borderBottom:"1px solid "+C.sep, flexShrink:0 }}>
          <p style={{ fontWeight:700, fontSize:"0.92rem", color:C.pet }}>{doc.title}</p>
          <button onClick={onClose} style={{ background:C.bg, border:"none", width:30, height:30, borderRadius:"50%", cursor:"pointer", fontSize:"1rem", color:C.gz, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"16px 18px 28px" }}>
          <pre style={{ fontSize:"0.79rem", color:C.pet, lineHeight:1.75, fontFamily:"Poppins", whiteSpace:"pre-wrap" }}>{doc.body}</pre>
        </div>
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function Attunea() {
  const [ios, setIos] = useState(true);
  const [screen, setScreen] = useState("home");
  const [hist, setHist] = useState([]);

  // State
  const [safetyAns, setSafetyAns] = useState({});
  const [safetyResult, setSafetyResult] = useState(null); // "alto"|"moderado"|"baixo"
  const [mainAns, setMainAns] = useState({});
  const [scores, setScores] = useState(null);
  const [scheduleData, setScheduleData] = useState(null);
  const [legalModal, setLegalModal] = useState(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [cookieDone, setCookieDone] = useState(false);
  const [user, setUser] = useState(null); // {id, name, email, couple_code, role}
  const [loggedIn, setLoggedIn] = useState(false);
  const SIX_MONTHS_MS = 6*30*24*60*60*1000;
  // Detect pair invite code from URL
  const [pairCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("pair") || null;
  });

  const MOCK_USERS_DB = {
    "utilizador@attunea.pt":{pw:"demo1234",name:"Utilizador Demo"},
    "pro@attunea.pt":{pw:"demo1234",name:"Utilizador Pro"},
    "amaf.ferreira@gmail.com":{pw:"attunea2026",name:"Ana Ferreira"},
  };
  // TIERS in order
  const TIERS = ["Fragilidade","Em desenvolvimento","Boa base","Muito positivo"];

  // tierTasks: for a given tier, all 5 tasks (one per dimension)
  const getTierTasks = (tier) => DIMS.map(d => ({
    id: d.id,
    dim: d,
    task: TASK_LIBRARY[d.id]?.[tier] || null,
    done: false,
  }));

  // User's current tier state
  const [tierState, setTierState] = useState(() => {
    // Start at "Boa base" for demo (based on latest score)
    const startTier = "Boa base";
    return {
      currentTier: startTier,
      tasks: getTierTasks(startTier).map((t,i) => ({
        ...t,
        done: i < 2, // demo: 2 of 5 done
      })),
      celebrating: false,
    };
  });

  const toggleTierTask = (dimId) => {
    setTierState(ts => {
      const tasks = ts.tasks.map(t => t.id===dimId ? {...t, done:!t.done} : t);
      const allDone = tasks.every(t => t.done);
      return {...ts, tasks, celebrating: allDone};
    });
  };

  const advanceTier = () => {
    setTierState(ts => {
      const idx = TIERS.indexOf(ts.currentTier);
      if (idx >= TIERS.length-1) return {...ts, celebrating:false}; // already max
      const nextTier = TIERS[idx+1];
      return {
        currentTier: nextTier,
        tasks: getTierTasks(nextTier),
        celebrating: false,
      };
    });
  };

  const [userHistory, setUserHistory] = useState([
    {id:"h1",date:"2025-09-23",global:4.8,level:"Boa Base",byDim:{seguranca:4.2,comunicacao:4.5,intimidade:5.1,projeto:4.8,vinculo:5.4},lowest:"seguranca",task:{title:"Pequeno gesto de presença",icon:"🤝"},taskDone:true,taskProgress:100},
    {id:"h2",date:"2026-01-20",global:6.1,level:"Com Recursos",byDim:{seguranca:5.8,comunicacao:6.2,intimidade:6.3,projeto:6.1,vinculo:6.1},lowest:"seguranca",task:{title:"Partilha vulnerável",icon:"💬"},taskDone:true,taskProgress:100},
    {id:"h3",date:"2026-03-23",global:6.7,level:"Com Recursos",byDim:{seguranca:6.5,comunicacao:6.8,intimidade:7.0,projeto:6.5,vinculo:6.7},lowest:"projeto",task:{title:"Check-in semanal",icon:"🗓️"},taskDone:false,taskProgress:40},
  ]);
  const saveResult = (s) => {
    const now=new Date();
    const level=getLevel(s.global);
    const task=TASK_LIBRARY[s.lowest]?.[level]||null;
    const e={id:"h"+(userHistory.length+1),date:now.toISOString().split("T")[0],global:s.global,level,byDim:s.byDim,lowest:s.lowest,task,taskDone:false,taskProgress:0};
    // Mark previous entry task as done when new assessment is made
    setUserHistory(h=>[
      ...h.filter(x=>new Date(x.date).getTime()>now.getTime()-SIX_MONTHS_MS)
           .map(x=>({...x,taskDone:true,taskProgress:100})),
      e
    ]);

  };

  const go = s => { setHist(h => [...h, screen]); setScreen(s); };
  const back = () => setHist(h => { const n=[...h]; const p=n.pop()||"home"; setScreen(p); return n; });
  // Load assessments from Supabase when user logs in
  useEffect(() => {
    if (loggedIn && user?.id) {
      supaGetAssessments(user.id).then(r => { const rows = r?.data;
        if (rows && rows.length > 0) {
          const history = rows.map(r => ({
            id: r.id,
            dbId: r.id,
            date: r.date,
            global: r.global,
            level: r.level,
            byDim: r.by_dim,
            lowest: r.lowest,
            task: r.task,
            taskDone: r.task_done,
            taskProgress: r.task_progress,
          }));
          setUserHistory(history);
        }
      });
    }
  }, [loggedIn, user?.id]);

  const restart = () => { setSafetyAns({}); setSafetyResult(null); setMainAns({}); setScores(null); setScheduleData(null); setConsentChecked(false); setHist([]); setScreen("home"); };

  const handleSafetyDone = (answers) => {
    setSafetyAns(answers);
    const result = scoreSafety(answers);
    setSafetyResult(result);
    go("safetyResult");
  };

  const handleMainDone = async (answers) => {
    setMainAns(answers);
    const s = scoreMain(answers);
    setScores(s);
    if (loggedIn && user?.id) {
      const level = getLevel(s.global);
      const task = TASK_LIBRARY[s.lowest]?.[level] || null;
      const entry = {
        global: s.global,
        level,
        lowest: s.lowest,
        by_dim: s.byDim,
        answers: answers,
        task: task ? {title:task.title, icon:task.icon} : null,
        task_done: false,
        task_progress: 0,
      };
      const saved = await supaSaveAssessment(user.id, user.couple_code, entry);
      if (saved && saved[0]) {
        saveResult({...s, dbId: saved[0].id, task: entry.task});
      } else {
        saveResult(s);
      }
    }
    go("processing");
    setTimeout(() => go("result"), 2000);
  };

  const handleSchedule = (data) => {
    setScheduleData(data);
    go("confirmation");
  };

  // Admin login
  const ADMIN_USERS = {
    "suporte@attunea.pt": { pw:"attunea2026", role:"admin", name:"Ana Mafalda Ferreira" },
  };

  const props = { go, back, restart, scores, safetyAns, safetyResult, mainAns, handleSafetyDone, handleMainDone, handleSchedule, scheduleData, setLegalModal, consentChecked, setConsentChecked, loggedIn, user, ADMIN_USERS, setUser, setLoggedIn, userHistory, setUserHistory, MOCK_USERS_DB };

  const renderScreen = () => {
    // Admin sees AdminDash for all non-public screens
    if (loggedIn && user?.role === "admin" && !["adminLogin","privacy","terms","cookies"].includes(screen)) {
      return <AdminDash {...props}/>;
    }
    switch(screen) {
      case "home":         return <HomeScreen {...props} pairCode={pairCode}/>;
      case "intro":        return <IntroScreen {...props}/>;
      case "consent":      return <ConsentScreen {...props}/>;
      case "safety":       return <SafetyQScreen {...props}/>;
      case "safetyResult": return <SafetyResultScreen {...props}/>;
      case "mainIntro":    return <MainIntroScreen {...props}/>;
      case "question":     return <QuestionScreen {...props}/>;
      case "processing":   return <ProcessingScreen/>;
      case "result":       return <ResultScreen {...props}/>;
      case "exercise":     return <ExerciseScreen {...props}/>;
      case "schedule":     return <ScheduleScreen {...props}/>;
      case "confirmation": return <ConfirmationScreen {...props}/>;
      case "admin":        return <AdminDash {...props}/>;
      case "returningUser": return <ReturningUserScreen {...props}/>;
      case "history":      return <HistoryScreen {...props}/>;
      case "booking":      return <BookingScreen {...props}/>;
      case "userLogin":    return <UserLogin {...props} loginRedirect="home"/>;
      case "userLoginFlow":  return <UserLogin {...props} loginRedirect="consent"/>;
      case "userRegister": return <UserRegister {...props} pairCode={pairCode}/>;
      case "userProfile":  return <UserProfile {...props}/>;
      case "adminLogin":   return <AdminLogin {...props}/>;
      case "privacy":      return <LegalScreen type="privacidade" {...props}/>;
      case "terms":        return <LegalScreen type="termos" {...props}/>;
      case "cookies":      return <LegalScreen type="cookies" {...props}/>;
      default:             return <HomeScreen {...props}/>;
    }
  };

  return (
    <div style={{ fontFamily:"Poppins,sans-serif" }}>
      {/* Platform toggle */}
      <div style={{ position:"fixed", top:14, right:14, zIndex:9999, display:"flex", gap:7 }}>
        {[{v:true,l:"📱 iOS"},{v:false,l:"🤖 Android"}].map(({v,l})=>(
          <button key={String(v)} onClick={()=>setIos(v)} style={{ padding:"5px 12px", borderRadius:50, fontFamily:"Poppins", fontSize:"0.69rem", fontWeight:700, background:ios===v?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.12)", color:ios===v?C.roxo:"rgba(255,255,255,0.6)", border:"1px solid rgba(255,255,255,0.2)", cursor:"pointer" }}>{l}</button>
        ))}
      </div>
      <PhoneShell ios={ios}>
        <div style={{ height:"100%", position:"relative" }}>
          {renderScreen()}
          {legalModal && <LegalModal type={legalModal} onClose={()=>setLegalModal(null)}/>}
          {!cookieDone && screen==="home" && (
            <div style={{ position:"absolute", bottom:0, left:0, right:0, background:C.roxo, borderRadius:"16px 16px 0 0", padding:"14px 18px 20px", zIndex:200, fontFamily:"Poppins" }}>
              <p style={{ color:"white", fontSize:"0.84rem", fontWeight:700, marginBottom:4 }}>🍪 Utilizamos cookies</p>
              <p style={{ color:"rgba(255,255,255,0.62)", fontSize:"0.75rem", lineHeight:1.6, marginBottom:12 }}>Cookies essenciais e, com autorização, de análise.</p>
              <div style={{ display:"flex", gap:9 }}>
                <button onClick={()=>setCookieDone(true)} style={{ flex:1, padding:"9px", borderRadius:10, background:"white", color:C.roxo, fontFamily:"Poppins", fontSize:"0.83rem", fontWeight:700, border:"none", cursor:"pointer" }}>Aceitar</button>
                <button onClick={()=>{setCookieDone(true);setLegalModal("cookies");}} style={{ flex:1, padding:"9px", borderRadius:10, background:"transparent", color:"white", fontFamily:"Poppins", fontSize:"0.83rem", fontWeight:600, border:"1.5px solid rgba(255,255,255,0.35)", cursor:"pointer" }}>Gerir</button>
              </div>
            </div>
          )}
        </div>
      </PhoneShell>
    </div>
  );
}

// ─── HOME ─────────────────────────────────────────────────────────────────────
function HomeScreen({go,loggedIn,user,pairCode}){
  // If user arrives via invite link, redirect to register immediately
  if(pairCode && !loggedIn){
    return(
      <SC>
        <Logo h={22}/>
        <div style={{background:"linear-gradient(135deg,"+C.roxo+"15,"+C.lav+"20)",borderRadius:16,padding:"20px",marginTop:20,marginBottom:20,textAlign:"center"}}>
          <p style={{fontSize:"1.5rem",marginBottom:8}}>💌</p>
          <h2 style={{fontSize:"1.1rem",fontWeight:700,color:C.roxo,marginBottom:8}}>Foste convidado(a)</h2>
          <p style={{fontSize:"0.85rem",color:C.gz,lineHeight:1.7,marginBottom:4}}>O teu parceiro(a) convidou-te para realizarem a avaliação juntos.</p>
          <p style={{fontSize:"0.78rem",color:C.gz,marginBottom:16}}>Código do casal: <strong style={{color:C.roxo}}>{pairCode}</strong></p>
          <AppButton onClick={()=>go("userRegister")}>Criar conta e começar →</AppButton>
          <button onClick={()=>go("userLoginFlow")} style={{background:"none",border:"none",fontFamily:"Poppins",fontSize:"0.78rem",color:C.gz,cursor:"pointer",marginTop:10,width:"100%"}}>Já tens conta? <span style={{color:C.roxo,fontWeight:600}}>Entrar</span></button>
        </div>
      </SC>
    );
  }
  return(
    <div style={{height:"100%",display:"flex",flexDirection:"column",fontFamily:"Poppins",background:C.iv}}>
      <div style={{background:`linear-gradient(160deg,${C.roxo} 0%,${C.pet} 100%)`,padding:"48px 24px 40px",textAlign:"center",flexShrink:0}}>
        <Logo h={24} dark/>
        <p style={{color:"rgba(255,255,255,0.7)",fontSize:"0.82rem",marginTop:10,letterSpacing:"0.06em"}}>Em sintonia contigo</p>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"24px 20px"}}>
        <h2 style={{fontSize:"1.25rem",fontWeight:700,color:C.pet,marginBottom:10,lineHeight:1.4}}>Avalia a saúde da tua relação</h2>
        <p style={{fontSize:"0.88rem",color:C.gz,lineHeight:1.75,marginBottom:24}}>Uma avaliação clínica breve, desenvolvida por psicólogos. Resultados imediatos e personalizados.</p>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {loggedIn
            ? <AppButton onClick={()=>go("returningUser")}>Continuar como {user?.name?.split(" ")[0]} →</AppButton>
            : <>
                <AppButton onClick={()=>go("userRegister")}>Começar gratuitamente →</AppButton>
                <AppButton onClick={()=>go("userLoginFlow")} variant="secondary">Já tenho conta</AppButton>
              </>}
        </div>
        <div style={{marginTop:28,display:"flex",flexDirection:"column",gap:10}}>
          {[{icon:"🔒",t:"Confidencial",d:"Os teus dados são protegidos e nunca partilhados."},{icon:"⏱",t:"10 minutos",d:"40 perguntas organizadas em 5 dimensões relacionais."},{icon:"📊",t:"Resultados imediatos",d:"Relatório visual com recomendações clínicas."}].map((f,i)=>(
            <div key={i} style={{display:"flex",gap:12,padding:"12px 0",borderBottom:"1px solid "+C.sep}}>
              <span style={{fontSize:18,flexShrink:0}}>{f.icon}</span>
              <div><p style={{fontWeight:600,fontSize:"0.84rem",color:C.pet,marginBottom:2}}>{f.t}</p><p style={{fontSize:"0.78rem",color:C.gz,lineHeight:1.5}}>{f.d}</p></div>
            </div>
          ))}
        </div>
        <button onClick={()=>go("adminLogin")} style={{background:"none",border:"none",color:"transparent",fontSize:"0.1rem",cursor:"default",marginTop:20,width:"100%",padding:"8px"}}>.</button>
      </div>
    </div>
  );
}

function IntroScreen({ go, back }) {
  return (
    <SC>
      <button onClick={back} style={{ display:"flex", alignItems:"center", gap:5, background:"none", border:"none", color:C.roxo, fontFamily:"Poppins", fontSize:"0.82rem", cursor:"pointer", padding:0, marginBottom:20 }}>
        <svg width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M6 1L1 6L6 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>Voltar
      </button>
      <Logo h={20}/>
      <h2 style={{ fontSize:"1.3rem", fontWeight:700, color:C.roxo, marginTop:22, marginBottom:16 }}>Como funciona</h2>
      <p style={{ fontSize:"0.93rem", color:C.pet, lineHeight:1.8, marginBottom:22 }}>Esta experiência ajuda-te a observar a tua relação em áreas essenciais como segurança, comunicação, intimidade, parceria e vínculo.</p>
      <p style={{ fontSize:"0.93rem", color:C.pet, lineHeight:1.8, marginBottom:22 }}>No final, vais receber uma leitura simples e um primeiro passo prático.</p>
      <p style={{ fontSize:"0.93rem", color:C.pet, lineHeight:1.8, marginBottom:28 }}>Responde com base na tua experiência recente. Não há respostas certas ou erradas.</p>
      <AppButton onClick={()=>go("userRegister")}>Continuar</AppButton>
    </SC>
  );
}

// ─── CONSENT ──────────────────────────────────────────────────────────────────
function ConsentScreen({go,back,consentChecked,setConsentChecked,setLegalModal,loggedIn,user}){
  return(<SC>
    <button onClick={back} style={{display:"flex",alignItems:"center",gap:5,background:"none",border:"none",color:C.roxo,fontFamily:"Poppins",fontSize:"0.82rem",cursor:"pointer",padding:0,marginBottom:20}}>← Voltar</button>
    {user&&<div style={{background:C.ok+"10",borderRadius:10,padding:"8px 12px",marginBottom:13,display:"flex",alignItems:"center",gap:7}}><span style={{fontSize:13}}>👋</span><p style={{fontSize:"0.81rem",color:C.ok,fontWeight:600}}>Olá, {user.name.split(" ")[0]}!</p></div>}
    <h2 style={{fontSize:"1.25rem",fontWeight:700,color:C.roxo,marginBottom:16}}>Antes de começares</h2>
    <div style={{background:C.wh,borderRadius:13,padding:"15px",boxShadow:"0 1px 7px rgba(44,73,81,0.06)",marginBottom:18}}>
      <p style={{fontSize:"0.87rem",color:C.pet,lineHeight:1.8}}>Esta app é uma ferramenta orientadora baseada em auto-relato.</p>
      <p style={{fontSize:"0.87rem",color:C.pet,lineHeight:1.8,marginTop:9}}>Não substitui avaliação psicológica, terapia ou apoio em situações de risco.</p>
      <p style={{fontSize:"0.87rem",color:C.pet,lineHeight:1.8,marginTop:9}}>Se existirem sinais de medo, controlo ou violência, o percurso será ajustado para dar prioridade à segurança.</p>
    </div>
    <div onClick={()=>setConsentChecked(!consentChecked)} style={{display:"flex",gap:11,padding:"13px",background:C.wh,borderRadius:12,border:"2px solid "+(consentChecked?C.roxo:C.sep),cursor:"pointer",marginBottom:18,transition:"all 0.15s"}}>
      <div style={{width:22,height:22,borderRadius:6,border:"2px solid "+(consentChecked?C.roxo:"rgba(132,130,144,0.4)"),background:consentChecked?C.roxo:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s"}}>
        {consentChecked&&<svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </div>
      <p style={{fontSize:"0.86rem",color:consentChecked?C.pet:C.gz,lineHeight:1.6}}>Compreendo e quero continuar</p>
    </div>
    <AppButton onClick={()=>go("safety")} dis={!consentChecked}>Continuar</AppButton>
    <div style={{display:"flex",gap:12,justifyContent:"center",marginTop:14}}>
      {[{l:"Privacidade",k:"privacidade"},{l:"Termos",k:"termos"}].map(lk=><button key={lk.k} onClick={()=>setLegalModal(lk.k)} style={{background:"none",border:"none",fontFamily:"Poppins",fontSize:"0.69rem",color:C.gz,cursor:"pointer",textDecoration:"underline"}}>{lk.l}</button>)}
    </div>
  </SC>);
}

function SafetyQScreen({ go, back, handleSafetyDone }) {
  const [answers, setAnswers] = useState({});
  const [qi, setQi] = useState(0);
  const q = SAFETY_QS[qi];
  const val = answers[q.id] ?? 0;
  const allDone = qi === SAFETY_QS.length - 1 && answers[q.id] !== undefined;

  const advance = (v) => {
    const newAns = { ...answers, [q.id]: v };
    setAnswers(newAns);
    if (qi < SAFETY_QS.length - 1) {
      setTimeout(() => setQi(qi + 1), 250);
    }
  };

  const done = () => {
    const finalAns = { ...answers, [q.id]: val };
    handleSafetyDone(finalAns);
  };

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", background:C.iv, fontFamily:"Poppins" }}>
      {/* Header */}
      <div style={{ background:C.wh, flexShrink:0, borderBottom:"1px solid "+C.sep }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 16px 6px" }}>
          <button onClick={back} style={{ background:"none", border:"none", cursor:"pointer", color:C.gz, fontFamily:"Poppins", fontSize:"0.78rem" }}>←</button>
          <Logo h={16}/>
          <span style={{ fontSize:"0.72rem", color:C.gz }}>{qi+1}/{SAFETY_QS.length}</span>
        </div>
        <ProgressBar current={qi+1} total={SAFETY_QS.length} color={C.bad}/>
        {/* Verification label */}
        <div style={{ padding:"0 16px 10px", display:"flex", alignItems:"center", gap:6 }}>
          <div style={{ width:7, height:7, borderRadius:"50%", background:C.bad }}/>
          <span style={{ fontSize:"0.67rem", fontWeight:700, color:C.bad, textTransform:"uppercase", letterSpacing:"0.08em" }}>Verificação de segurança</span>
        </div>
      </div>
      {/* Question */}
      <div style={{ flex:1, padding:"24px 20px 12px", display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
        <div>
          <p style={{ fontSize:"0.67rem", color:C.gz, marginBottom:8 }}>Pergunta {qi+1} de {SAFETY_QS.length}</p>
          <p style={{ fontSize:"1.05rem", fontWeight:500, color:C.pet, lineHeight:1.68, marginBottom:28 }}>{q.text}</p>
          <ScaleSelector min={0} max={4} value={val} onChange={v=>{ setAnswers(a=>({...a,[q.id]:v})); }} color={C.bad}/>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10, marginTop:20 }}>
          {qi < SAFETY_QS.length - 1 ? (
            <AppButton onClick={()=>advance(val)}>Seguinte →</AppButton>
          ) : (
            <AppButton onClick={done} color={C.bad}>Ver resultado da verificação</AppButton>
          )}
          {qi > 0 && <AppButton onClick={()=>setQi(qi-1)} variant="ghost" sx={{fontSize:"0.85rem"}}>← Voltar</AppButton>}
        </div>
      </div>
    </div>
  );
}

// ─── SAFETY RESULT ────────────────────────────────────────────────────────────
function SafetyResultScreen({go,back,restart,safetyResult}){
  const RESOURCES=[
    {l:"APAV — Apoio à Vítima",n:"116 006",href:"tel:116006"},
    {l:"CIG — Comissão Igualdade",n:"800 202 148",href:"tel:800202148"},
    {l:"SOS Emergência",n:"112",href:"tel:112"},
  ];
  if(safetyResult==="alto") return(
    <SC>
      <div style={{textAlign:"center",marginBottom:20}}>
        <div style={{width:60,height:60,borderRadius:"50%",background:C.bad+"15",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",fontSize:26}}>🛑</div>
        <h2 style={{fontSize:"1.1rem",fontWeight:700,color:C.bad,marginBottom:10}}>Antes de continuar, a prioridade é a tua segurança</h2>
        <p style={{fontSize:"0.88rem",color:C.pet,lineHeight:1.75}}>As tuas respostas mostram sinais importantes de medo, controlo, humilhação ou possível violência. Esta app não vai avançar com exercícios relacionais neste momento.</p>
        <p style={{fontSize:"0.88rem",fontWeight:600,color:C.bad,lineHeight:1.75,marginTop:8}}>O mais importante agora é a tua segurança.</p>
      </div>
      <div style={{background:C.wh,borderRadius:13,padding:"13px",marginBottom:16,boxShadow:"0 1px 6px rgba(44,73,81,0.06)"}}>
        <p style={{fontSize:"0.62rem",fontWeight:700,color:C.gz,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:11}}>Recursos de apoio</p>
        {RESOURCES.map((r,i)=><a key={i} href={r.href} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:i<RESOURCES.length-1?"1px solid rgba(44,73,81,0.07)":"none",textDecoration:"none"}}><span style={{fontSize:"0.8rem",color:C.pet}}>{r.l}</span><span style={{fontSize:"0.83rem",fontWeight:700,color:C.bad}}>{r.n}</span></a>)}
      </div>
      <AppButton onClick={()=>window.open("https://apav.pt","_blank")} variant="danger">Ver recursos de apoio</AppButton>
      <AppButton onClick={restart} variant="ghost" sx={{marginTop:9}}>Terminar</AppButton>
    </SC>
  );
  if(safetyResult==="moderado") return(
    <SC>
      <div style={{textAlign:"center",marginBottom:20}}>
        <div style={{width:60,height:60,borderRadius:"50%",background:C.warn+"15",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",fontSize:26}}>⚠️</div>
        <h2 style={{fontSize:"1.1rem",fontWeight:700,color:C.warn,marginBottom:10}}>Vale a pena avançar com cuidado</h2>
        <p style={{fontSize:"0.88rem",color:C.pet,lineHeight:1.75}}>As tuas respostas mostram sinais que merecem atenção. Se te sentires em medo, controlo ou insegurança, a prioridade é a tua protecção.</p>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:9}}>
        <AppButton onClick={()=>go("mainIntro")} variant="warn">Continuar com cuidado</AppButton>
        <AppButton onClick={()=>window.open("https://apav.pt","_blank")} variant="secondary">Ver recursos de apoio</AppButton>
      </div>
    </SC>
  );
  return(
    <SC>
      <div style={{textAlign:"center",marginBottom:22}}>
        <div style={{width:60,height:60,borderRadius:"50%",background:C.ok+"15",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",fontSize:26}}>✓</div>
        <h2 style={{fontSize:"1.1rem",fontWeight:700,color:C.ok,marginBottom:10}}>Podemos continuar</h2>
        <p style={{fontSize:"0.88rem",color:C.pet,lineHeight:1.75}}>Não surgiram sinais elevados neste rastreio inicial. Vamos agora olhar para a relação de forma mais ampla.</p>
      </div>
      <AppButton onClick={()=>go("mainIntro")}>Continuar</AppButton>
    </SC>
  );
}

function MainIntroScreen({ go, back }) {
  return (
    <SC>
      <Logo h={20}/>
      <h2 style={{ fontSize:"1.3rem", fontWeight:700, color:C.roxo, marginTop:24, marginBottom:16 }}>Agora, olha para a tua relação</h2>
      <p style={{ fontSize:"0.93rem", color:C.pet, lineHeight:1.8, marginBottom:14 }}>Responde com base na tua experiência recente.</p>
      <p style={{ fontSize:"0.93rem", color:C.pet, lineHeight:1.8, marginBottom:28 }}>No final, vais receber uma leitura simples e um primeiro passo.</p>
      {/* Dimension preview */}
      <div style={{ background:C.wh, borderRadius:13, padding:"14px", marginBottom:24, boxShadow:"0 1px 7px rgba(44,73,81,0.06)" }}>
        <p style={{ fontSize:"0.67rem", fontWeight:700, color:C.gz, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:11 }}>Áreas que vais avaliar</p>
        {DIMS.map(d=>(
          <div key={d.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 0", borderBottom:"1px solid rgba(44,73,81,0.06)" }}>
            <span style={{ color:C.roxo, fontSize:13 }}>{d.icon}</span>
            <span style={{ fontSize:"0.83rem", color:C.pet }}>{d.label}</span>
          </div>
        ))}
        <p style={{ fontSize:"0.72rem", color:C.gz, marginTop:10, textAlign:"center" }}>40 perguntas · escala 0–10 · ~8 minutos</p>
      </div>
      <AppButton onClick={()=>go("question")}>Começar questionário</AppButton>
    </SC>
  );
}

// ─── QUESTION SCREEN ──────────────────────────────────────────────────────────
function QuestionScreen({go,back,handleMainDone}){
  const [qi,setQi]=useState(0);
  const [answers,setAnswers]=useState({});
  const [sv,setSv]=useState(5);
  const q=MAIN_QS[qi];
  const dimI=Math.floor(qi/8);
  const qInD=qi%8;
  const dim=DIMS[dimI];
  
    if(qi<39){
      setQi(qi+1);
      setSv(newAns[MAIN_QS[qi+1].id]??5);
      setAnswers(newAns);
    } else {
      handleMainDone(newAns);
    }
  };
  const goPrev=()=>{
    if(qi===0){back();return;}
    const newAns={...answers,[q.id]:sv};
    setAnswers(newAns);
    setQi(qi-1);
    setSv(newAns[MAIN_QS[qi-1].id]??5);
  };
  return(
    <div style={{height:"100%",display:"flex",flexDirection:"column",background:C.iv,fontFamily:"Poppins"}}>
      <style>{`input[type=range]{-webkit-appearance:none;appearance:none;outline:none;cursor:pointer;height:6px;border-radius:4px;width:100%}input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:28px;height:28px;border-radius:50%;background:${C.roxo};cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.2)}`}</style>
      <div style={{background:C.wh,flexShrink:0,borderBottom:"1px solid "+C.sep}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 15px 6px"}}>
          <button onClick={goPrev} style={{background:"none",border:"none",cursor:"pointer",color:C.gz,fontFamily:"Poppins",fontSize:"0.78rem"}}>←</button>
          <Logo h={15}/>
          <span style={{fontSize:"0.72rem",color:C.gz}}>{qi+1}/40</span>
        </div>
        {/* Journey dots — 5 dimensions */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"6px 16px 10px",gap:0}}>
          {DIMS.map((d,i)=>{
            const done=i<dimI;
            const active=i===dimI;
            return(
              <div key={i} style={{display:"flex",alignItems:"center"}}>
                {/* Connector line before dot (except first) */}
                {i>0&&<div style={{width:active?28:done?28:20,height:2,background:done?"linear-gradient(90deg,"+C.roxo+","+C.roxoL+")":"rgba(132,130,144,0.18)",transition:"all 0.3s",flexShrink:0}}/>}
                {/* Dot */}
                <div style={{
                  width:active?32:done?22:18,
                  height:active?32:done?22:18,
                  borderRadius:"50%",
                  background:active?"linear-gradient(135deg,"+C.roxo+","+C.roxoL+")":done?C.roxo:"rgba(132,130,144,0.15)",
                  border:active?"none":done?"none":"1.5px solid rgba(132,130,144,0.25)",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  flexShrink:0,
                  transition:"all 0.3s",
                  boxShadow:active?"0 3px 10px rgba(76,48,94,0.35)":"none",
                }}>
                  {done&&<svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3 5.5L8 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  {active&&<span style={{fontSize:"0.62rem",color:"white",fontWeight:700}}>{d.icon}</span>}
                  {!done&&!active&&<span style={{fontSize:"0.58rem",color:"rgba(132,130,144,0.5)"}}>{d.icon}</span>}
                </div>
              </div>
            );
          })}
        </div>
        {/* Current dim label + question count */}
        <div style={{display:"flex",justifyContent:"space-between",padding:"0 14px 8px"}}>
          <span style={{fontSize:"0.67rem",fontWeight:700,color:C.roxo,textTransform:"uppercase",letterSpacing:"0.08em"}}>{dim.label}</span>
          <span style={{fontSize:"0.64rem",color:C.gz}}>Perg. {qInD+1}/8</span>
        </div>
      </div>
      <div style={{flex:1,padding:"20px 18px 12px",display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
        <div>

          <p style={{fontSize:"1.05rem",fontWeight:500,color:C.pet,lineHeight:1.68,marginBottom:26}}>{q.text}</p>
          <div style={{textAlign:"center",marginBottom:14}}>
            <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:56,height:56,borderRadius:"50%",background:"linear-gradient(135deg,"+C.roxo+","+C.roxoL+")",marginBottom:6}}>
              <span style={{color:"white",fontSize:"1.3rem",fontWeight:700}}>{sv}</span>
            </div>
            <p style={{fontSize:"0.76rem",color:sv<=3?C.bad:sv<=6?C.warn:C.ok,fontWeight:500}}>{sv===0?"Nada verdadeiro":sv===10?"Totalmente verdadeiro":""}</p>
          </div>
          <input type="range" min={0} max={10} step={1} value={sv} onChange={e=>setSv(Number(e.target.value))} style={{background:"linear-gradient(to right,"+C.roxo+" "+(sv*10)+"%,rgba(132,130,144,0.18) "+(sv*10)+"%)"}}/>
          <div style={{display:"flex",justifyContent:"space-between",padding:"3px 2px 0"}}>
            {[0,1,2,3,4,5,6,7,8,9,10].map(i=><button key={i} onClick={()=>setSv(i)} style={{fontFamily:"Poppins",fontSize:i===sv?"0.7rem":"0.61rem",color:i===sv?C.roxo:"rgba(132,130,144,0.35)",fontWeight:i===sv?700:400,background:"none",border:"none",cursor:"pointer",padding:0,minWidth:14}}>{i}</button>)}
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
            <span style={{fontSize:"0.59rem",color:C.gz}}>Nada verdadeiro</span>
            <span style={{fontSize:"0.59rem",color:C.gz}}>Totalmente verdadeiro</span>
          </div>
          {qi===39&&<p style={{textAlign:"center",fontSize:"0.71rem",color:C.ok,marginTop:14,fontWeight:600}}>Última pergunta ✨</p>}
        </div>
        <div style={{display:"flex",gap:9,marginTop:16}}>
          {qi>0&&<button onClick={goPrev} style={{padding:"10px 16px",borderRadius:11,background:"rgba(76,48,94,0.08)",border:"none",fontFamily:"Poppins",fontSize:"0.83rem",fontWeight:500,color:"#4C305E",cursor:"pointer"}}>← Anterior</button>}
          <AppButton onClick={goNext} sx={{flex:1}}>
            {qi===39?"Ver resultados ✓":qInD===7?"Próxima dimensão →":"Seguinte →"}
          </AppButton>
        </div>
      </div>
    </div>
  );
}
function ProcessingScreen() {
  const [dots, setDots] = useState(0);
  useEffect(() => { const t = setInterval(() => setDots(d=>(d+1)%4), 400); return ()=>clearInterval(t); }, []);
  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:C.iv, fontFamily:"Poppins", padding:"24px" }}>
      <div style={{ width:60, height:60, borderRadius:"50%", border:`3px solid ${C.lavL}`, borderTop:`3px solid ${C.roxo}`, animation:"spin 1s linear infinite", marginBottom:28 }}/>
      <h3 style={{ fontSize:"1.1rem", fontWeight:700, color:C.roxo, marginBottom:10 }}>A analisar as tuas respostas{"…".slice(0,dots+1)}</h3>
      <p style={{ fontSize:"0.87rem", color:C.gz, textAlign:"center", lineHeight:1.65 }}>A procurar a área que pode beneficiar de mais cuidado agora.</p>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
    </div>
  );
}

// ─── RESULT ───────────────────────────────────────────────────────────────────
function Radar({scores}){
  const sz=200,cx=100,cy=100,r=72,n=5;
  const ang=DIMS.map((_,i)=>(i*2*Math.PI/n)-Math.PI/2);
  const vals=DIMS.map(d=>scores[d.id]||0);
  const pts=vals.map((v,i)=>{const a=ang[i],d=(v/10)*r;return(cx+d*Math.cos(a))+","+(cy+d*Math.sin(a));}).join(" ");
  const grid=[3,5,7,10];
  return(
    <svg viewBox="0 0 200 200" width="100%" style={{maxWidth:220,display:"block",margin:"0 auto"}}>
      {grid.map(v=>(<polygon key={v} points={DIMS.map((_,i)=>{const a=ang[i],d=(v/10)*r;return(cx+d*Math.cos(a))+","+(cy+d*Math.sin(a));}).join(" ")} fill="none" stroke="rgba(132,130,144,0.12)" strokeWidth="1"/>))}
      {ang.map((a,i)=><line key={i} x1={cx} y1={cy} x2={cx+(r)*Math.cos(a)} y2={cy+(r)*Math.sin(a)} stroke="rgba(132,130,144,0.12)" strokeWidth="1"/>)}
      <polygon points={pts} fill="rgba(76,48,94,0.15)" stroke="#4C305E" strokeWidth="2" strokeLinejoin="round"/>
      {vals.map((v,i)=>{const a=ang[i],d=(v/10)*r;const col=v>=7?"#4a8a6e":v>=5?"#c09040":"#c0605a";return(<circle key={i} cx={cx+d*Math.cos(a)} cy={cy+d*Math.sin(a)} r="5" fill={col} stroke="white" strokeWidth="1.5"/>);})}
      {DIMS.map((d,i)=>{const a=ang[i],dist=r+18,x=cx+dist*Math.cos(a),y=cy+dist*Math.sin(a);return(<text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#848290" fontFamily="Poppins">{d.short}</text>);})}
    </svg>
  );
}

function ResultScreen({go,scores,loggedIn}){
  if(!scores) return null;
  const {byDim,global,lowest}=scores;
  const level=getLevel(global);
  const levelCol=levelColor(level);
  const dimResult=DIM_RESULTS[lowest];
  return(
    <div style={{height:"100%",display:"flex",flexDirection:"column",background:"#F2F2F7",fontFamily:"Poppins"}}>
      <div style={{background:"linear-gradient(135deg,"+C.roxo+","+C.roxoL+")",padding:"16px 18px 20px"}}>
        <button onClick={()=>go("home")} style={{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:50,padding:"4px 12px",color:"white",fontFamily:"Poppins",fontSize:"0.74rem",cursor:"pointer",marginBottom:10}}>⌂ Início</button>
        <Logo h={17} dark/>
        <p style={{color:"rgba(255,255,255,0.55)",fontSize:"0.65rem",textTransform:"uppercase",letterSpacing:"0.1em",marginTop:13,marginBottom:3}}>Resultado</p>
        <div style={{display:"flex",alignItems:"flex-end",gap:11,marginBottom:7}}>
          <p style={{color:"white",fontSize:"2.4rem",fontWeight:700,lineHeight:1}}>{global}</p>
          <div><p style={{color:"rgba(255,255,255,0.55)",fontSize:"0.68rem"}}>de 10</p><div style={{background:"rgba(255,255,255,0.15)",borderRadius:50,padding:"3px 11px"}}><p style={{color:"white",fontSize:"0.77rem",fontWeight:700}}>{level}</p></div></div>
        </div>
        <p style={{color:"rgba(255,255,255,0.7)",fontSize:"0.81rem",lineHeight:1.6}}>{GLOBAL_TEXT[level]}</p>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"14px 15px 28px"}}>
        {/* Radar Chart */}
        <div style={{background:C.wh,borderRadius:14,padding:"14px",marginBottom:12,boxShadow:"0 1px 7px rgba(44,73,81,0.06)"}}>
          <p style={{fontSize:"0.62rem",fontWeight:700,color:C.gz,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:12}}>Gráfico por dimensão</p>
          <Radar scores={byDim}/>
          <div style={{display:"flex",flexWrap:"wrap",gap:7,justifyContent:"center",marginTop:11,borderTop:"1px solid rgba(44,73,81,0.07)",paddingTop:10}}>
            {DIMS.map(d=>{const s=byDim[d.id];const col=s>=7?"#4a8a6e":s>=5?"#c09040":"#c0605a";return(<div key={d.id} style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:7,height:7,borderRadius:"50%",background:col}}/><span style={{fontSize:"0.67rem",color:C.gz}}>{d.icon} {d.short}: <strong style={{color:col}}>{s}</strong></span></div>);})}
          </div>
        </div>
        {/* Main insight */}
        <div style={{background:C.wh,borderRadius:13,padding:"14px",marginBottom:12,borderLeft:"4px solid "+levelCol,boxShadow:"0 1px 7px rgba(44,73,81,0.06)"}}>
          <p style={{fontWeight:700,fontSize:"0.87rem",color:C.pet,marginBottom:7}}>{dimResult?.titulo}</p>
          <p style={{fontSize:"0.82rem",color:C.gz,lineHeight:1.65}}>{dimResult?.desc}</p>
        </div>
        {/* Dimension bars */}
        <div style={{background:C.wh,borderRadius:13,padding:"13px",marginBottom:12,boxShadow:"0 1px 7px rgba(44,73,81,0.06)"}}>
          <p style={{fontSize:"0.62rem",fontWeight:700,color:C.gz,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:12}}>Por dimensão</p>
          {DIMS.map(d=>{const s=byDim[d.id];const lv=getLevel(s);const col=levelColor(lv);const isL=d.id===lowest;return(
            <div key={d.id} style={{marginBottom:11}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><div style={{display:"flex",alignItems:"center",gap:5}}><span style={{fontSize:10}}>{d.icon}</span><span style={{fontSize:"0.81rem",fontWeight:isL?700:400,color:isL?C.pet:C.gz}}>{d.short}{isL&&" ↓"}</span></div><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontWeight:700,color:col,fontSize:"0.88rem"}}>{s}</span><span style={{fontSize:"0.62rem",color:col}}>{lv}</span></div></div>
              <div style={{height:5,background:"rgba(132,130,144,0.12)",borderRadius:3,overflow:"hidden"}}><div style={{width:(s/10*100)+"%",height:"100%",background:col,borderRadius:3}}/></div>
            </div>
          );})}
        </div>
        <AppButton onClick={()=>go("exercise")}>Ver primeiro passo →</AppButton>
        {!loggedIn&&<div style={{background:C.roxo+"08",borderRadius:12,padding:"12px 14px",marginTop:10}}>
          <p style={{fontWeight:700,color:C.pet,fontSize:"0.84rem",marginBottom:4}}>Guarda os teus resultados</p>
          <p style={{fontSize:"0.77rem",color:C.gz,lineHeight:1.6,marginBottom:9}}>Cria conta para monitorizar até 6 meses.</p>
          <AppButton onClick={()=>go("userRegister")}>Criar conta gratuita →</AppButton>
        </div>}
        {loggedIn&&<div style={{background:C.ok+"10",borderRadius:12,padding:"10px 14px",marginTop:10,display:"flex",alignItems:"center",gap:8}}><span>✓</span><p style={{fontSize:"0.78rem",color:C.ok,fontWeight:600}}>Guardado no teu historial</p></div>}
        <AppButton onClick={()=>go("booking")} variant="secondary" sx={{marginTop:10,fontSize:"0.83rem"}}>Agendar consulta →</AppButton>
        <div style={{marginTop:13}}><FooterNote/></div>
      </div>
    </div>
  );
}

function ExerciseScreen({go, back, scores}){
  if(!scores) return null;
  const level = getLevel(scores.global);
  const task = getTask(scores.lowest, level);
  const dim = DIMS.find(d=>d.id===scores.lowest);
  const [done, setDone] = useState(false);

  return(
    <SC>
      <button onClick={back} style={{display:"flex",alignItems:"center",gap:5,background:"none",border:"none",color:C.roxo,fontFamily:"Poppins",fontSize:"0.82rem",cursor:"pointer",padding:"0 0 18px 0"}}>← Voltar</button>
      <Logo h={19}/>

      {/* Dim + level badge */}
      <div style={{display:"flex",gap:8,alignItems:"center",marginTop:16,marginBottom:6}}>
        <span style={{fontSize:18}}>{task?.icon}</span>
        <div>
          <p style={{fontSize:"0.68rem",fontWeight:700,color:C.gz,textTransform:"uppercase",letterSpacing:"0.08em"}}>{dim?.label} · {level}</p>
        </div>
      </div>

      <h2 style={{fontSize:"1.2rem",fontWeight:700,color:C.roxo,marginBottom:18}}>{task?.title}</h2>

      {/* Task card */}
      <div style={{background:C.wh,borderRadius:16,padding:"18px",boxShadow:"0 2px 14px rgba(44,73,81,0.08)",marginBottom:14,borderTop:"4px solid "+C.roxo}}>
        <pre style={{fontSize:"0.99rem",fontWeight:500,color:C.pet,lineHeight:1.75,whiteSpace:"pre-wrap",fontFamily:"Poppins"}}>{task?.text}</pre>
      </div>

      {/* Rule */}
      <div style={{background:C.roxo+"08",borderRadius:12,padding:"12px 15px",marginBottom:22,display:"flex",gap:9,alignItems:"flex-start"}}>
        <span style={{fontSize:15,flexShrink:0}}>💡</span>
        <p style={{fontSize:"0.84rem",color:C.pet,lineHeight:1.65,fontStyle:"italic"}}>{task?.rule}</p>
      </div>

      <p style={{fontSize:"0.87rem",color:C.gz,textAlign:"center",lineHeight:1.7,marginBottom:20}}>Não precisam resolver tudo hoje.<br/>Só começar de forma diferente.</p>

      {/* Mark as done */}
      <div onClick={()=>setDone(!done)} style={{display:"flex",gap:11,padding:"13px",background:C.wh,borderRadius:13,border:"2px solid "+(done?C.ok:C.sep),cursor:"pointer",marginBottom:14,transition:"all 0.15s"}}>
        <div style={{width:22,height:22,borderRadius:6,border:"2px solid "+(done?C.ok:"rgba(132,130,144,0.4)"),background:done?C.ok:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s"}}>
          {done&&<svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </div>
        <div>
          <p style={{fontSize:"0.86rem",fontWeight:600,color:done?C.ok:C.pet}}>{done?"Tarefa marcada como feita ✓":"Marcar como feita"}</p>
          <p style={{fontSize:"0.72rem",color:C.gz,marginTop:2}}>{done?"Bom trabalho! Volta daqui a uma semana para avaliar.":"Marca quando completares o exercício."}</p>
        </div>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <AppButton onClick={()=>go("schedule")}>Agendar este passo</AppButton>
        <AppButton onClick={()=>go("confirmation")} variant="ghost">Terminar sem agendar</AppButton>
      </div>
    </SC>
  );
}

function ScheduleScreen({go,back,handleSchedule,scores}){
  const [date,setDate]=useState("2026-03-24");
  const [time,setTime]=useState("20:00");
  const [repeat,setRepeat]=useState("nao");
  const [note,setNote]=useState("");
  const ex=scores?getTask(scores.lowest,getLevel(scores.global)):null;
  const dim=scores?DIMS.find(d=>d.id===scores.lowest):null;
  return(<SC>
    <button onClick={back} style={{display:"flex",alignItems:"center",gap:5,background:"none",border:"none",color:C.roxo,fontFamily:"Poppins",fontSize:"0.82rem",cursor:"pointer",padding:0,marginBottom:20}}>← Voltar</button>
    <Logo h={19}/>
    <h2 style={{fontSize:"1.2rem",fontWeight:700,color:C.roxo,marginTop:16,marginBottom:6}}>Agendar este passo</h2>
    {ex&&dim&&<div style={{background:C.wh,borderRadius:11,padding:"11px 13px",marginBottom:16,boxShadow:"0 1px 6px rgba(44,73,81,0.06)",display:"flex",gap:9,alignItems:"center"}}><span style={{color:C.roxo,fontSize:15}}>{dim.icon}</span><div><p style={{fontWeight:700,fontSize:"0.81rem",color:C.pet}}>{ex.title}</p><p style={{fontSize:"0.7rem",color:C.gz}}>{dim.label}</p></div></div>}
    {[{l:"Data",v:date,set:setDate,t:"date"},{l:"Hora",v:time,set:setTime,t:"time"}].map((f,i)=>(
      <div key={i} style={{marginBottom:13}}><p style={{fontSize:"0.79rem",fontWeight:600,color:C.pet,marginBottom:6}}>{f.l}</p><input type={f.t} value={f.v} onChange={e=>f.set(e.target.value)} style={{width:"100%",padding:"12px 13px",borderRadius:11,border:"1.5px solid "+C.lav,fontFamily:"Poppins",fontSize:"0.9rem",outline:"none",color:C.pet,background:C.iv,boxSizing:"border-box"}}/></div>
    ))}
    <p style={{fontSize:"0.79rem",fontWeight:600,color:C.pet,marginBottom:8}}>Repetição</p>
    <div style={{display:"flex",gap:7,marginBottom:13}}>
      {[{id:"nao",l:"Não repetir"},{id:"amanha",l:"Amanhã"},{id:"semana",l:"Semanal"}].map(r=><button key={r.id} onClick={()=>setRepeat(r.id)} style={{flex:1,padding:"9px 4px",borderRadius:10,border:"2px solid "+(repeat===r.id?C.roxo:C.lav),background:repeat===r.id?C.roxo+"08":"transparent",fontFamily:"Poppins",fontSize:"0.74rem",fontWeight:repeat===r.id?700:400,color:repeat===r.id?C.roxo:C.gz,cursor:"pointer"}}>{r.l}</button>)}
    </div>
    <div style={{marginBottom:18}}><p style={{fontSize:"0.79rem",fontWeight:600,color:C.pet,marginBottom:6}}>Nota <span style={{fontWeight:400,color:C.gz}}>(opcional)</span></p><textarea value={note} onChange={e=>setNote(e.target.value)} rows={2} placeholder="Ex.: depois de jantar..." style={{width:"100%",padding:"10px 13px",borderRadius:11,border:"1.5px solid "+C.lav,fontFamily:"Poppins",fontSize:"0.87rem",outline:"none",color:C.pet,background:C.iv,boxSizing:"border-box",resize:"none"}}/></div>
    <AppButton onClick={()=>handleSchedule({date,time,repeat,note,exerciseKey:scores?.lowest})}>Guardar agendamento</AppButton>
    <AppButton onClick={back} variant="ghost" sx={{marginTop:9}}>Voltar</AppButton>
  </SC>);
}

function ConfirmationScreen({ restart, scheduleData, go }) {
  const scheduled = !!scheduleData;
  return (
    <SC>
      <div style={{ textAlign:"center", flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"70vh" }}>
        <div style={{ width:70, height:70, borderRadius:"50%", background:(scheduled?C.ok:C.roxo)+"15", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", fontSize:30 }}>
          {scheduled?"📅":"✓"}
        </div>
        <h2 style={{ fontSize:"1.25rem", fontWeight:700, color:C.pet, marginBottom:12 }}>
          {scheduled ? "Ficou agendado" : "Primeiro passo disponível"}
        </h2>
        <p style={{ fontSize:"0.92rem", color:C.gz, lineHeight:1.75, maxWidth:300, margin:"0 auto 28px" }}>
          {scheduled
            ? "O teu primeiro passo ficou marcado. Às vezes, começar pequeno é o mais importante."
            : "Podes voltar a este exercício quando quiseres."}
        </p>
        {scheduled && scheduleData && (
          <div style={{ background:C.wh, borderRadius:12, padding:"12px 18px", marginBottom:24, boxShadow:"0 1px 6px rgba(44,73,81,0.06)", textAlign:"left", width:"100%" }}>
            <p style={{ fontSize:"0.81rem", color:C.pet }}>📅 <strong>{scheduleData.date}</strong> às <strong>{scheduleData.time}</strong></p>
            {scheduleData.repeat!=="nao"&&<p style={{ fontSize:"0.76rem", color:C.gz, marginTop:4 }}>🔁 {scheduleData.repeat==="semana"?"Todas as semanas":"Amanhã"}</p>}
            {scheduleData.note&&<p style={{ fontSize:"0.76rem", color:C.gz, marginTop:4, fontStyle:"italic" }}>💬 {scheduleData.note}</p>}
          </div>
        )}
        <Logo h={18}/>
      </div>
      <AppButton onClick={restart}>Voltar ao início</AppButton>
    </SC>
  );
}

// ─── LEGAL SCREEN ─────────────────────────────────────────────────────────────
function LegalScreen({ type, back }) {
  const doc = LEGAL[type];
  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", background:"#F2F2F7", fontFamily:"Poppins" }}>
      <div style={{ background:C.wh, borderBottom:"1px solid "+C.sep, padding:"12px 16px", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
        <button onClick={back} style={{ background:"none", border:"none", cursor:"pointer", color:C.roxo, fontSize:"0.87rem", display:"flex", alignItems:"center", gap:4, fontFamily:"Poppins" }}>
          <svg width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M6 1L1 6L6 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>Voltar
        </button>
        <p style={{ fontWeight:700, fontSize:"0.9rem", color:C.pet }}>{doc?.title}</p>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"18px" }}>
        <pre style={{ fontSize:"0.82rem", color:C.pet, lineHeight:1.8, fontFamily:"Poppins", whiteSpace:"pre-wrap" }}>{doc?.body}</pre>
      </div>
    </div>
  );
}

// ─── RETURNING USER ───────────────────────────────────────────────────────────
function ReturningUserScreen({go,user,userHistory}){
  const ONE_WEEK=7*24*60*60*1000;
  const last=[...userHistory].sort((a,b)=>b.date.localeCompare(a.date))[0]||null;
  const now=new Date(), lastDate=last?new Date(last.date+"T12:00:00"):null;
  const days=lastDate?Math.floor((now-lastDate)/(24*60*60*1000)):null;
  const canRetake=!last||(now-lastDate)>=ONE_WEEK;
  const retakeStr=lastDate?new Date(lastDate.getTime()+ONE_WEEK).toLocaleDateString("pt-PT",{day:"numeric",month:"long"}):null;
  const lc=s=>levelColor(getLevel(s));
  return(<div style={{height:"100%",display:"flex",flexDirection:"column",background:"#F2F2F7",fontFamily:"Poppins"}}>
    <div style={{background:`linear-gradient(135deg,${C.roxo},${C.roxoL})`,padding:"18px 20px 20px",flexShrink:0}}>
      <Logo h={17} dark/>
      <p style={{color:"rgba(255,255,255,0.6)",fontSize:"0.74rem",marginTop:12,marginBottom:2}}>Bem-vindo/a de volta</p>
      <h2 style={{color:"white",fontSize:"1.1rem",fontWeight:700}}>{user?.name?.split(" ")[0]} 👋</h2>
    </div>
    <div style={{flex:1,overflowY:"auto",padding:"13px 14px 24px"}}>
      {last&&<div style={{background:C.wh,borderRadius:13,padding:"12px",marginBottom:12,boxShadow:"0 1px 7px rgba(44,73,81,0.06)"}}>
        <p style={{fontSize:"0.61rem",fontWeight:700,color:C.gz,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:9}}>Última avaliação · {new Date(last.date+"T12:00:00").toLocaleDateString("pt-PT",{day:"numeric",month:"long",year:"numeric"})}</p>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <div style={{width:50,height:50,borderRadius:"50%",background:`linear-gradient(135deg,${C.roxo},${C.roxoL})`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <span style={{color:"white",fontSize:"1.15rem",fontWeight:700}}>{last.global}</span>
          </div>
          <div><p style={{fontWeight:700,fontSize:"0.9rem",color:C.pet}}>{last.level}</p><p style={{fontSize:"0.7rem",color:C.gz,marginTop:1}}>Score global</p></div>
        </div>
        {DIMS.map(d=>{const s=last.byDim[d.id];return(<div key={d.id} style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}><span style={{fontSize:9,color:C.gz,width:11}}>{d.icon}</span><div style={{flex:1,height:3,background:"rgba(132,130,144,0.1)",borderRadius:2,overflow:"hidden"}}><div style={{width:(s/10*100)+"%",height:"100%",background:lc(s),borderRadius:2}}/></div><span style={{fontSize:"0.67rem",fontWeight:700,color:lc(s),width:20,textAlign:"right"}}>{s}</span></div>);})}
        <button onClick={()=>go("history")} style={{background:"none",border:"none",fontFamily:"Poppins",fontSize:"0.74rem",color:C.roxo,cursor:"pointer",textDecoration:"underline",marginTop:7,padding:0}}>Ver historial →</button>
      </div>}
      {canRetake?<div>
        <div style={{background:C.ok+"10",borderRadius:11,padding:"11px 13px",marginBottom:11,display:"flex",gap:9}}><span style={{fontSize:15,flexShrink:0}}>✓</span><div><p style={{fontWeight:700,fontSize:"0.85rem",color:C.ok,marginBottom:2}}>{last?`${days} dias depois. Podes fazer nova avaliação!`:"Pronto para começar."}</p><p style={{fontSize:"0.74rem",color:C.gz,lineHeight:1.5}}>{last?"Os resultados serão comparados.":"Responde com honestidade."}</p></div></div>
        <AppButton onClick={()=>go("consent")}>{last?"Fazer nova avaliação →":"Começar →"}</AppButton>
      </div>:<div>
        <div style={{background:C.warn+"10",borderRadius:11,padding:"11px 13px",marginBottom:11,display:"flex",gap:9}}><span style={{fontSize:15,flexShrink:0}}>⏳</span><div><p style={{fontWeight:700,fontSize:"0.85rem",color:C.warn,marginBottom:2}}>Disponível em breve</p><p style={{fontSize:"0.74rem",color:C.gz,lineHeight:1.5}}>Recomendamos 1 semana entre avaliações.<br/><strong style={{color:C.pet}}>A partir de {retakeStr}.</strong></p></div></div>
        <AppButton onClick={()=>go("consent")} variant="secondary">Fazer mesmo assim →</AppButton>
      </div>}
      <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:11}}>
        <AppButton onClick={()=>go("booking")} variant="ghost">Agendar consulta →</AppButton>
        <AppButton onClick={()=>go("userProfile")} variant="ghost" sx={{fontSize:"0.8rem"}}>A minha conta</AppButton>
      </div>
    </div>
  </div>);
}

// ─── USER LOGIN ───────────────────────────────────────────────────────────────
function UserLogin({go,back,MOCK_USERS_DB,setUser,setLoggedIn,loginRedirect="home"}){
  const [em,setEm]=useState(""), [pw,setPw]=useState(""), [err,setErr]=useState("");
  const login=()=>{const u=MOCK_USERS_DB[em.toLowerCase()];if(!u){setErr("Email não encontrado.");return;}if(u.pw!==pw){setErr("Password incorrecta.");return;}setUser({name:u.name,email:em,role:"user"});setLoggedIn(true);go(loginRedirect==="consent"?"returningUser":loginRedirect);};
  return(<SC>
    <button onClick={back} style={{display:"flex",alignItems:"center",gap:5,background:"none",border:"none",color:C.roxo,fontFamily:"Poppins",fontSize:"0.82rem",cursor:"pointer",padding:0,marginBottom:22}}>← Voltar</button>
    <Logo h={20}/>
    <h2 style={{fontSize:"1.25rem",fontWeight:700,color:C.roxo,marginTop:20,marginBottom:6}}>Entrar na conta</h2>
    <p style={{fontSize:"0.83rem",color:C.gz,marginBottom:18}}>Acede ao teu historial e monitoriza a evolução.</p>
    <div style={{background:C.roxo+"08",borderRadius:9,padding:"8px 12px",marginBottom:14,fontSize:"0.71rem",color:C.pet,textAlign:"center"}}>Demo: utilizador@attunea.pt · demo1234</div>
    <div style={{background:C.wh,borderRadius:14,padding:"15px",boxShadow:"0 1px 7px rgba(44,73,81,0.06)",marginBottom:12}}>
      {[{l:"Email",v:em,set:setEm,ph:"o.teu@email.pt",t:"email"},{l:"Password",v:pw,set:setPw,ph:"••••••••",t:"password"}].map((f,i)=>(
        <div key={i} style={{marginBottom:i?0:13}}><p style={{fontSize:"0.81rem",fontWeight:600,color:C.pet,marginBottom:6}}>{f.l}</p><input value={f.v} onChange={e=>f.set(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} placeholder={f.ph} type={f.t} style={{width:"100%",padding:"12px 13px",borderRadius:11,border:"1.5px solid "+C.lav,fontFamily:"Poppins",fontSize:"0.9rem",outline:"none",color:C.pet,background:C.iv,boxSizing:"border-box"}}/></div>
      ))}
    </div>
    {err&&<p style={{fontSize:"0.78rem",color:C.bad,marginBottom:11,textAlign:"center"}}>{err}</p>}
    <AppButton onClick={login}>Entrar →</AppButton>
    <AppButton onClick={()=>go("userRegister")} variant="ghost" sx={{marginTop:9}}>Criar conta gratuita</AppButton>
  </SC>);
}
// ─── USER REGISTER ────────────────────────────────────────────────────────────
function UserRegister({go,back,setUser,setLoggedIn,setLegalModal,pairCode=null}){
  const [name,setName]=useState(""),[em,setEm]=useState(""),[pw,setPw]=useState("");
  const [c1,setC1]=useState(false),[c2,setC2]=useState(false),[err,setErr]=useState("");
  const reg=async()=>{
    if(!name||!em||!pw){setErr("Preenche todos os campos.");return;}
    if(pw.length<8){setErr("Password: mínimo 8 caracteres.");return;}
    if(!c1||!c2){setErr("Aceita os termos para continuar.");return;}
    setErr("A criar conta...");
    const result = await supaSignUp(em, pw, name, pairCode||null);
    if (result.error) { setErr(result.error); return; }
    const u = result.data;
    setUser({id:u.id, name:u.name, email:u.email, couple_code:u.couple_code, role:"user"});
    setLoggedIn(true);
    go("consent");
  };
  const Checkbox=({v,set,children})=>(
    <div onClick={()=>set(!v)} style={{display:"flex",gap:10,padding:"10px",background:C.wh,borderRadius:11,border:"2px solid "+(v?C.roxo:C.sep),cursor:"pointer",marginBottom:9,transition:"all 0.15s"}}>
      <div style={{width:20,height:20,borderRadius:5,border:"2px solid "+(v?C.roxo:"rgba(132,130,144,0.4)"),background:v?C.roxo:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        {v&&<svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </div>
      <p style={{fontSize:"0.79rem",color:v?C.pet:C.gz,lineHeight:1.5}}>{children}</p>
    </div>
  );
  return(<SC>
    <button onClick={back} style={{background:"none",border:"none",color:C.roxo,fontFamily:"Poppins",fontSize:"0.82rem",cursor:"pointer",padding:"0 0 20px 0"}}>← Voltar</button>
    <Logo h={20}/>
    <h2 style={{fontSize:"1.25rem",fontWeight:700,color:C.roxo,marginTop:18,marginBottom:6}}>Criar conta</h2>
    <p style={{fontSize:"0.83rem",color:C.gz,marginBottom:16}}>Para realizar a avaliação precisamos do teu nome e e-mail. Os resultados ficam guardados 6 meses.</p>
    <div style={{background:C.wh,borderRadius:14,padding:"14px",boxShadow:"0 1px 7px rgba(44,73,81,0.06)",marginBottom:12}}>
      {[{l:"Nome",v:name,set:setName,ph:"O teu nome",t:"text"},{l:"Email",v:em,set:setEm,ph:"o.teu@email.pt",t:"email"},{l:"Password",v:pw,set:setPw,ph:"Mínimo 8 caracteres",t:"password"}].map((f,i)=>(
        <div key={i} style={{marginBottom:i<2?12:0}}>
          <p style={{fontSize:"0.81rem",fontWeight:600,color:C.pet,marginBottom:5}}>{f.l}</p>
          <input value={f.v} onChange={e=>f.set(e.target.value)} placeholder={f.ph} type={f.t} style={{width:"100%",padding:"12px 13px",borderRadius:11,border:"1.5px solid "+C.lav,fontFamily:"Poppins",fontSize:"0.9rem",outline:"none",color:C.pet,background:C.iv,boxSizing:"border-box"}}/>
        </div>
      ))}
    </div>
    <Checkbox v={c1} set={setC1}>
      Aceito os <button onClick={e=>{e.stopPropagation();setLegalModal("termos");}} style={{background:"none",border:"none",color:C.roxo,fontFamily:"Poppins",fontSize:"0.79rem",fontWeight:600,cursor:"pointer",textDecoration:"underline",padding:0}}>Termos</button> e uso dos dados para melhoria da app e comunicações Attunea.
    </Checkbox>
    <Checkbox v={c2} set={setC2}>
      Aceito a <button onClick={e=>{e.stopPropagation();setLegalModal("privacidade");}} style={{background:"none",border:"none",color:C.roxo,fontFamily:"Poppins",fontSize:"0.79rem",fontWeight:600,cursor:"pointer",textDecoration:"underline",padding:0}}>Política de Privacidade</button> e conservação dos dados por 6 meses.
    </Checkbox>
    {err&&<p style={{fontSize:"0.78rem",color:C.bad,marginBottom:11,textAlign:"center"}}>{err}</p>}
    <AppButton onClick={reg} dis={!c1||!c2}>Criar conta →</AppButton>
    <button onClick={()=>go("userLoginFlow")} style={{background:"none",border:"none",fontFamily:"Poppins",fontSize:"0.79rem",color:C.gz,cursor:"pointer",textAlign:"center",marginTop:11,width:"100%"}}>Já tens conta? <span style={{color:C.roxo,fontWeight:600}}>Entrar</span></button>
  </SC>);
}

function UserProfile({go,back,user,setUser,setLoggedIn,userHistory}){
  const logout=()=>{setUser(null);setLoggedIn(false);go("home");};
  const oldest=userHistory.length>0?userHistory[0].date:null;
  const expires=oldest?new Date(new Date(oldest).getTime()+6*30*24*60*60*1000).toLocaleDateString("pt-PT"):null;
  return(<div style={{height:"100%",display:"flex",flexDirection:"column",background:"#F2F2F7",fontFamily:"Poppins"}}>
    <div style={{background:C.wh,borderBottom:"1px solid "+C.sep,padding:"12px 16px",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
      <button onClick={back} style={{background:"none",border:"none",cursor:"pointer",color:C.roxo,fontFamily:"Poppins",fontSize:"0.87rem"}}>← Voltar</button>
      <p style={{fontWeight:700,fontSize:"0.9rem",color:C.pet}}>A minha conta</p>
    </div>
    <div style={{flex:1,padding:"14px"}}>
      <div style={{background:C.wh,borderRadius:13,padding:"13px",marginBottom:11,boxShadow:"0 1px 7px rgba(44,73,81,0.06)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:expires?10:0}}>
          <div style={{width:42,height:42,borderRadius:"50%",background:`linear-gradient(135deg,${C.roxo},${C.roxoL})`,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:"0.95rem",fontWeight:700}}>{user?.name?.[0]||"U"}</div>
          <div><p style={{fontWeight:700,color:C.pet,fontSize:"0.88rem"}}>{user?.name}</p><p style={{fontSize:"0.71rem",color:C.gz,marginTop:1}}>{user?.email}</p></div>
        </div>
        {expires&&<div style={{background:C.warn+"10",borderRadius:8,padding:"6px 10px",fontSize:"0.73rem",color:C.warn}}>⏱ Dados até {expires}</div>}
      </div>
      <div style={{background:C.wh,borderRadius:13,padding:"12px",marginBottom:11,boxShadow:"0 1px 7px rgba(44,73,81,0.06)"}}>
        <p style={{fontWeight:700,color:C.roxo,fontSize:"1.3rem",lineHeight:1}}>{userHistory.length}</p>
        <p style={{fontSize:"0.71rem",color:C.gz,marginTop:2,marginBottom:9}}>avaliações guardadas</p>
        <AppButton onClick={()=>go("history")}>Ver historial →</AppButton>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {user?.couple_code&&<div style={{background:C.roxo+"08",borderRadius:11,padding:"11px 13px",marginBottom:11}}>
          <p style={{fontSize:"0.79rem",fontWeight:600,color:C.pet,marginBottom:6}}>Convida o teu parceiro(a)</p>
          <p style={{fontSize:"0.72rem",color:C.gz,marginBottom:8}}>Partilha este link para ficarem ligados como casal:</p>
          <div style={{display:"flex",gap:7}}>
            <input readOnly value={window.location.origin+"?pair="+user.couple_code} style={{flex:1,padding:"8px 10px",borderRadius:8,border:"1.5px solid "+C.lav,fontFamily:"Poppins",fontSize:"0.72rem",background:C.iv,color:C.pet}}/>
            <button onClick={()=>{navigator.clipboard.writeText(window.location.origin+"?pair="+user.couple_code);alert("Link copiado!");}} style={{padding:"8px 12px",borderRadius:8,background:C.roxo,color:"white",fontFamily:"Poppins",fontSize:"0.72rem",fontWeight:600,border:"none",cursor:"pointer"}}>Copiar</button>
          </div>
          <p style={{fontSize:"0.68rem",color:C.gz,marginTop:6}}>Código: {user.couple_code}</p>
        </div>}
        <AppButton onClick={()=>go("consent")}>Nova avaliação</AppButton>
        <AppButton onClick={()=>go("booking")} variant="secondary">Agendar consulta</AppButton>
        <AppButton onClick={logout} variant="ghost">Terminar sessão</AppButton>
      </div>
    </div>
  </div>);
}

function HistoryScreen({go,back,userHistory,setUserHistory}){
  const [exp,setExp]=useState(null);
  const [tab,setTab]=useState("resultados"); // "resultados" | "tarefas"
  const sorted=[...userHistory].sort((a,b)=>a.date.localeCompare(b.date));
  const delta=sorted.length>=2?+(sorted[sorted.length-1].global-sorted[0].global).toFixed(1):null;

  const toggleTaskDone=async(id)=>{
    const entry = userHistory.find(x=>x.id===id);
    if (!entry) return;
    const newDone = !entry.taskDone;
    const newProgress = newDone ? 100 : entry.taskProgress;
    setUserHistory(h=>h.map(x=>x.id===id?{...x,taskDone:newDone,taskProgress:newProgress}:x));
    if (entry.dbId) await supaUpdateAssessment(entry.dbId, {task_done:newDone, task_progress:newProgress});
  };
  const setProgress=async(id,val)=>{
    const entry = userHistory.find(x=>x.id===id);
    setUserHistory(h=>h.map(x=>x.id===id?{...x,taskProgress:val,taskDone:val===100}:x));
    if (entry?.dbId) await supaUpdateAssessment(entry.dbId, {task_progress:val, task_done:val===100});
  };

  if(!userHistory.length) return(
    <SC>
      <button onClick={back} style={{background:"none",border:"none",color:C.roxo,fontFamily:"Poppins",fontSize:"0.82rem",cursor:"pointer",padding:"0 0 20px 0"}}>← Voltar</button>
      <div style={{textAlign:"center",padding:"40px 0"}}><p style={{fontSize:"2rem",marginBottom:14}}>📊</p><p style={{fontSize:"0.9rem",color:C.gz}}>Ainda não tens avaliações guardadas.</p><div style={{marginTop:20}}><AppButton onClick={()=>go("consent")}>Começar avaliação</AppButton></div></div>
    </SC>
  );

  return(
    <div style={{height:"100%",display:"flex",flexDirection:"column",background:"#F2F2F7",fontFamily:"Poppins"}}>
      <div style={{background:C.wh,borderBottom:"1px solid "+C.sep,padding:"12px 16px",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <button onClick={back} style={{background:"none",border:"none",cursor:"pointer",color:C.roxo,fontFamily:"Poppins",fontSize:"0.87rem"}}>← Voltar</button>
        <p style={{fontWeight:700,fontSize:"0.9rem",color:C.pet}}>O meu historial</p>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:0,background:"rgba(76,48,94,0.07)",margin:"10px 13px 0",borderRadius:11,padding:3,flexShrink:0}}>
        {[{id:"resultados",l:"Resultados"},{id:"tarefas",l:"Tarefas"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"7px",borderRadius:9,fontFamily:"Poppins",fontSize:"0.78rem",fontWeight:tab===t.id?700:400,background:tab===t.id?C.roxo:"transparent",color:tab===t.id?"white":C.gz,border:"none",cursor:"pointer",transition:"all 0.14s"}}>{t.l}</button>
        ))}
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"12px 13px 24px"}}>

        {/* ── RESULTADOS TAB ── */}
        {tab==="resultados"&&<>
          {delta!==null&&<div style={{background:C.wh,borderRadius:13,padding:"11px",marginBottom:11,boxShadow:"0 1px 6px rgba(44,73,81,0.06)",display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:40,height:40,borderRadius:"50%",background:(delta>0?C.ok:delta<0?C.bad:C.gz)+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{delta>0?"↑":delta<0?"↓":"→"}</div>
            <div><p style={{fontWeight:700,color:delta>0?C.ok:delta<0?C.bad:C.gz,fontSize:"0.86rem"}}>{delta>0?"Tendência positiva":delta<0?"Em atenção":"Estável"}</p><p style={{fontSize:"0.72rem",color:C.gz,marginTop:1}}>{delta>0?"+":""}{delta} pontos desde o início</p></div>
          </div>}
          {[...sorted].reverse().map(h=>{
            const isExp=exp===h.id;
            const col=levelColor(getLevel(h.global));
            return(
              <div key={h.id} style={{background:C.wh,borderRadius:13,marginBottom:9,overflow:"hidden",boxShadow:"0 1px 6px rgba(44,73,81,0.06)"}}>
                <div onClick={()=>setExp(isExp?null:h.id)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px",cursor:"pointer"}}>
                  <div>
                    <p style={{fontWeight:600,fontSize:"0.83rem",color:C.pet}}>{new Date(h.date+"T12:00:00").toLocaleDateString("pt-PT",{day:"numeric",month:"long",year:"numeric"})}</p>
                    <div style={{display:"flex",alignItems:"center",gap:7,marginTop:3}}>
                      <span style={{fontWeight:700,color:col,fontSize:"0.93rem"}}>{h.global}</span>
                      <span style={{fontSize:"0.66rem",background:col+"15",color:col,padding:"2px 7px",borderRadius:50,fontWeight:600}}>{h.level}</span>
                      {h.task&&<span style={{fontSize:"0.63rem",color:h.taskDone?C.ok:C.gz}}>{h.task.icon} {h.taskDone?"Feita":"Em curso"}</span>}
                    </div>
                  </div>
                  <span style={{color:C.gz}}>{isExp?"▲":"▼"}</span>
                </div>
                {isExp&&<div style={{padding:"0 12px 12px",borderTop:"1px solid rgba(44,73,81,0.07)"}}>
                  {/* Dim bars */}
                  {DIMS.map(d=>{const s=h.byDim[d.id];const dc=levelColor(getLevel(s));return(
                    <div key={d.id} style={{marginBottom:7}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span style={{fontSize:"0.75rem",color:d.id===h.lowest?C.pet:C.gz,fontWeight:d.id===h.lowest?600:400}}>{d.icon} {d.short}{d.id===h.lowest&&" ↓"}</span><span style={{fontSize:"0.75rem",fontWeight:700,color:dc}}>{s}</span></div>
                      <div style={{height:4,background:"rgba(132,130,144,0.1)",borderRadius:2,overflow:"hidden"}}><div style={{width:(s/10*100)+"%",height:"100%",background:dc,borderRadius:2}}/></div>
                    </div>
                  );})}
                  {/* Task summary in result */}
                  {h.task&&<div style={{background:h.taskDone?C.ok+"10":C.roxo+"08",borderRadius:10,padding:"10px 12px",marginTop:10,display:"flex",alignItems:"center",gap:9}}>
                    <span style={{fontSize:16}}>{h.task.icon}</span>
                    <div style={{flex:1}}>
                      <p style={{fontSize:"0.78rem",fontWeight:600,color:h.taskDone?C.ok:C.pet}}>{h.task.title}</p>
                      <p style={{fontSize:"0.69rem",color:C.gz,marginTop:1}}>{h.taskDone?"✓ Concluída":"Em curso — "+h.taskProgress+"%"}</p>
                    </div>
                  </div>}
                  <div style={{marginTop:9}}><AppButton onClick={()=>go("booking")} variant="ghost" sx={{fontSize:"0.79rem"}}>Falar com a psicóloga →</AppButton></div>
                </div>}
              </div>
            );
          })}
        </>}

        {/* ── TAREFAS TAB ── */}
        {tab==="tarefas"&&<>
          <p style={{fontSize:"0.62rem",fontWeight:700,color:C.gz,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:11}}>Todas as tarefas</p>
          {/* Summary bar */}
          {(()=>{
            const total=userHistory.filter(h=>h.task).length;
            const done=userHistory.filter(h=>h.taskDone).length;
            const pct=total>0?Math.round(done/total*100):0;
            return total>0&&(
              <div style={{background:C.wh,borderRadius:13,padding:"13px",marginBottom:13,boxShadow:"0 1px 6px rgba(44,73,81,0.06)"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                  <p style={{fontSize:"0.82rem",fontWeight:700,color:C.pet}}>Progresso geral</p>
                  <p style={{fontSize:"0.82rem",fontWeight:700,color:C.roxo}}>{pct}%</p>
                </div>
                <div style={{height:8,background:"rgba(132,130,144,0.12)",borderRadius:4,overflow:"hidden",marginBottom:6}}>
                  <div style={{width:pct+"%",height:"100%",background:`linear-gradient(90deg,${C.roxo},${C.roxoL})`,borderRadius:4,transition:"width 0.4s"}}/>
                </div>
                <p style={{fontSize:"0.71rem",color:C.gz}}>{done} de {total} tarefas concluídas</p>
              </div>
            );
          })()}
          {/* Task list — most recent first */}
          {[...sorted].reverse().filter(h=>h.task).map(h=>(
            <div key={h.id} style={{background:C.wh,borderRadius:13,padding:"13px",marginBottom:9,boxShadow:"0 1px 6px rgba(44,73,81,0.06)",opacity:h.taskDone?0.8:1}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div style={{display:"flex",gap:9,alignItems:"center"}}>
                  <span style={{fontSize:20}}>{h.task.icon}</span>
                  <div>
                    <p style={{fontWeight:700,fontSize:"0.84rem",color:C.pet}}>{h.task.title}</p>
                    <p style={{fontSize:"0.68rem",color:C.gz,marginTop:1}}>{new Date(h.date+"T12:00:00").toLocaleDateString("pt-PT",{day:"numeric",month:"long"})} · {DIMS.find(d=>d.id===h.lowest)?.short}</p>
                  </div>
                </div>
                {h.taskDone&&<span style={{fontSize:"0.68rem",background:C.ok+"15",color:C.ok,padding:"2px 9px",borderRadius:50,fontWeight:700,flexShrink:0}}>✓ Feita</span>}
              </div>
              {/* Progress bar */}
              <div style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                  <span style={{fontSize:"0.72rem",color:C.gz}}>Progresso</span>
                  <span style={{fontSize:"0.72rem",fontWeight:700,color:C.roxo}}>{h.taskProgress||0}%</span>
                </div>
                <div style={{height:6,background:"rgba(132,130,144,0.12)",borderRadius:3,overflow:"hidden",marginBottom:6}}>
                  <div style={{width:(h.taskProgress||0)+"%",height:"100%",background:h.taskDone?C.ok:`linear-gradient(90deg,${C.roxo},${C.roxoL})`,borderRadius:3,transition:"width 0.3s"}}/>
                </div>
                {/* Progress steps */}
                {!h.taskDone&&<div style={{display:"flex",gap:5,marginTop:5}}>
                  {[25,50,75,100].map(p=>(
                    <button key={p} onClick={()=>setProgress(h.id,p)} style={{flex:1,padding:"5px 2px",borderRadius:7,fontFamily:"Poppins",fontSize:"0.69rem",fontWeight:(h.taskProgress||0)>=p?700:400,background:(h.taskProgress||0)>=p?C.roxo+"12":"transparent",color:(h.taskProgress||0)>=p?C.roxo:C.gz,border:"1px solid "+((h.taskProgress||0)>=p?C.roxo+"40":"rgba(132,130,144,0.2)"),cursor:"pointer"}}>{p}%</button>
                  ))}
                </div>}
              </div>
              {/* Mark done toggle */}
              <div onClick={()=>toggleTaskDone(h.id)} style={{display:"flex",gap:9,alignItems:"center",padding:"8px 10px",background:h.taskDone?C.ok+"10":"rgba(132,130,144,0.06)",borderRadius:9,cursor:"pointer",border:"1px solid "+(h.taskDone?C.ok+"30":"rgba(132,130,144,0.15)")}}>
                <div style={{width:18,height:18,borderRadius:5,border:"2px solid "+(h.taskDone?C.ok:"rgba(132,130,144,0.4)"),background:h.taskDone?C.ok:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {h.taskDone&&<svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3 5.5L8 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <p style={{fontSize:"0.78rem",fontWeight:600,color:h.taskDone?C.ok:C.gz}}>{h.taskDone?"Tarefa concluída":"Marcar como concluída"}</p>
              </div>
            </div>
          ))}
          {userHistory.filter(h=>h.task).length===0&&<div style={{textAlign:"center",padding:"30px 0"}}><p style={{fontSize:"0.88rem",color:C.gz,lineHeight:1.7}}>As tarefas aparecem aqui depois de fazeres a primeira avaliação.</p></div>}
          <p style={{fontSize:"0.69rem",color:C.gz,textAlign:"center",marginTop:8}}>Dados eliminados ao fim de 6 meses.</p>
        </>}
      </div>
    </div>
  );
}
function BookingScreen({go,back,user,scores}){
  const [step,setStep]=useState(1),[slot,setSlot]=useState(null);
  const [name,setName]=useState(user?.name||""),[email,setEmail]=useState(user?.email||"");
  const [note,setNote]=useState(scores?"Score: "+scores.global+(scores.lowest?" · "+(DIMS.find(d=>d.id===scores?.lowest)?.label||""):""):"");
  const SLOTS=["Seg 10h","Seg 14h","Ter 10h","Qua 16h","Qui 11h","Sex 10h","Sex 15h"];
  const AE="psicologia@attunea.pt";
  const addGCal=()=>window.open("https://calendar.google.com/calendar/render?action=TEMPLATE&text="+encodeURIComponent("Consulta Attunea")+"&add="+encodeURIComponent(AE),"_blank");
  const addiCal=()=>{
    const ics=["BEGIN:VCALENDAR","VERSION:2.0","BEGIN:VEVENT","DTSTART:20260324T100000","DTEND:20260324T105000","SUMMARY:Consulta Attunea","END:VEVENT","END:VCALENDAR"].join("\r\n");
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([ics],{type:"text/calendar"}));
    a.download="consulta.ics";
    document.body.appendChild(a);a.click();document.body.removeChild(a);
  };
  return(<div style={{height:"100%",display:"flex",flexDirection:"column",background:"#F2F2F7",fontFamily:"Poppins"}}>
    <div style={{position:"relative",height:170,overflow:"hidden",flexShrink:0}}>
      <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80" alt="" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center 18%"}}/>
      <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,rgba(76,48,94,0.05),rgba(76,48,94,0.88))"}}/>
      <button onClick={back} style={{position:"absolute",top:12,left:14,background:"rgba(255,255,255,0.15)",border:"none",borderRadius:50,padding:"5px 12px",color:"white",fontFamily:"Poppins",fontSize:"0.74rem",cursor:"pointer"}}>← Voltar</button>
      <div style={{position:"absolute",bottom:0,padding:"0 18px 12px"}}>
        <p style={{color:"rgba(255,255,255,0.55)",fontSize:"0.64rem",textTransform:"uppercase",marginBottom:2}}>OPP-11511</p>
        <h2 style={{color:"white",fontSize:"1.1rem",fontWeight:700}}>Ana Mafalda Ferreira</h2>
      </div>
    </div>
    <div style={{flex:1,overflowY:"auto",padding:"12px 15px 24px"}}>
      <div style={{background:C.wh,borderRadius:11,padding:"10px 12px",marginBottom:11,boxShadow:"0 1px 6px rgba(44,73,81,0.06)"}}>
        <p style={{fontSize:"0.71rem",color:C.gz}}>📍 Lisboa · Online · 80€ · 50 min</p>
        <a href="https://www.attunea.pt/ana-mafalda-ferreira" target="_blank" rel="noreferrer" style={{fontSize:"0.7rem",color:C.roxo,textDecoration:"none",display:"block",marginTop:3}}>attunea.pt/ana-mafalda-ferreira →</a>
      </div>
      {step===1&&<>
        <p style={{fontSize:"0.66rem",fontWeight:700,color:C.gz,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:9}}>Escolhe um horário</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:11}}>
          {SLOTS.map(s=><button key={s} onClick={()=>setSlot(s)} style={{padding:"10px 6px",borderRadius:10,border:"2px solid "+(slot===s?C.roxo:C.lav),background:slot===s?C.roxo+"08":"transparent",fontFamily:"Poppins",fontSize:"0.81rem",fontWeight:slot===s?700:500,color:slot===s?C.roxo:C.pet,cursor:"pointer"}}>{s}</button>)}
        </div>
        <AppButton onClick={()=>setStep(2)} dis={!slot}>Continuar →</AppButton>
      </>}
      {step===2&&<>
        {[{l:"Nome",v:name,set:setName,t:"text"},{l:"Email",v:email,set:setEmail,t:"email"}].map((f,i)=>(
          <div key={i} style={{marginBottom:10}}>
            <p style={{fontSize:"0.8rem",fontWeight:600,color:C.pet,marginBottom:5}}>{f.l}</p>
            <input value={f.v} onChange={e=>f.set(e.target.value)} type={f.t} style={{width:"100%",padding:"11px 12px",borderRadius:10,border:"1.5px solid "+C.lav,fontFamily:"Poppins",fontSize:"0.89rem",outline:"none",color:C.pet,background:C.iv,boxSizing:"border-box"}}/>
          </div>
        ))}
        <textarea value={note} onChange={e=>setNote(e.target.value)} rows={2} placeholder="Nota opcional..." style={{width:"100%",padding:"9px 12px",borderRadius:10,border:"1.5px solid "+C.lav,fontFamily:"Poppins",fontSize:"0.85rem",outline:"none",color:C.pet,background:C.iv,boxSizing:"border-box",resize:"none",marginBottom:11}}/>
        <AppButton onClick={()=>setStep(3)} dis={!name||!email}>Confirmar ✓</AppButton>
        <AppButton onClick={()=>setStep(1)} variant="ghost" sx={{marginTop:8,fontSize:"0.82rem"}}>← Mudar horário</AppButton>
      </>}
      {step===3&&<div style={{textAlign:"center",paddingTop:6}}>
        <div style={{width:54,height:54,borderRadius:"50%",background:C.ok+"15",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 13px",fontSize:22}}>✓</div>
        <h3 style={{fontSize:"0.98rem",fontWeight:700,color:C.pet,marginBottom:7}}>Pedido enviado!</h3>
        <p style={{fontSize:"0.82rem",color:C.gz,lineHeight:1.7,marginBottom:13}}>A Ana Mafalda vai confirmar em <strong style={{color:C.pet}}>{email}</strong>.</p>
        <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:12}}>
          <button onClick={addiCal} style={{width:"100%",padding:"10px",borderRadius:11,background:"rgba(0,122,255,0.1)",border:"1.5px solid rgba(0,122,255,0.25)",color:"#007AFF",fontFamily:"Poppins",fontSize:"0.82rem",fontWeight:600,cursor:"pointer"}}>📅 Calendário iOS (iCal)</button>
          <button onClick={addGCal} style={{width:"100%",padding:"10px",borderRadius:11,background:"rgba(66,133,244,0.1)",border:"1.5px solid rgba(66,133,244,0.25)",color:"#4285F4",fontFamily:"Poppins",fontSize:"0.82rem",fontWeight:600,cursor:"pointer"}}>📅 Google Calendar</button>
        </div>
        <AppButton onClick={()=>go("home")}>Voltar ao início</AppButton>
      </div>}
    </div>
  </div>);
}

function AdminLogin({go,back,ADMIN_USERS,setUser,setLoggedIn}){
  const [em,setEm]=useState(""), [pw,setPw]=useState(""), [err,setErr]=useState("");
  const login=()=>{const u=ADMIN_USERS[em.toLowerCase()];if(!u){setErr("Email não encontrado.");return;}if(u.pw!==pw){setErr("Password incorrecta.");return;}setUser({...u,email:em});setLoggedIn(true);go("admin");};
  return(
    <div style={{minHeight:"100%",background:"#1e3540",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"28px 20px",fontFamily:"Poppins"}}>
      <button onClick={back} style={{alignSelf:"flex-start",background:"none",border:"none",color:"rgba(255,255,255,0.5)",fontFamily:"Poppins",fontSize:"0.8rem",cursor:"pointer",marginBottom:20}}>← Voltar</button>
      <Logo h={22} dark/>
      <p style={{color:"rgba(255,255,255,0.38)",fontSize:"0.68rem",letterSpacing:"0.14em",textTransform:"uppercase",marginTop:8,marginBottom:26}}>Portal Clínico</p>
      <div style={{background:"rgba(255,255,255,0.06)",borderRadius:16,padding:"20px 18px",border:"1px solid rgba(255,255,255,0.08)",width:"100%"}}>
        {[{l:"Email",v:em,set:setEm,ph:"ana@attunea.pt",t:"email"},{l:"Password",v:pw,set:setPw,ph:"••••••••",t:"password"}].map((f,i)=>(
          <div key={i} style={{marginBottom:i?14:13}}><p style={{fontSize:"0.73rem",fontWeight:600,color:"rgba(255,255,255,0.42)",marginBottom:6}}>{f.l}</p><input value={f.v} onChange={e=>f.set(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} placeholder={f.ph} type={f.t} style={{width:"100%",padding:"12px 13px",borderRadius:10,border:"1.5px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.07)",fontFamily:"Poppins",fontSize:"0.9rem",outline:"none",color:"white",boxSizing:"border-box"}}/></div>
        ))}
        {err&&<p style={{fontSize:"0.75rem",color:"#f08080",marginBottom:9}}>{err}</p>}
        <button onClick={login} style={{width:"100%",padding:"12px",borderRadius:12,background:"#4C305E",color:"white",fontFamily:"Poppins",fontSize:"0.88rem",fontWeight:700,border:"none",cursor:"pointer"}}>Entrar →</button>
        
      </div>
    </div>
  );
}

// ─── ADMIN DATA ───────────────────────────────────────────────────────────────
const COUPLES_DATA = [
  {
    id:"C001", code:"ATN-4832", risk:false, sessions:6,
    A:{name:"Maria S.", email:"maria@email.pt"},
    B:{name:"João S.",  email:"joao@email.pt"},
    date:"2026-03-21",
    scores:{
      A:{seguranca:7.1,comunicacao:5.5,intimidade:6.0,projeto:7.5,vinculo:6.8},
      B:{seguranca:5.2,comunicacao:6.8,intimidade:4.0,projeto:7.2,vinculo:6.5},
    },
    answers:{A:{1:7,2:6,3:5,4:8,5:7,6:6,7:3,8:7,9:5,10:6,11:4,12:6,13:5,14:5,15:6,16:5,17:6,18:6,19:7,20:5,21:6,22:7,23:6,24:6,25:7,26:6,27:8,28:7,29:8,30:7,31:7,32:8,33:7,34:7,35:6,36:7,37:7,38:7,39:6,40:7}, B:{1:5,2:5,3:6,4:6,5:5,6:5,7:5,8:5,9:7,10:7,11:6,12:7,13:7,14:7,15:7,16:6,17:4,18:4,19:4,20:4,21:4,22:8,23:4,24:4,25:7,26:7,27:7,28:7,29:8,30:7,31:7,32:7,33:7,34:6,35:6,36:6,37:6,38:7,39:7,40:6}},
    assignedTask: null,
    notes: "Padrão perseguidor-retirante presente. Comunicação melhora. Trabalhar intimidade.",
  },
  {
    id:"C002", code:"ATN-7291", risk:true, sessions:3,
    A:{name:"Sofia L.", email:"sofia@email.pt"},
    B:{name:"Carlos P.",email:"carlos@email.pt"},
    date:"2026-03-20",
    scores:{
      A:{seguranca:3.5,comunicacao:3.8,intimidade:4.0,projeto:5.5,vinculo:4.2},
      B:{seguranca:5.2,comunicacao:4.5,intimidade:3.2,projeto:5.8,vinculo:4.8},
    },
    answers:{A:{1:3,2:3,3:3,4:4,5:3,6:3,7:8,8:3,9:4,10:4,11:3,12:4,13:3,14:3,15:4,16:5,17:4,18:4,19:4,20:3,21:3,22:7,23:4,24:3,25:5,26:4,27:5,28:5,29:4,30:5,31:5,32:5,33:4,34:5,35:4,36:3,37:4,38:5,39:4,40:4}, B:{1:5,2:5,3:4,4:6,5:5,6:4,7:5,8:5,9:5,10:5,11:4,12:5,13:4,14:4,15:5,16:5,17:3,18:3,19:3,20:3,21:3,22:8,23:3,24:3,25:6,26:5,27:6,28:5,29:6,30:6,31:5,32:6,33:5,34:5,35:5,36:4,37:5,38:5,39:4,40:5}},
    assignedTask: null,
    notes: "⚠ RISCO — Sofia reporta controlo e medo. Não avançar para exercícios de vulnerabilidade.",
  },
  {
    id:"C003", code:"ATN-1156", risk:false, sessions:2,
    A:{name:"Marta V.", email:"marta@email.pt"},
    B:{name:"Rui F.",   email:"rui@email.pt"},
    date:"2026-03-15",
    scores:{
      A:{seguranca:8.2,comunicacao:7.5,intimidade:7.0,projeto:8.5,vinculo:8.8},
      B:{seguranca:7.8,comunicacao:8.0,intimidade:6.8,projeto:8.2,vinculo:9.0},
    },
    answers:{A:{1:8,2:8,3:8,4:9,5:8,6:8,7:2,8:9,9:8,10:8,11:7,12:8,13:7,14:7,15:8,16:8,17:7,18:7,19:8,20:7,21:7,22:9,23:7,24:8,25:9,26:8,27:9,28:8,29:8,30:9,31:8,32:9,33:9,34:9,35:8,36:8,37:9,38:9,39:7,40:9}, B:{1:8,2:8,3:7,4:9,5:8,6:8,7:1,8:8,9:8,10:8,11:8,12:8,13:8,14:8,15:7,16:8,17:7,18:7,19:8,20:7,21:7,22:8,23:8,24:8,25:8,26:8,27:8,28:8,29:8,30:8,31:8,32:8,33:8,34:9,35:8,36:8,37:8,38:9,39:8,40:9}},
    assignedTask: null,
    notes: "Casal com scores muito positivos. Procuram aprofundamento.",
  },
];

function coupleAvg(s){return DIMS.reduce((a,d)=>{a[d.id]=+((s.A[d.id]+s.B[d.id])/2).toFixed(1);return a;},{});}
function globalAvg(b){return +(Object.values(b).reduce((a,v)=>a+v,0)/5).toFixed(1);}
function adjAnswer(val, reverse){const v=typeof val==="number"?Math.max(0,Math.min(10,val)):5; return reverse?(10-v):v;}

// ─── ADMIN DASH ───────────────────────────────────────────────────────────────
function AdminDash({go,user,setLoggedIn,setUser}){
  const [tab,setTab]=useState("couples");
  const [sel,setSel]=useState(null);
  const [realAssessments,setRealAssessments]=useState([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    // Load all assessments with profile info
    sb.from("assessments")
      .select("*, profiles(name, email, couple_code)")
      .order("created_at", {ascending:false})
      .then(({data,error})=>{
        if(error) console.error(error);
        else setRealAssessments(data||[]);
        setLoading(false);
      });
  },[]);

  // Group assessments by couple_code
  const coupleGroups = realAssessments.reduce((acc,a)=>{
    const cc = a.couple_code || "sem-casal";
    if(!acc[cc]) acc[cc]=[];
    acc[cc].push(a);
    return acc;
  },{});

  const hasRealData = Object.keys(coupleGroups).filter(k=>k!=="sem-casal").length > 0;         // selected couple object
  const [subTab,setSubTab]=useState("perfil"); // perfil | respostas | tarefas | notas
  const [couples,setCouples]=useState(COUPLES_DATA);
  const [toast,setToast]=useState("");
  const [newNote,setNewNote]=useState("");
  const [editTask,setEditTask]=useState(false);
  const [customTask,setCustomTask]=useState({title:"",text:"",rule:""});
  const lc=s=>levelColor(getLevel(s));
  const showToast=m=>{setToast(m);setTimeout(()=>setToast(""),2800);};

  const updateCouple=(id,patch)=>{
    setCouples(cs=>cs.map(c=>c.id===id?{...c,...patch}:c));
    if(sel?.id===id) setSel(c=>({...c,...patch}));
  };

  // ── Couple list ────────────────────────────────────────────────────────
  const CoupleList=()=>{
    // Build display list from real data or fallback to mock
    const displayCouples = hasRealData
      ? Object.entries(coupleGroups).filter(([k])=>k!=="sem-casal").map(([code,assessments])=>{
          // Get latest assessment per user
          const byUser = assessments.reduce((acc,a)=>{
            if(!acc[a.user_id] || a.date > acc[a.user_id].date) acc[a.user_id]=a;
            return acc;
          },{});
          const members = Object.values(byUser);
          const A = members[0];
          const B = members[1];
          const avgGlobal = members.length>1
            ? +((A.global+B.global)/2).toFixed(1)
            : +(A?.global||0).toFixed(1);
          return { code, A, B, members, avgGlobal, isReal:true };
        })
      : couples.map(c=>{
          const avg=coupleAvg(c.scores);
          return { code:c.code, mockData:c, avgGlobal:+globalAvg(avg).toFixed(1), isReal:false };
        });

    return(
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:13}}>
          <h2 style={{fontSize:"1rem",fontWeight:700,color:C.roxo}}>
            {hasRealData ? "Clientes reais" : "Demo (sem dados reais ainda)"}
          </h2>
          <span style={{fontSize:"0.69rem",color:C.gz}}>{displayCouples.length} casais</span>
        </div>
        {loading&&<p style={{fontSize:"0.83rem",color:C.gz,textAlign:"center",padding:"20px 0"}}>A carregar...</p>}
        {!loading&&displayCouples.length===0&&<div style={{textAlign:"center",padding:"30px 0"}}>
          <p style={{fontSize:"0.88rem",color:C.gz,lineHeight:1.7}}>Ainda não há avaliações de clientes. Quando os clientes fizerem a avaliação, aparece aqui.</p>
        </div>}
        {displayCouples.map((c,idx)=>{
          if(c.isReal){
            const A=c.A, B=c.B;
            const col=levelColor(getLevel(c.avgGlobal));
            return(
              <div key={c.code} onClick={()=>{setSel(c);setSubTab("perfil");}} style={{background:C.wh,borderRadius:13,padding:"12px",marginBottom:9,boxShadow:"0 1px 7px rgba(44,73,81,0.06)",cursor:"pointer",borderLeft:"4px solid "+C.roxo+"30"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                  <div>
                    <p style={{fontWeight:700,fontSize:"0.86rem",color:C.pet}}>
                      {A?.profiles?.name||"Parceiro A"}{B?" + "+(B?.profiles?.name||"Parceiro B"):""}
                    </p>
                    <p style={{fontSize:"0.67rem",color:C.gz,marginTop:2}}>{c.code} · {c.members.length} avaliações</p>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <p style={{fontWeight:700,fontSize:"1.05rem",color:col}}>{c.avgGlobal}</p>
                    <p style={{fontSize:"0.64rem",color:col}}>{getLevel(c.avgGlobal)}</p>
                  </div>
                </div>
                {DIMS.map(d=>{
                  const sA=A?.by_dim?.[d.id]||0;
                  const sB=B?.by_dim?.[d.id]||sA;
                  const avg=+((sA+sB)/2).toFixed(1);
                  return(<div key={d.id} style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                    <span style={{fontSize:9,color:C.gz,width:11}}>{d.icon}</span>
                    <div style={{flex:1,height:3,background:"rgba(132,130,144,0.1)",borderRadius:2,overflow:"hidden"}}>
                      <div style={{width:(avg/10*100)+"%",height:"100%",background:levelColor(getLevel(avg)),borderRadius:2}}/>
                    </div>
                    <span style={{fontSize:"0.64rem",fontWeight:700,color:levelColor(getLevel(avg)),width:18,textAlign:"right"}}>{avg}</span>
                  </div>);
                })}
              </div>
            );
          } else {
            // Mock data display
            const mc=c.mockData;
            const avg=coupleAvg(mc.scores);
            const g=globalAvg(avg);
            return(
              <div key={mc.id} onClick={()=>{setSel({...c,mockData:mc});setSubTab("perfil");}} style={{background:C.wh,borderRadius:13,padding:"12px",marginBottom:9,boxShadow:"0 1px 7px rgba(44,73,81,0.06)",cursor:"pointer",borderLeft:mc.risk?"4px solid "+C.bad:"4px solid "+C.gz+"30",opacity:0.7}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <div>
                    <p style={{fontWeight:700,fontSize:"0.86rem",color:C.pet}}>{mc.A.name} + {mc.B.name}</p>
                    <p style={{fontSize:"0.67rem",color:C.gz,marginTop:2}}>{mc.code} · demo</p>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <p style={{fontWeight:700,fontSize:"1.05rem",color:lc(g)}}>{g}</p>
                    <p style={{fontSize:"0.64rem",color:lc(g)}}>{getLevel(g)}</p>
                  </div>
                </div>
              </div>
            );
          }
        })}
      </div>
    );
  };

  const CoupleDetail=()=>{
    if(!sel) return null;
    const avg=coupleAvg(sel.scores);
    const g=globalAvg(avg);
    const lowest=Object.entries(avg).sort((a,b)=>a[1]-b[1])[0][0];
    const level=getLevel(g);
    const dimRes=DIM_RESULTS[lowest];
    const suggestedTask=TASK_LIBRARY[lowest]?.[level];

    return(
      <div>
        {/* Header */}
        <button onClick={()=>setSel(null)} style={{background:"none",border:"none",color:C.roxo,fontFamily:"Poppins",fontSize:"0.82rem",cursor:"pointer",padding:"0 0 12px 0"}}>← Casais</button>
        {sel.risk&&<div style={{background:C.bad+"10",border:"1px solid "+C.bad+"30",borderRadius:10,padding:"8px 12px",marginBottom:10,display:"flex",gap:8,alignItems:"center"}}><span>⚠</span><p style={{fontSize:"0.79rem",color:C.bad,fontWeight:600}}>Sinal de risco — abordar com cuidado</p></div>}
        <div style={{background:`linear-gradient(135deg,${C.roxo},${C.roxoL})`,borderRadius:13,padding:"13px",marginBottom:11}}>
          <p style={{color:"rgba(255,255,255,0.55)",fontSize:"0.64rem",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:3}}>{sel.code} · {sel.sessions} sessões</p>
          <p style={{color:"white",fontWeight:700,fontSize:"0.93rem",marginBottom:2}}>{sel.A.name} + {sel.B.name}</p>
          <p style={{color:"rgba(255,255,255,0.5)",fontSize:"0.69rem",marginBottom:9}}>{sel.A.email} · {sel.B.email}</p>
          <div style={{display:"flex",gap:8}}>
            <div style={{background:"rgba(255,255,255,0.14)",borderRadius:9,padding:"7px 13px",textAlign:"center"}}><p style={{color:"white",fontSize:"1.3rem",fontWeight:700,lineHeight:1}}>{g}</p><p style={{color:"rgba(255,255,255,0.55)",fontSize:"0.61rem",marginTop:1}}>Score casal</p></div>
            <div style={{background:"rgba(255,255,255,0.11)",borderRadius:9,padding:"7px 13px"}}><p style={{color:"white",fontWeight:700,fontSize:"0.81rem"}}>{level}</p><p style={{color:"rgba(255,255,255,0.55)",fontSize:"0.61rem",marginTop:1}}>Nível global</p></div>
          </div>
        </div>

        {/* Sub-tabs */}
        <div style={{display:"flex",gap:0,background:"rgba(76,48,94,0.08)",borderRadius:11,padding:3,marginBottom:13}}>
          {[{id:"perfil",l:"Perfil"},{id:"respostas",l:"Respostas"},{id:"tarefas",l:"Tarefas"},{id:"notas",l:"Notas"}].map(t=>(
            <button key={t.id} onClick={()=>setSubTab(t.id)} style={{flex:1,padding:"7px 4px",borderRadius:9,fontFamily:"Poppins",fontSize:"0.73rem",fontWeight:subTab===t.id?700:400,background:subTab===t.id?C.roxo:"transparent",color:subTab===t.id?"white":C.gz,border:"none",cursor:"pointer",transition:"all 0.14s"}}>{t.l}</button>
          ))}
        </div>

        {/* PERFIL tab */}
        {subTab==="perfil"&&(
          <div>
            <div style={{background:C.wh,borderRadius:12,padding:"12px",marginBottom:11,borderLeft:"4px solid "+lc(avg[lowest]),boxShadow:"0 1px 6px rgba(44,73,81,0.06)"}}>
              <p style={{fontWeight:700,fontSize:"0.84rem",color:C.pet,marginBottom:5}}>{dimRes?.titulo}</p>
              <p style={{fontSize:"0.79rem",color:C.gz,lineHeight:1.6}}>{dimRes?.desc}</p>
            </div>
            <div style={{background:C.wh,borderRadius:12,padding:"12px",boxShadow:"0 1px 6px rgba(44,73,81,0.06)"}}>
              <p style={{fontSize:"0.61rem",fontWeight:700,color:C.gz,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Scores por dimensão</p>
              <div style={{display:"flex",gap:12,marginBottom:10}}>
                {[{n:sel.A.name.split(" ")[0],col:C.roxo},{n:sel.B.name.split(" ")[0],col:C.lav},{n:"Média",col:C.gz}].map((l,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:9,height:3,borderRadius:2,background:l.col}}/><span style={{fontSize:"0.63rem",color:C.gz}}>{l.n}</span></div>
                ))}
              </div>
              {DIMS.map(d=>{
                const sA=sel.scores.A[d.id],sB=sel.scores.B[d.id],sM=avg[d.id],disc=Math.abs(sA-sB);
                return(
                  <div key={d.id} style={{marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                      <span style={{fontSize:"0.79rem",fontWeight:d.id===lowest?700:400,color:d.id===lowest?C.pet:C.gz}}>{d.icon} {d.short}{d.id===lowest&&" ↓"}</span>
                      {disc>=2.5&&<span style={{fontSize:"0.61rem",color:C.warn,fontWeight:600}}>Δ {disc.toFixed(1)}</span>}
                    </div>
                    {[{v:sA,col:C.roxo},{v:sB,col:C.lav},{v:sM,col:C.gz}].map((b,i)=>(
                      <div key={i} style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                        <span style={{fontSize:"0.6rem",color:b.col,width:11,fontWeight:600}}>{[sel.A.name[0],sel.B.name[0],"~"][i]}</span>
                        <div style={{flex:1,height:3,background:"rgba(132,130,144,0.1)",borderRadius:2,overflow:"hidden"}}><div style={{width:(b.v/10*100)+"%",height:"100%",background:b.col,borderRadius:2}}/></div>
                        <span style={{fontSize:"0.68rem",fontWeight:700,color:lc(b.v),width:20,textAlign:"right"}}>{b.v}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}


        {subTab==="respostas"&&(
          <div>
            {sel.isReal ? (
              // Real data — show per-question if answers exist, else per-dim
              (sel.A || sel.members?.[0]) ? (
                <div>
                  <p style={{fontSize:"0.71rem",color:C.gz,marginBottom:11,lineHeight:1.5}}>↕ = item invertido · Δ ≥ 3 = discrepância significativa</p>
                  {DIMS.map(dim=>(
                    <div key={dim.id} style={{background:C.wh,borderRadius:11,padding:"11px",marginBottom:9,boxShadow:"0 1px 5px rgba(44,73,81,0.06)"}}>
                      <p style={{fontWeight:700,fontSize:"0.82rem",color:C.roxo,marginBottom:9}}>{dim.icon} {dim.label}</p>
                      {MAIN_QS.filter(q=>q.dim===dim.id).map(q=>{
                        const rA=(sel.A?.answers||sel.members?.[0]?.answers||{})[q.id]??5;
                        const rB=(sel.B?.answers||sel.members?.[1]?.answers||{})[q.id]??5;
                        const aA=q.reverse?(10-rA):rA;
                        const aB=q.reverse?(10-rB):rB;
                        const disc=Math.abs(aA-aB);
                        return(
                          <div key={q.id} style={{padding:"7px 0",borderBottom:"1px solid rgba(44,73,81,0.05)"}}>
                            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                              <p style={{fontSize:"0.74rem",color:C.pet,lineHeight:1.4,flex:1,paddingRight:6}}>{q.id}. {q.text}{q.reverse&&<span style={{color:C.warn,marginLeft:3,fontSize:"0.6rem"}}>↕</span>}</p>
                              {disc>=3&&<span style={{fontSize:"0.6rem",color:C.bad,fontWeight:700,flexShrink:0}}>Δ{disc}</span>}
                            </div>
                            {[[((sel.A?.profiles?.name||sel.members?.[0]?.profiles?.name)||"Parceiro A").split(" ")[0],aA,rA,"#4C305E"],[((sel.B?.profiles?.name||sel.members?.[1]?.profiles?.name)||"Parceiro B").split(" ")[0],aB,rB,"#CBBBC4"]].map(([n,adj,raw,col],i)=>(
                              <div key={i} style={{display:"flex",alignItems:"center",gap:5,marginBottom:2}}>
                                <span style={{fontSize:"0.61rem",color:col,fontWeight:700,width:20,flexShrink:0}}>{n}</span>
                                <div style={{flex:1,height:3,background:"rgba(132,130,144,0.1)",borderRadius:2,overflow:"hidden"}}><div style={{width:(adj/10*100)+"%",height:"100%",background:col,borderRadius:2}}/></div>
                                <span style={{fontSize:"0.68rem",fontWeight:700,color:levelColor(getLevel(adj)),width:16,textAlign:"right"}}>{adj}</span>
                                {q.reverse&&<span style={{fontSize:"0.56rem",color:C.gz,width:22}}>({raw})</span>}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ) : (
                // No per-question answers — show dimension scores
                <div>
                  <div style={{background:C.warn+"10",borderRadius:10,padding:"10px 13px",marginBottom:13,display:"flex",gap:8}}>
                    <span>ℹ️</span>
                    <p style={{fontSize:"0.78rem",color:C.pet,lineHeight:1.55}}>Esta avaliação não guardou as respostas individuais. As próximas avaliações já incluirão os dados completos.</p>
                  </div>
                  {DIMS.map(d=>{
                    const sA=sel.A?.by_dim?.[d.id]||sel.members?.[0]?.by_dim?.[d.id]||0;
                    const sB=sel.B?.by_dim?.[d.id]||sel.members?.[1]?.by_dim?.[d.id]||0;
                    return(
                      <div key={d.id} style={{background:C.wh,borderRadius:11,padding:"11px",marginBottom:8,boxShadow:"0 1px 5px rgba(44,73,81,0.06)"}}>
                        <p style={{fontWeight:700,fontSize:"0.82rem",color:C.roxo,marginBottom:8}}>{d.icon} {d.label}</p>
                        {[[((sel.A?.profiles?.name||sel.members?.[0]?.profiles?.name)||"Parceiro A").split(" ")[0],sA,"#4C305E"],[((sel.B?.profiles?.name||sel.members?.[1]?.profiles?.name)||"Parceiro B").split(" ")[0],sB,"#CBBBC4"]].map(([n,s,col],i)=>(
                          <div key={i} style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                            <span style={{fontSize:"0.7rem",color:col,fontWeight:700,width:30}}>{n}</span>
                            <div style={{flex:1,height:4,background:"rgba(132,130,144,0.1)",borderRadius:2,overflow:"hidden"}}><div style={{width:(s/10*100)+"%",height:"100%",background:col,borderRadius:2}}/></div>
                            <span style={{fontSize:"0.72rem",fontWeight:700,color:levelColor(getLevel(s)),width:20,textAlign:"right"}}>{s}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              // Mock data
              <div>
                <p style={{fontSize:"0.71rem",color:C.gz,marginBottom:11}}>↕ = item invertido · Δ ≥ 3 = discrepância</p>
                {DIMS.map(dim=>(
                  <div key={dim.id} style={{background:C.wh,borderRadius:11,padding:"11px",marginBottom:9,boxShadow:"0 1px 5px rgba(44,73,81,0.06)"}}>
                    <p style={{fontWeight:700,fontSize:"0.82rem",color:C.roxo,marginBottom:9}}>{dim.icon} {dim.label}</p>
                    {MAIN_QS.filter(q=>q.dim===dim.id).map(q=>{
                      const rA=sel.mockData?.answers?.A?.[q.id]??5;
                      const rB=sel.mockData?.answers?.B?.[q.id]??5;
                      const aA=q.reverse?(10-rA):rA;
                      const aB=q.reverse?(10-rB):rB;
                      const disc=Math.abs(aA-aB);
                      return(
                        <div key={q.id} style={{padding:"6px 0",borderBottom:"1px solid rgba(44,73,81,0.05)"}}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                            <p style={{fontSize:"0.73rem",color:C.pet,lineHeight:1.4,flex:1}}>{q.id}. {q.text}{q.reverse&&<span style={{color:C.warn,marginLeft:3,fontSize:"0.6rem"}}>↕</span>}</p>
                            {disc>=3&&<span style={{fontSize:"0.6rem",color:C.bad,fontWeight:700}}>Δ{disc}</span>}
                          </div>
                          {[["A",aA,rA,"#4C305E"],["B",aB,rB,"#CBBBC4"]].map(([n,adj,raw,col],i)=>(
                            <div key={i} style={{display:"flex",alignItems:"center",gap:5,marginBottom:2}}>
                              <span style={{fontSize:"0.61rem",color:col,fontWeight:700,width:11}}>{n}</span>
                              <div style={{flex:1,height:3,background:"rgba(132,130,144,0.1)",borderRadius:2,overflow:"hidden"}}><div style={{width:(adj/10*100)+"%",height:"100%",background:col,borderRadius:2}}/></div>
                              <span style={{fontSize:"0.68rem",fontWeight:700,color:levelColor(getLevel(adj)),width:16,textAlign:"right"}}>{adj}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {subTab==="tarefas"&&(
          <div>
            {/* Suggested task */}
            <div style={{background:C.wh,borderRadius:12,padding:"13px",marginBottom:11,boxShadow:"0 1px 6px rgba(44,73,81,0.06)"}}>
              <p style={{fontSize:"0.62rem",fontWeight:700,color:C.gz,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Tarefa sugerida pelo resultado</p>
              <div style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:10}}>
                <span style={{fontSize:20}}>{suggestedTask?.icon}</span>
                <div><p style={{fontWeight:700,fontSize:"0.85rem",color:C.pet}}>{suggestedTask?.title}</p><p style={{fontSize:"0.74rem",color:C.gz,marginTop:2}}>{DIMS.find(d=>d.id===lowest)?.label} · {level}</p></div>
              </div>
              <p style={{fontSize:"0.82rem",color:C.pet,lineHeight:1.65,marginBottom:8}}>{suggestedTask?.text}</p>
              <p style={{fontSize:"0.77rem",color:C.gz,fontStyle:"italic"}}>💡 {suggestedTask?.rule}</p>
            </div>
            {/* Assign to couple */}
            {!editTask?(
              <div style={{display:"flex",flexDirection:"column",gap:9}}>
                <button onClick={()=>{updateCouple(sel.id,{assignedTask:suggestedTask});showToast("✓ Tarefa sugerida enviada ao casal");}} style={{width:"100%",padding:"12px",borderRadius:12,background:C.ok,color:"white",fontFamily:"Poppins",fontSize:"0.85rem",fontWeight:700,border:"none",cursor:"pointer"}}>✓ Enviar esta tarefa ao casal</button>
                <button onClick={()=>{setEditTask(true);setCustomTask({title:suggestedTask?.title||"",text:suggestedTask?.text||"",rule:suggestedTask?.rule||"",icon:suggestedTask?.icon||"🎯"});}} style={{width:"100%",padding:"12px",borderRadius:12,background:"rgba(76,48,94,0.08)",color:C.roxo,fontFamily:"Poppins",fontSize:"0.85rem",fontWeight:600,border:"none",cursor:"pointer"}}>✏️ Personalizar antes de enviar</button>
                {sel.assignedTask&&<div style={{background:C.ok+"10",borderRadius:10,padding:"10px 12px"}}><p style={{fontSize:"0.78rem",fontWeight:700,color:C.ok,marginBottom:2}}>✓ Tarefa actualmente atribuída</p><p style={{fontSize:"0.76rem",color:C.pet}}>{sel.assignedTask.title}</p></div>}
              </div>
            ):(
              <div>
                <p style={{fontSize:"0.62rem",fontWeight:700,color:C.gz,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Personalizar tarefa</p>
                {[{l:"Título",k:"title",rows:1},{l:"Descrição",k:"text",rows:3},{l:"Regra / nota",k:"rule",rows:2}].map((f,i)=>(
                  <div key={i} style={{marginBottom:11}}>
                    <p style={{fontSize:"0.79rem",fontWeight:600,color:C.pet,marginBottom:5}}>{f.l}</p>
                    <textarea value={customTask[f.k]} onChange={e=>setCustomTask(t=>({...t,[f.k]:e.target.value}))} rows={f.rows} style={{width:"100%",padding:"10px 12px",borderRadius:10,border:"1.5px solid "+C.lav,fontFamily:"Poppins",fontSize:"0.85rem",outline:"none",color:C.pet,background:C.iv,boxSizing:"border-box",resize:"none"}}/>
                  </div>
                ))}
                <div style={{display:"flex",gap:9}}>
                  <button onClick={()=>{updateCouple(sel.id,{assignedTask:customTask});setEditTask(false);showToast("✓ Tarefa personalizada enviada!");}} style={{flex:1,padding:"11px",borderRadius:11,background:C.ok,color:"white",fontFamily:"Poppins",fontSize:"0.83rem",fontWeight:700,border:"none",cursor:"pointer"}}>Enviar →</button>
                  <button onClick={()=>setEditTask(false)} style={{padding:"11px 14px",borderRadius:11,background:"rgba(132,130,144,0.1)",color:C.gz,fontFamily:"Poppins",fontSize:"0.83rem",border:"none",cursor:"pointer"}}>Cancelar</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* NOTAS tab */}
        {subTab==="notas"&&(
          <div>
            <div style={{background:C.wh,borderRadius:12,padding:"13px",marginBottom:11,boxShadow:"0 1px 6px rgba(44,73,81,0.06)"}}>
              <p style={{fontSize:"0.62rem",fontWeight:700,color:C.gz,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Notas clínicas (privadas)</p>
              <div style={{background:sel.risk?C.bad+"08":C.gz+"08",borderRadius:9,padding:"10px 11px",borderLeft:"3px solid "+(sel.risk?C.bad:C.gz),marginBottom:11}}>
                <p style={{fontSize:"0.81rem",color:C.pet,lineHeight:1.65}}>{sel.notes||"Sem notas ainda."}</p>
              </div>
              <textarea value={newNote} onChange={e=>setNewNote(e.target.value)} rows={3} placeholder="Adicionar nota de sessão..." style={{width:"100%",padding:"10px 12px",borderRadius:10,border:"1.5px solid "+C.lav,fontFamily:"Poppins",fontSize:"0.83rem",outline:"none",color:C.pet,background:C.iv,boxSizing:"border-box",resize:"none",marginBottom:9}}/>
              <button onClick={()=>{if(!newNote.trim())return;updateCouple(sel.id,{notes:newNote.trim()+" ["+new Date().toLocaleDateString("pt-PT")+"]"});setNewNote("");showToast("✓ Nota guardada");}} disabled={!newNote.trim()} style={{width:"100%",padding:"10px",borderRadius:10,background:newNote.trim()?C.roxo:"rgba(132,130,144,0.1)",color:newNote.trim()?"white":"rgba(132,130,144,0.4)",fontFamily:"Poppins",fontSize:"0.83rem",fontWeight:600,border:"none",cursor:newNote.trim()?"pointer":"not-allowed"}}>Guardar nota</button>
            </div>
            <p style={{fontSize:"0.69rem",color:C.gz,textAlign:"center",lineHeight:1.55}}>Notas visíveis apenas para a terapeuta. Sujeitas ao sigilo profissional.</p>
          </div>
        )}
      </div>
    );
  };

  // ── Task editor tab ────────────────────────────────────────────────────
  const [editLib,setEditLib]=useState(false);
  const [libDim,setLibDim]=useState("seguranca");
  const [libLevel,setLibLevel]=useState("Fragilidade");
  const [libTask,setLibTask]=useState(TASK_LIBRARY["seguranca"]["Fragilidade"]);
  const [taskLib,setTaskLib]=useState(TASK_LIBRARY);

  const TaskEditor=()=>(
    <div>
      <h2 style={{fontSize:"1rem",fontWeight:700,color:C.roxo,marginBottom:13}}>Biblioteca de Tarefas</h2>
      {/* Dim selector */}
      <div style={{display:"flex",overflowX:"auto",gap:6,marginBottom:10,scrollbarWidth:"none",paddingBottom:2}}>
        {DIMS.map(d=><button key={d.id} onClick={()=>{setLibDim(d.id);setLibTask(taskLib[d.id][libLevel]);}} style={{flexShrink:0,padding:"5px 11px",borderRadius:50,fontFamily:"Poppins",fontSize:"0.74rem",fontWeight:libDim===d.id?700:400,background:libDim===d.id?C.roxo:"transparent",color:libDim===d.id?"white":C.gz,border:"1.5px solid "+(libDim===d.id?C.roxo:"rgba(132,130,144,0.25)"),cursor:"pointer"}}>{d.icon} {d.short}</button>)}
      </div>
      {/* Level selector */}
      <div style={{display:"flex",gap:6,marginBottom:13,flexWrap:"wrap"}}>
        {["Fragilidade","Em desenvolvimento","Boa base","Muito positivo"].map(lv=><button key={lv} onClick={()=>{setLibLevel(lv);setLibTask(taskLib[libDim][lv]);}} style={{padding:"4px 10px",borderRadius:50,fontFamily:"Poppins",fontSize:"0.72rem",fontWeight:libLevel===lv?700:400,background:libLevel===lv?lc(lv===4?"Fragilidade":lv):"transparent",color:libLevel===lv?"white":C.gz,border:"1.5px solid rgba(132,130,144,0.25)",cursor:"pointer"}}>{lv}</button>)}
      </div>
      {/* Task editor */}
      <div style={{background:C.wh,borderRadius:12,padding:"13px",boxShadow:"0 1px 6px rgba(44,73,81,0.06)"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
          <p style={{fontWeight:700,fontSize:"0.84rem",color:C.pet}}>{libTask?.icon} Editar tarefa</p>
          <p style={{fontSize:"0.69rem",color:C.gz}}>{DIMS.find(d=>d.id===libDim)?.label} · {libLevel}</p>
        </div>
        {[{l:"Título",k:"title",rows:1},{l:"Descrição (o que fazer)",k:"text",rows:3},{l:"Regra / nota de suporte",k:"rule",rows:2}].map((f,i)=>(
          <div key={i} style={{marginBottom:11}}>
            <p style={{fontSize:"0.79rem",fontWeight:600,color:C.pet,marginBottom:5}}>{f.l}</p>
            <textarea value={libTask?.[f.k]||""} onChange={e=>setLibTask(t=>({...t,[f.k]:e.target.value}))} rows={f.rows} style={{width:"100%",padding:"10px 12px",borderRadius:10,border:"1.5px solid "+C.lav,fontFamily:"Poppins",fontSize:"0.83rem",outline:"none",color:C.pet,background:C.iv,boxSizing:"border-box",resize:"none"}}/>
          </div>
        ))}
        <button onClick={()=>{setTaskLib(tl=>({...tl,[libDim]:{...tl[libDim],[libLevel]:libTask}}));showToast("✓ Tarefa guardada na biblioteca");}} style={{width:"100%",padding:"11px",borderRadius:11,background:C.roxo,color:"white",fontFamily:"Poppins",fontSize:"0.84rem",fontWeight:700,border:"none",cursor:"pointer"}}>Guardar alteração</button>
        <p style={{fontSize:"0.68rem",color:C.gz,textAlign:"center",marginTop:8}}>Esta alteração aplica-se a novos resultados com este perfil.</p>
      </div>
    </div>
  );

  return(
    <div style={{height:"100%",display:"flex",flexDirection:"column",background:"#F2F2F7",fontFamily:"Poppins"}}>
      <div style={{background:C.wh,borderBottom:"1px solid rgba(60,60,67,0.1)",padding:"9px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
        <Logo h={17}/>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <span style={{fontSize:"0.71rem",color:C.gz}}>Ana Mafalda</span>
          <button onClick={()=>{setLoggedIn(false);setUser(null);go("home");}} style={{background:"rgba(76,48,94,0.08)",border:"none",borderRadius:8,padding:"5px 11px",fontFamily:"Poppins",fontSize:"0.72rem",fontWeight:600,color:C.roxo,cursor:"pointer"}}>Sair</button>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"13px"}}>
        {sel ? <CoupleDetail/> : tab==="couples" ? <CoupleList/> : <TaskEditor/>}
      </div>
      {!sel&&<div style={{background:"rgba(249,249,249,0.94)",borderTop:"1px solid rgba(60,60,67,0.1)",display:"flex",flexShrink:0,paddingBottom:2}}>
        {[{id:"couples",l:"Casais"},{id:"tasks",l:"Tarefas"}].map(n=>(
          <button key={n.id} onClick={()=>setTab(n.id)} style={{flex:1,background:"none",border:"none",cursor:"pointer",padding:"8px 2px 6px",fontFamily:"Poppins",fontSize:"0.72rem",fontWeight:tab===n.id?700:400,color:tab===n.id?C.roxo:C.gz}}>{n.l}</button>
        ))}
      </div>}
      {toast&&<div style={{position:"fixed",bottom:80,left:"50%",transform:"translateX(-50%)",background:C.ok,color:"white",padding:"9px 16px",borderRadius:9,fontFamily:"Poppins",fontSize:"0.79rem",fontWeight:600,zIndex:999,whiteSpace:"nowrap",boxShadow:"0 4px 16px rgba(74,138,110,0.4)"}}>{toast}</div>}
    </div>
  );
}
