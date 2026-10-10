(async function () {
  const cls = { "concluído": "st-concluido", "em andamento": "st-andamento", "a fazer": "st-fazer" };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = d => { const [a, m, dd] = d.split("-"); return `${dd}/${m}/${a}`; };
  let dados;
  try {
    dados = await (await fetch("data/backlog.json?v=" + Date.now())).json();
  } catch (e) {
    document.getElementById("dias").innerHTML = "<p>Não foi possível carregar os dados.</p>";
    return;
  }
  // Situação atual: última ocorrência de cada id (dias mais recentes primeiro)
  const atual = new Map();
  for (const dia of dados.dias) for (const t of dia.tarefas) if (!atual.has(t.id)) atual.set(t.id, t);
  const lista = [...atual.values()];
  const cont = s => lista.filter(t => t.status === s).length;
  const total = lista.length, ok = cont("concluído");
  document.getElementById("resumo").innerHTML = [
    ["Tarefas", total], ["Concluídas", ok], ["Em andamento", cont("em andamento")], ["A fazer", cont("a fazer")]
  ].map(([l, n]) => `<div class="card"><div class="n">${n}</div><div class="l">${l}</div></div>`).join("");
  const pct = total ? Math.round(ok / total * 100) : 0;
  document.getElementById("pct").textContent = pct + "%";
  setTimeout(() => document.getElementById("bar").style.width = pct + "%", 50);

  const fArea = document.getElementById("f-area"), fStatus = document.getElementById("f-status");
  [...new Set(lista.map(t => t.area))].sort().forEach(a => fArea.insertAdjacentHTML("beforeend", `<option>${esc(a)}</option>`));

  function render() {
    const a = fArea.value, s = fStatus.value;
    document.getElementById("dias").innerHTML = dados.dias.map(dia => {
      const ts = dia.tarefas.filter(t => (!a || t.area === a) && (!s || t.status === s));
      if (!ts.length) return "";
      return `<div class="dia"><h2>${fmt(dia.data)}</h2>` + ts.map(t =>
        `<div class="tarefa"><span class="id">${esc(t.id)}</span><span class="t">${esc(t.titulo)}</span>
         <span class="area">${esc(t.area)}</span><span class="st ${cls[t.status] || "st-fazer"}">${esc(t.status)}</span></div>`
      ).join("") + "</div>";
    }).join("") || "<p>Nenhuma tarefa encontrada.</p>";
  }
  fArea.onchange = fStatus.onchange = render;
  render();
  if (dados.gerado_em) document.getElementById("gerado").textContent =
    "Atualizado em " + new Date(dados.gerado_em).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) + " (horário de Brasília)";
})();
