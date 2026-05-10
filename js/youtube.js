// Playlist
const youtubePlaylist = [
  { hour: 1, id: "Xh7kblHeBQI" },
  { hour: 2, id: "sZFY1a9u1zo" },
  { hour: 3, id: "xwPPpGRmNOM" },
  { hour: 4, id: "ExfQ3IN5BoU" },
  { hour: 5, id: "AsBgluFGz7Y" },
  { hour: 6, id: "8q6FUlay-M8" },
  { hour: 7, id: "" },
  { hour: 8, id: "" },
  { hour: 9, id: "" },
  { hour: 10, id: "" },
  { hour: 11, id: "" },
  { hour: 12, id: "" },
  { hour: 13, id: "" },
  { hour: 14, id: "" },
  { hour: 15, id: "" },
  { hour: 16, id: "" },
  { hour: 17, id: "" },
  { hour: 18, id: "" },
  { hour: 19, id: "" },
  { hour: 20, id: "" },
  { hour: 21, id: "" },
  { hour: 22, id: "" },
  { hour: 23, id: "" },
  { hour: 24, id: "9uIXzUEwrOg" }
];

function loadYoutubeHour(hour) {
  const video = youtubePlaylist.find(v => v.hour === hour);
  if (!video) return console.warn("Hour not found:", hour);

  const iframe = document.getElementById("youtubePlayer");
  if (!iframe) return console.warn("Player iframe not found");

  iframe.src = `https://www.youtube.com/embed/${video.id}?rel=0&autoplay=0`;
  console.log("▶ Loaded hour", hour, video.id);
}

function buildYoutubeCarousel() {
  const carousel = document.getElementById("youtubeCarousel");
  if (!carousel) return;

  carousel.innerHTML = "";

  youtubePlaylist.forEach(video => {
    const img = document.createElement("img");
    img.src = `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`;
    img.alt = `Hour ${video.hour}`;
    img.title = `Hour ${video.hour}`;
    img.className =
      "w-24 h-14 rounded cursor-pointer hover:scale-105 transition-transform";

    img.addEventListener("click", () => loadYoutubeHour(video.hour));
    carousel.appendChild(img);
  });
}

// Initialize
buildYoutubeCarousel();
loadYoutubeHour(24);
