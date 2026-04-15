// Missler 24-hour playlist
const misslerPlaylist = [
  { hour: 1, id: "PZ3hESj__M8" },
  { hour: 2, id: "0Jd3crAKC3M" },
  { hour: 3, id: "0syohVIkDHc" },
  { hour: 4, id: "4NWuM8aRuzE" },
  { hour: 5, id: "S4mZushkYFE" },
  { hour: 6, id: "bjjA-FDFmXQ" },
  { hour: 7, id: "N3WCH5Xmqk8" },
  { hour: 8, id: "qxk9KNhnjC4" },
  { hour: 9, id: "o8AXk-zW-nQ" },
  { hour: 10, id: "5YHHF9QfmF4" },
  { hour: 11, id: "jwxppukQDLg" },
  { hour: 12, id: "ZN-Yvhhix2o" },
  { hour: 13, id: "Ud6pJaLLA8w" },
  { hour: 14, id: "ZzDUjROQCEg" },
  { hour: 15, id: "i9wAIjxBZtY" },
  { hour: 16, id: "qZdPWmrV_ls" },
  { hour: 17, id: "bgCA70Z1Y7g" },
  { hour: 18, id: "NDnF08u_z64" },
  { hour: 19, id: "ddS5ewO9Nys" },
  { hour: 20, id: "Kron8S_h0Ds" },
  { hour: 21, id: "qgv9-TN9F38" },
  { hour: 22, id: "rB5tho_piro" },
  { hour: 23, id: "kmBLLg_z_Wk" },
  { hour: 24, id: "cM72PmSIURc" }
];

function loadMisslerHour(hour) {
  const video = misslerPlaylist.find(v => v.hour === hour);
  if (!video) return console.warn("Hour not found:", hour);

  const iframe = document.getElementById("misslerPlayer");
  if (!iframe) return console.warn("Player iframe not found");

  iframe.src = `https://www.youtube.com/embed/${video.id}?rel=0&autoplay=0`;
  console.log("▶ Playing Chuck Missler Hour", hour, video.id);
}

// Generate thumbnail carousel
function buildMisslerCarousel() {
  const carousel = document.getElementById("misslerCarousel");
  if (!carousel) return;

  misslerPlaylist.forEach(video => {
    const img = document.createElement("img");
    img.src = `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`;
    img.alt = `Hour ${video.hour}`;
    img.title = `Hour ${video.hour}`;
    img.className =
      "w-24 h-14 rounded cursor-pointer hover:scale-105 transition-transform";

    img.addEventListener("click", () => loadMisslerHour(video.hour));
    carousel.appendChild(img);
  });
}

// Initialize
//window.addEventListener("DOMContentLoaded", () => {
  buildMisslerCarousel();
  loadMisslerHour(24); // autoplay Hour 24 by default
});
