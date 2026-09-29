// ===== EXAMEN D'ESCENARI (pantalla completa) =====
let currentExam = null;
let upgradesBeforeExam = 0; // per a saber quines millores són noves en aprovar

const examOpen = () => !$("exam-screen").hidden;

function showExamIntro() {
  const max = CONFIG.exam.maxErrors;
  $("exam-current").textContent = sceneOf(state.level).name;
  const boss = sceneOf(state.level).boss;
  $("exam-boss").textContent = boss ? boss.name : "l'Examinador de Trànsit";
  $("exam-next").textContent = sceneOf(state.level + 1).name;
  $("exam-rules").textContent =
    `${CONFIG.exam.questions} preguntes. Pots tindre com a màxim ${max} ${max === 1 ? "errada" : "errades"}.`;
  $("exam-intro").hidden = false;
  $("exam-body").hidden = true;
  $("exam-screen").hidden = false;
}

function startExam() {
  currentExam = shuffle(QUESTIONS).slice(0, CONFIG.exam.questions).map(q => ({
    q: q.q,
    options: shuffle(q.o.map((text, i) => ({ text, correct: i === 0 }))),
  }));

  $("exam-form").innerHTML = currentExam.map((item, qi) => `
    <div class="question">
      <p>${qi + 1}. ${item.q}</p>
      ${item.options.map((o, oi) => `
        <label><input type="radio" name="q${qi}" value="${oi}"> ${o.text}</label>`).join("")}
    </div>`).join("");
  $("exam-result").textContent = "";
  $("exam-result").className = "";
  $("btn-exam-submit").hidden = false;
  $("btn-exam-retry").hidden = true;
  $("btn-exam-continue").hidden = true;
  $("exam-intro").hidden = true;
  $("exam-body").hidden = false;
  $("exam-screen").scrollTop = 0;
}

function submitExam() {
  const form = $("exam-form");
  const unanswered = currentExam.filter((_, qi) => !form.querySelector(`input[name="q${qi}"]:checked`)).length;
  if (unanswered > 0) {
    $("exam-result").textContent = `Et ${unanswered === 1 ? "queda 1 pregunta" : `queden ${unanswered} preguntes`} per respondre.`;
    $("exam-result").className = "ko";
    return;
  }

  let errors = 0;
  currentExam.forEach((item, qi) => {
    form.querySelectorAll(`input[name="q${qi}"]`).forEach((input, oi) => {
      input.disabled = true;
      const label = input.parentElement;
      if (item.options[oi].correct) label.classList.add("correct");
      else if (input.checked) { label.classList.add("wrong"); errors++; }
    });
  });

  $("btn-exam-submit").hidden = true;
  const result = $("exam-result");
  const errText = `${errors} ${errors === 1 ? "errada" : "errades"}`;
  if (errors <= CONFIG.exam.maxErrors) {
    result.textContent = `APTE! ${errText}. Benvingut a «${sceneOf(state.level + 1).name}».`;
    result.className = "ok";
    upgradesBeforeExam = visibleUpgrades().length;
    passSceneExam();
    state.player.hp = state.player.maxHp;
    state.player.timer = 0;
    $("btn-exam-continue").hidden = false;
  } else {
    result.className = "ko";
    const refunded = restartGame(); // es reinicia ja (i es guarda) perquè no es puga evitar recarregant
    result.innerHTML = `NO APTE. ${errText}. Tornes a començar des del principi.` +
      (refunded > 0 ? ` Se t'han tornat ${refunded} ${L_ICON} (ampliacions i botiga).` : "");
    $("btn-exam-retry").hidden = false;
  }
  save();
}

function continueAfterExam() {
  const before = upgradesBeforeExam;
  $("exam-screen").hidden = true;
  toast(`🎉 Nou escenari: ${sceneOf(state.level).name}`, "good");
  if (visibleUpgrades().length > before) toast("✨ Noves millores disponibles!", "good");
  renderUpgrades(before);
}

function closeAfterFail() {
  $("exam-screen").hidden = true;
  toast("🚗 Tornes a començar. Ànim!", "bad");
}
