(function () {

  const EPISODES = [
    {
      title: "Shemini — The Eighth Day",
      file: "audio/shemini.mp3"
    }
  ];

  const list = document.getElementById("podcastList");
  const player = document.getElementById("podcastPlayer");

  function render() {
    list.innerHTML = EPISODES.map(ep => `
      <button class="ui-btn w-full text-left" data-src="${ep.file}">
        ${ep.title}
      </button>
    `).join("");
  }

  function wire() {
    list.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;

      const src = btn.dataset.src;
      player.src = src;
      player.play();
    });
  }

  function init() {
    render();
    wire();
  }

  init();

})();
