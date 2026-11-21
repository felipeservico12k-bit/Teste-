// Medidor de Dedo: calibra a tela com um cartão padrão e converte medidas em números de anel.

// Cartão padrão ISO/IEC 7810 ID-1, usado em pé (largura = lado menor).
const CARTAO_LARGURA_MM = 53.98;
const CARTAO_ALTURA_MM = 85.6;
const CARTAO_RAIO_MM = 3.18;
const CHAVE_CALIBRACAO = "medidor-dedo:px-por-mm";

let pxPorMm = carregarCalibracao() ?? 96 / 25.4; // palpite padrão de monitor
let calibrado = carregarCalibracao() !== null;
let ultimoAro = null;

// ---------- Conversões ----------

// Aro brasileiro: circunferência interna (mm) - 40. Ex.: 56 mm = aro 16.
// Tamanho EUA: (diâmetro - 11,63) / 0,8128, arredondado para meio número.
function tamanhos(circunferenciaMm) {
  const diametro = circunferenciaMm / Math.PI;
  const eua = Math.round(((diametro - 11.63) / 0.8128) * 2) / 2;
  return {
    circunferencia: circunferenciaMm,
    diametro,
    br: Math.round(circunferenciaMm - 40),
    iso: Math.round(circunferenciaMm),
    eua: Math.max(0, eua),
  };
}

const fmt = (n, casas = 1) => n.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });

function htmlResultado(t) {
  return `
    <div class="aro-principal">
      <div class="rotulo">Seu aro (Brasil)</div>
      <div class="numero">${t.br}</div>
    </div>
    <div class="detalhes">
      <div><span>Circunferência</span><strong>${fmt(t.circunferencia)} mm</strong></div>
      <div><span>Diâmetro</span><strong>${fmt(t.diametro)} mm</strong></div>
      <div><span>EUA</span><strong>${fmt(t.eua, t.eua % 1 ? 1 : 0)}</strong></div>
      <div><span>Europa (ISO)</span><strong>${t.iso}</strong></div>
    </div>`;
}

// ---------- Armazenamento ----------

function carregarCalibracao() {
  try {
    const v = parseFloat(localStorage.getItem(CHAVE_CALIBRACAO));
    return Number.isFinite(v) && v > 0 ? v : null;
  } catch {
    return null;
  }
}

function salvarCalibracao(valor) {
  try {
    localStorage.setItem(CHAVE_CALIBRACAO, String(valor));
  } catch {
    /* sem armazenamento: vale só para esta visita */
  }
}

// ---------- Abas ----------

const abas = document.querySelectorAll("[data-aba]");
const paineis = document.querySelectorAll(".painel");

function abrirAba(id) {
  abas.forEach((b) => b.setAttribute("aria-selected", String(b.dataset.aba === id)));
  paineis.forEach((p) => (p.hidden = p.id !== id));
  document.getElementById("aviso-calibracao").hidden = calibrado || id === "calibrar" || id === "tabela";
}

abas.forEach((b) => b.addEventListener("click", () => abrirAba(b.dataset.aba)));
document.querySelectorAll("[data-ir]").forEach((b) => b.addEventListener("click", () => abrirAba(b.dataset.ir)));

// ---------- Calibração ----------

const sliderCartao = document.getElementById("slider-cartao");
const cartao = document.getElementById("cartao");

function desenharCartao() {
  const largura = parseFloat(sliderCartao.value);
  const escala = largura / CARTAO_LARGURA_MM;
  cartao.style.width = `${largura}px`;
  cartao.style.height = `${CARTAO_ALTURA_MM * escala}px`;
  cartao.style.borderRadius = `${CARTAO_RAIO_MM * escala}px`;
}

sliderCartao.value = String(pxPorMm * CARTAO_LARGURA_MM);
sliderCartao.addEventListener("input", desenharCartao);

document.getElementById("salvar-calibracao").addEventListener("click", () => {
  pxPorMm = parseFloat(sliderCartao.value) / CARTAO_LARGURA_MM;
  calibrado = true;
  salvarCalibracao(pxPorMm);
  aplicarCalibracao();
  document.getElementById("msg-calibracao").textContent =
    "Calibração salva! Agora meça com um anel (2a) ou com papel (2b).";
});

// ---------- Medição com anel ----------

const sliderAnel = document.getElementById("slider-anel");
const circulo = document.getElementById("circulo");

function desenharAnel() {
  const diametroMm = parseFloat(sliderAnel.value);
  const px = diametroMm * pxPorMm;
  circulo.style.width = circulo.style.height = `${px}px`;
  const t = tamanhos(diametroMm * Math.PI);
  document.getElementById("resultado-anel").innerHTML = htmlResultado(t);
  marcarTabela(t.br);
}

