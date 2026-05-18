function renderJourney(journey, state) {
  const progress = state.progress?.[journey.id] || {
    completedSteps: [],
    currentStep: journey.steps[0]?.id
  };

  const completed = progress.completedSteps.length;
  const total = journey.steps.length;

  document.getElementById("journeyTitle").textContent = journey.title;
  document.getElementById("journeyDescription").textContent = journey.description;

  document.getElementById("progressText").textContent = `${completed} / ${total} completed`;

  const step = journey.steps.find(s => s.id === progress.currentStep);
  document.getElementById("currentStepTitle").textContent = step?.title || "Start journey";
}
