// Example dynamic content for weeks
const studyIntroContent = document.getElementById('studyIntroContent');
const audioContent = document.getElementById('audioContent');
const scripturesContent = document.getElementById('scripturesContent');
const commentaryContent = document.getElementById('commentaryContent');
const deeperLearningContent = document.getElementById('deeperLearningContent');
const alephTavsContent = document.getElementById('alephTavsContent');
const printoutsContent = document.getElementById('printoutsContent');
const kidsCornerContent = document.getElementById('kidsCornerContent');
const wordsOfTheWeekContent = document.getElementById('wordsOfTheWeekContent');
const psalmsContent = document.getElementById('psalmsContent');

// Fake load function for demo
function loadWeek(week="week1") {
  studyIntroContent.innerHTML = `<p>Introduction content for ${week}</p>`;
  audioContent.innerHTML = `<p>Audio content for ${week}</p>`;
  scripturesContent.innerHTML = `<p>Scriptures content for ${week}</p>`;
  commentaryContent.innerHTML = `<p>Commentary content for ${week}</p>`;
  deeperLearningContent.innerHTML = `<p>Advanced study for ${week}</p>`;
  alephTavsContent.innerHTML = `<p>Hidden Aleph Tav content for ${week}</p>`;
  printoutsContent.innerHTML = `<p>Printouts for ${week}</p>`;
  kidsCornerContent.innerHTML = `<p>Bible for Kids content for ${week}</p>`;
  wordsOfTheWeekContent.innerHTML = `<p>Words of the Week for ${week}</p>`;
  psalmsContent.innerHTML = `<p>Psalms content for ${week}</p>`;
}

// Fade-in animation on scroll
const sections = document.querySelectorAll("section");
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

sections.forEach(section => observer.observe(section));

// Week selector change
const weekSelector = document.getElementById('weekSelector');
weekSelector.addEventListener('change', (e) => loadWeek(e.target.value));

// Initial load
loadWeek("week1");
