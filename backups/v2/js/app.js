document.addEventListener("DOMContentLoaded", () => {
  const weekSelector = document.getElementById("weekSelector");

  weekSelector.addEventListener("change", () => {
    const week = weekSelector.value;
    loadWeek(week);
  });

  // Load default week
  loadWeek(weekSelector.value);
});

function loadWeek(week) {
  // This is placeholder logic for loading JSON
  // Replace these with real JSON fetches per week
  const placeholderContent = `Content for Week ${week}. Replace with your JSON data!`;

  document.getElementById("introContent").textContent = placeholderContent;
  document.getElementById("studyIntroContent").textContent = placeholderContent;
  document.getElementById("audioContent").textContent = placeholderContent;
  document.getElementById("scripturesContent").textContent = placeholderContent;
  document.getElementById("commentaryContent").textContent = placeholderContent;
  document.getElementById("deeperLearningContent").textContent = placeholderContent;
  document.getElementById("alephTavsContent").textContent = placeholderContent;
  document.getElementById("printoutsContent").textContent = placeholderContent;
  document.getElementById("kidsCornerContent").textContent = placeholderContent;
  document.getElementById("wordsOfTheWeekContent").textContent = placeholderContent;
  document.getElementById("psalmsContent").textContent = placeholderContent;
}
