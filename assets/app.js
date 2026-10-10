(async function () {
  const cls = { "concluído": "st-concluido", "em andamento": "st-andamento", "a fazer": "st-fazer" };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = d => { const [a, m, dd] = d.split("-"); return `${dd}/${m}/${a}`; };
  const $ = id => document.getElementById(id);
  const linha = t => `<div class="tarefa"><span class="id">${esc(t.id)}</span><span class="t">${esc(t.titulo)}</span>
     <span class="area">${esc(t.area)}</span><span class="st ${cls[t.status] || "st-fazer"}">${esc(t.status)}</span></div>`;
  let dados;
  try { dados = await (await fetch("data/backlog.json?v=" + Date.now())).json(); }
  catch (e) { $("dias").innerHTML = "<p>Não foi possível carregar os dados.</p>"; return; }

  const proj = dados.projeto && dados.projeto.tarefas && dados.projeto.tarefas.length ? dados.projeto : null;
  let lista;
  if (proj) lista = proj.tarefas;
  else { const m = new Map(); for (const d of dados.dias) for (const t of d.tarefas) if (!m.has(t.id)) m.set(t.id, t); lista = [...m.values()]; }
  const cont = (l, s) => l.filter(t => t.status === s).length;
  const total = lista.length, ok = cont(lista, "concluído");
  if (proj && proj.nome) $("proj").textContent = "Projeto: " + proj.nome;
  $("resumo").innerHTML = [["Tarefas", total], ["Concluídas", ok], ["Em andamento", cont(lista, "em andamento")], ["A fazer", cont(lista, "a fazer")]]
    .map(([l, n]) => `<div class="card"><div class="n">${n}</div><div class="l">${l}</div></div>`).join("");
  const pct = total ? Math.round(ok / total * 100) : 0;
  $("pct").textContent = pct + "%";
  setTimeout(() => $("bar").style.width = pct + "%", 50);

  if (proj) {
    const prox = lista.find(t => t.status === "em andamento") || lista.find(t => t.status === "a fazer");
    $("proxima").innerHTML = prox ? `<div class="prox"><small>Próxima tarefa</small><strong>${esc(prox.id)}</strong> — ${esc(prox.titulo)}</div>`
      : `<div class="prox"><strong>Projeto concluído 🎉</strong></div>`;
    const porFase = proj.fases.map(f => ({ ...f, ts: lista.filter(t => t.fase === f.id) })).filter(f => f.ts.length);
    $("fases").innerHTML = porFase.map(f => {
      const c = cont(f.ts, "concluído"), p = Math.round(c / f.ts.length * 100);
      return `<div class="fase"><div class="cab"><strong>${esc(f.id)} · ${esc(f.nome)}</strong><span>${c}/${f.ts.length} · ${p}%</span></div>
        <div class="progress"><div style="width:${p}%"></div></div></div>`;
    }).join("");
    $("plano").innerHTML = porFase.map(f =>
      `<details><summary>${esc(f.id)} · ${esc(f.nome)}<span>${cont(f.ts, "concluído")}/${f.ts.length}</span></summary>${f.ts.map(linha).join("")}</details>`).join("");
  } else { $("fases").parentElement.style.display = "none"; $("plano").parentElement.style.display = "none"; }

  const fArea = $("f-area"), fStatus = $("f-status");
  [...new Set(dados.dias.flatMap(d => d.tarefas.map(t => t.area)))].sort().forEach(a => fArea.insertAdjacentHTML("beforeend", `<option>${esc(a)}</option>`));
  function render() {
    const a = fArea.value, s = fStatus.value;
    $("dias").innerHTML = dados.dias.map(dia => {
      const ts = dia.tarefas.filter(t => (!a || t.area === a) && (!s || t.status === s));
      return ts.length ? `<div class="dia"><h2>${fmt(dia.data)}</h2>${ts.map(linha).join("")}</div>` : "";
    }).join("") || "<p>Nenhuma tarefa encontrada.</p>";
  }
  fArea.onchange = fStatus.onchange = render;
  render();
  if (dados.gerado_em) $("gerado").textContent = "Atualizado em " +
    new Date(dados.gerado_em).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) + " (horário de Brasília)";
})();
