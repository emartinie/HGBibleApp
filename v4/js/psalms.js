const psalmsData = [
  { day: 'Sunday', url: 'http://audio.esvbible.org/hw/19001001-19029011.mp3', passage: 'Chapters 1-29' },
  { day: 'Monday', url: 'http://audio.esvbible.org/hw/19030001-19050023.mp3', passage: 'Chapters 30-50' },
  { day: 'Tuesday', url: 'http://audio.esvbible.org/hw/19051001-19072020.mp3', passage: 'Chapters 51-72' },
  { day: 'Wednesday', url: 'http://audio.esvbible.org/hw/19063001-19089052.mp3', passage: 'Chapters 73-89' },
  { day: 'Thursday', url: 'http://audio.esvbible.org/hw/19090001-19106048.mp3', passage: 'Chapters 90-106' },
  { day: 'Friday', url: 'http://audio.esvbible.org/hw/19107001-19119176.mp3', passage: 'Chapters 107-119' },
  { day: 'Saturday', url: 'http://audio.esvbible.org/hw/19120001-19150006.mp3', passage: 'Chapters 120-150' }
];

function buildPsalms() {
  const container = document.getElementById('psalmsContent');
  container.innerHTML = psalmsData.map(p => `
    <div class="flex justify-between items-center p-2 border-b border-gray-200">
      <span class="font-semibold">${p.day}</span>
      <audio controls class="flex-1 mx-2" src="${p.url}"></audio>
      <span>${p.passage}</span>
    </div>
  `).join('');
}

buildPsalms();
