// Example: Populate Psalms table dynamically
const psalmsData = [
  { day: 'Sunday', url: '#', passage: 'Chapters 1-29', link: '#' },
  { day: 'Monday', url: '#', passage: 'Chapters 30-50', link: '#' },
  { day: 'Tuesday', url: '#', passage: 'Chapters 51-72', link: '#' },
  { day: 'Wednesday', url: '#', passage: 'Chapters 73-89', link: '#' },
  { day: 'Thursday', url: '#', passage: 'Chapters 90-106', link: '#' },
  { day: 'Friday', url: '#', passage: 'Chapters 107-119', link: '#' },
  { day: 'Saturday', url: '#', passage: 'Chapters 120-150', link: '#' }
];

function buildPsalmsTable() {
  const table = document.getElementById('psalms-table');
  table.innerHTML = '';
  for (let i = 0; i < psalmsData.length; i += 2) {
    const row = document.createElement('tr');
    [psalmsData[i], psalmsData[i+1]].forEach(psalm => {
      if (!psalm) return;
      const cell = document.createElement('td');
      cell.className = "border p-2";
      cell.innerHTML = `<strong>${psalm.day}</strong> 
        <audio controls preload="none">
          <source src="${psalm.url}" type="audio/mpeg">
        </audio> 
        <a href="${psalm.link}" target="_blank">${psalm.passage}</a>`;
      row.appendChild(cell);
    });
    table.appendChild(row);
  }
}

buildPsalmsTable();

// Example: Week selector
document.getElementById('weekSelector').addEventListener('change', (e) => {
  alert(`You selected week ${e.target.value} (you can load JSON here)`);
});
