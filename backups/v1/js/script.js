// Example interactive behavior: scroll reveal effect
document.addEventListener("scroll", () => {
  const cards = document.querySelectorAll(".feature-card");
  const trigger = window.innerHeight / 1.2;

  cards.forEach(card => {
    const top = card.getBoundingClientRect().top;
    if (top < trigger) {
      card.style.opacity = 1;
      card.style.transform = "translateY(0)";
    }
  });
});
