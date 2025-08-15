div.addEventListener('click', () => {
  weekSelector.value = week;
  loadWeek(week);
  activateTab(Object.keys(allWeeks[week]).indexOf(section));
  searchResults.classList.add('hidden');
  panelsDiv.scrollIntoView({ behavior: 'smooth' });
});
