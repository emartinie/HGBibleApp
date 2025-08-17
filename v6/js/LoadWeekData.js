async function loadWeekData(weekNumber) {
  try {
    const res = await fetch(`weeks/week${weekNumber}.json`);
    const rawData = await res.json();
    const week = normalizeWeekData(rawData);

    // Populate dropdown display
    const dropdown = document.getElementById('weekDropdown');
    dropdown.innerHTML = `<option value="${weekNumber}">${week.title}</option>`;

    // Populate content areas
    document.getElementById('studyIntroContent').textContent = week.intro.summary;
    document.getElementById('audioContent').innerHTML = week.sections.audio_playlist.map(a => 
      `<p>${a.label}: <audio controls src="${a.src}"></audio></p>`).join('');
    
    document.getElementById('scripturesContent').innerHTML =
      JSON.stringify(week.sections.chapter_outlines, null, 2); // placeholder; style later

    document.getElementById('commentaryContent').textContent = week.sections.commentary.content;
    document.getElementById('deeperLearningContent').textContent = week.sections.deeper_learning;
    document.getElementById('alephTavsContent').textContent = week.sections.aleph_tav;

    // Kids section
    document.getElementById('kidsCornerContent').innerHTML =
      week.sections.kids_study.videos.map(v => `<iframe src="${v}" frameborder="0" allowfullscreen></iframe>`).join('');

    // Language
    const lang = week.sections.language_learning;
    document.getElementById('wordsOfTheWeekContent').innerHTML =
      `Hebrew: ${lang.hebrew.word || ""} (${lang.hebrew.text || ""})<br>
       Greek: ${lang.greek.word || ""} (${lang.greek.text || ""})`;
    
  } catch(e) {
    console.error("Failed to load week:", e);
  }
}
