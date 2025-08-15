async function loadWeekData(weekNumber) {
  const res = await fetch(`json/week${weekNumber}.json`);
  const data = await res.json();

  document.getElementById('studyIntroContent').innerHTML = data.studyIntro;
  document.getElementById('audioContent').innerHTML = data.audio.map(a => `
    <div class="flex flex-col md:flex-row md:items-center md:justify-between">
      <strong>${a.title}</strong>
      <audio controls src="${a.url}" class="mt-1 md:mt-0 md:mx-2"></audio>
    </div>
  `).join('');
  document.getElementById('scripturesContent').innerHTML = data.scriptures.map(s => `<p>${s.text}</p>`).join('');
  document.getElementById('kidsCornerContent').innerHTML = data.kids.map(k => `<p>${k.text}</p>`).join('');
}

// Week dropdown
document.getElementById('weekSelect').addEventListener('change', e => loadWeekData(e.target.value));

// Initial load
loadWeekData(32);
