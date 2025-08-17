document.getElementById("searchInput").addEventListener("input", e => {
  const query = e.target.value.toLowerCase();

  sections.forEach(id => {
    const el = document.getElementById(id);
    if(el) {
      const text = el.textContent.toLowerCase();
      if(text.includes(query) && query !== "") {
        el.classList.add("ring-2", "ring-navy", "bg-navy/10");
      } else {
        el.classList.remove("ring-2", "ring-navy", "bg-navy/10");
      }
    }
  });
});
