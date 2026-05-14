function moveSlide(btn, dir) {
  const card = btn.closest(".card");
  const carousel = btn.closest(".carousel");
  const images = carousel.querySelectorAll("img");

  let index = parseInt(carousel.getAttribute("data-index"));

  images[index].classList.remove("active");

  index += dir;

  if (index < 0) index = images.length - 1;
  if (index >= images.length) index = 0;

  images[index].classList.add("active");
  carousel.setAttribute("data-index", index);
}

function zoom(img) {
  document.getElementById("store-modal").style.display = "block";
  document.getElementById("store-modal-img").src = img.src;
}

function closeZoom() {
  document.getElementById("store-modal").style.display = "none";
}
