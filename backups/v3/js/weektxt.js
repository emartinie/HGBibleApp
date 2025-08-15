let allWeeks = {}; // Stores all weeks from JSON

// Load all weeks at startup
fetch('weeks.json')
  .then(response => response.json())
  .then(data => {
    allWeeks = data;
    loadWeek(document.getElementById("weekSelector").value);
  });

const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");

searchInput.addEventListener("input", () => multiWeekSearch(searchInput.value));

function multiWeekSearch(query) {
  const lowerQuery = query.toLowerCase();
  searchResults.innerHTML = '';
  if (!query) {
    searchResults.classList.add('hidden');
    return;
  }

  Object.keys(allWeeks).forEach(week => {
    Object.keys(allWeeks[week]).forEach(section => {
      const content = allWeeks[week][section];
      if (content.toLowerCase().includes(lowerQuery)) {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'p-2 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer';
        resultDiv.innerHTML = `<strong>Week ${week} - ${section}</strong>: ${content.substring(0, 100)}...`;
        resultDiv.addEventListener('click', () => {
          document.getElementById('weekSelector').value = week;
          loadWeek(week);
          tabs.forEach(t => t.classList.remove("active"));
          panels.forEach(p => p.classList.add("hidden"));
          document.getElementById(section).classList.remove("hidden");
          searchResults.classList.add('hidden');
        });
        searchResults.appendChild(resultDiv);
      }
    });
  });

  if (searchResults.children.length > 0) {
    searchResults.classList.remove('hidden');
  } else {
    searchResults.innerHTML = '<p class="p-2">No results found.</p>';
    searchResults.classList.remove('hidden');
  }
}
