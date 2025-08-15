// Reference all sections
const sectionsContent = {
  studyIntroContent: "Introduction content for selected week",
  audioContent: "Audio content placeholder",
  scripturesContent: "Scriptures content placeholder",
  commentaryContent: "Commentary content placeholder",
  deeperLearningContent: "Advanced study content placeholder",
  alephTavsContent: "Hidden Aleph Tav content",
  printoutsContent: "Printouts content placeholder",
  kidsCornerContent: "Kids content placeholder",
  wordsOfTheWeekContent: "Words of the Week content",
  psalmsContent: "Psalms content placeholder"
};

function loadWeek(week = "week1") {
  for (const id in sectionsContent) {
    document.getElementById(id).innerHTML = `<p>${sectionsContent[id]} for ${week}</p>`;
  }
}

// Fade-in animation
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

// Week selector
document.getElementById('weekSelector').addEventListener('change', e => loadWeek(e.target.value));

// Initial load
loadWeek("week1");