sliderAnel.addEventListener("input", desenharAnel);

// Botões + e −: um toque ajusta um passo; mantendo apertado, continua ajustando.
// Feito com pointer events para funcionar com uma mão segurando o cartão ou o anel na tela.
function darPasso(botao) {
  const slider = botao.dataset.alvo === "cartao" ? sliderCartao : sliderAnel;
  const novo = parseFloat(slider.value) + parseFloat(botao.dataset.passo);
  slider.value = String(Math.min(parseFloat(slider.max), Math.max(parseFloat(slider.min), novo)));
  slider.dispatchEvent(new Event("input"));
}

document.querySelectorAll(".ajuste").forEach((b) => {
  let espera = null;
  let repeticao = null;
  const parar = () => {
    clearTimeout(espera);
    clearInterval(repeticao);
  };

  b.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    parar();
    try { b.setPointerCapture(e.pointerId); } catch { /* opcional */ }
    darPasso(b);
    espera = setTimeout(() => {
      repeticao = setInterval(() => darPasso(b), 60);
    }, 400);
  });
  ["pointerup", "pointercancel", "lostpointercapture"].forEach((tipo) => b.addEventListener(tipo, parar));
  b.addEventListener("contextmenu", (e) => e.preventDefault());
  // Teclado (Enter/Espaço) gera um clique sem ponteiro: detail === 0
  b.addEventListener("click", (e) => {
    if (e.detail === 0) darPasso(b);
  });
});

// ---------- Medição com papel ----------

const SVG_NS = "http://www.w3.org/2000/svg";
const REGUA_MM = 100;

function desenharRegua() {
  const regua = document.getElementById("regua");
  const margem = 12;
  const largura = REGUA_MM * pxPorMm + margem * 2;
  const altura = 56;
  regua.setAttribute("width", largura);
  regua.setAttribute("height", altura);
  regua.replaceChildren();

  for (let mm = 0; mm <= REGUA_MM; mm++) {
    const x = margem + mm * pxPorMm;
    const tam = mm % 10 === 0 ? 26 : mm % 5 === 0 ? 18 : 10;
    const linha = document.createElementNS(SVG_NS, "line");
    linha.setAttribute("x1", x);
    linha.setAttribute("x2", x);
    linha.setAttribute("y1", 0);
    linha.setAttribute("y2", tam);
    linha.setAttribute("stroke-width", mm % 10 === 0 ? 1.2 : 0.8);
    regua.appendChild(linha);

    if (mm % 10 === 0) {
      const texto = document.createElementNS(SVG_NS, "text");
      texto.setAttribute("x", x);
      texto.setAttribute("y", 42);
      texto.setAttribute("text-anchor", "middle");
      texto.textContent = mm / 10; // centímetros
      regua.appendChild(texto);
    }
  }
}

const entradaCirc = document.getElementById("entrada-circ");
entradaCirc.addEventListener("input", () => {
  const valor = parseFloat(entradaCirc.value.replace(",", "."));
  const saida = document.getElementById("resultado-papel");
  if (!Number.isFinite(valor) || valor < 35 || valor > 90) {
    saida.innerHTML = entradaCirc.value ? "<p>Digite um valor entre 35 e 90 mm.</p>" : "";
    return;
  }
  const t = tamanhos(valor);
  saida.innerHTML = htmlResultado(t);
  marcarTabela(t.br);
});

// ---------- Tabela ----------

function montarTabela() {
  const corpo = document.getElementById("corpo-tabela");
  for (let aro = 8; aro <= 32; aro++) {
    const t = tamanhos(aro + 40);
    const tr = document.createElement("tr");
    tr.dataset.aro = aro;
    tr.innerHTML = `<td>${aro}</td><td>${fmt(t.circunferencia, 0)} mm</td><td>${fmt(t.diametro)} mm</td><td>${fmt(t.eua, t.eua % 1 ? 1 : 0)}</td>`;
    corpo.appendChild(tr);
  }
}

function marcarTabela(aro) {
  if (aro === ultimoAro) return;
  ultimoAro = aro;
  document.querySelectorAll("#corpo-tabela tr").forEach((tr) => {
    tr.classList.toggle("marcado", Number(tr.dataset.aro) === aro);
  });
}

// ---------- Início ----------

function aplicarCalibracao() {
  desenharAnel();
  desenharRegua();
}

montarTabela();
desenharCartao();
aplicarCalibracao();
abrirAba(calibrado ? "anel" : "calibrar");
