async function loadWeekData(weekNumber) {
  const res = await fetch(`json/week${weekNumber}.json`);
  const data = await res.json();

  document.getElementById('studyIntroContent').innerHTML = data.studyIntro;
  document.getElementById('audioContent').innerHTML = data.audio.map(a => `
    <div>
      <strong>${a.title}</strong>
      <audio controls src="${a.url}"></audio>
    </div>
  `).join('');
  document.getElementById('scripturesContent').innerHTML = data.scriptures.map(s => `
    <p>${s.text}</p>
  `).join('');
  document.getElementById('kidsCornerContent').innerHTML = data.kids.map(k => `<p>${k.text}</p>`).join('');
}

// Week selector dropdown
document.getElementById('weekSelect').addEventListener('change', e => {
  loadWeekData(e.target.value);
});

// Initial load
loadWeekData(32);
