function activateTab(idx) {
  const tabs = tabsDiv.children;
  const panels = panelsDiv.children;
  Array.from(tabs).forEach((t, i) => t.classList.toggle("active", i === idx));
  
  Array.from(panels).forEach((p, i) => {
    if(i === idx) {
      p.classList.remove("hidden");
      setTimeout(() => p.classList.add("opacity-100"), 10);
    } else {
      p.classList.remove("opacity-100");
      setTimeout(() => p.classList.add("hidden"), 500);
    }
  });
}
