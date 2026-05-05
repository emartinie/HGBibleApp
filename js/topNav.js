// topNav.js

document.addEventListener("DOMContentLoaded", () => {
  const topbar = document.querySelector(".card-topbar");
  if (!topbar) return;

  const buttons = topbar.querySelectorAll(".card-icon-btn");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      pulse(btn);
      handleAction(btn.title);
    });
  });

  function handleAction(action) {
    switch (action) {
      case "Home":
        goHome();
        break;

      case "Previous":
        history.back();
        break;

      case "Next":
        history.forward();
        break;

      case "Audio Guide":
        openMediaModal("audio");
        break;

      case "Video Walkthrough":
        openMediaModal("video");
        break;

      case "Search Card":
        openSearch();
        break;

      case "Bookmark":
        toggleBookmark();
        break;

      case "Share":
        sharePage();
        break;

      case "Notes":
        openNotes();
        break;

      case "Help":
        openHelp();
        break;
    }
  }

  function goHome() {
    window.location.href = "/";
    // or "/index.html" depending on your structure
  }

  function pulse(el) {
    el.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(0.9)" },
        { transform: "scale(1)" }
      ],
      {
        duration: 180,
        easing: "ease"
      }
    );
  }

  function openMediaModal(type) {
    createModal(`
      <h2>${type === "audio" ? "🎧 Audio Guide" : "▶ Video Walkthrough"}</h2>
      <p>Content coming soon.</p>
    `);
  }

  function openSearch() {
    createModal(`
      <h2>⌕ Search Card</h2>
      <input
        type="text"
        placeholder="Search this card..."
        style="
          width:100%;
          padding:12px;
          border-radius:12px;
          background:#0f172a;
          color:white;
          border:none;
          margin-top:1rem;
        "
      />
    `);
  }

  function toggleBookmark() {
    const saved = localStorage.getItem("bookmarked");
    localStorage.setItem("bookmarked", saved ? "" : "true");

    createToast(saved ? "Bookmark removed" : "Bookmarked");
  }

  async function sharePage() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          url: window.location.href
        });
      } catch {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      createToast("Link copied");
    }
  }

  function openNotes() {
    createModal(`
      <h2>✎ Notes</h2>
      <textarea
        style="
          width:100%;
          height:200px;
          padding:12px;
          border-radius:12px;
          background:#0f172a;
          color:white;
          border:none;
          margin-top:1rem;
        "
        placeholder="Write notes here..."
      ></textarea>
    `);
  }

  function openHelp() {
    createModal(`
      <h2>Help</h2>
      <p>This card contains tools, resources, and guided interactions.</p>
    `);
  }

  function createModal(content) {
    const existing = document.querySelector(".topnav-modal");
    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.className = "topnav-modal";
    modal.innerHTML = `
      <div class="topnav-modal-inner">
        <button class="close-modal">✕</button>
        ${content}
      </div>
    `;

    Object.assign(modal.style, {
      position: "fixed",
      inset: "0",
      background: "rgba(0,0,0,.6)",
      backdropFilter: "blur(6px)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: "99999",
      opacity: "0",
      transition: "opacity .2s ease"
    });

    document.body.appendChild(modal);

    requestAnimationFrame(() => {
      modal.style.opacity = "1";
    });

    modal.querySelector(".close-modal").onclick = () => {
      modal.style.opacity = "0";
      setTimeout(() => modal.remove(), 200);
    };

    const inner = modal.querySelector(".topnav-modal-inner");
    Object.assign(inner.style, {
      background: "#020617",
      color: "white",
      padding: "2rem",
      borderRadius: "20px",
      width: "min(500px, 90vw)",
      position: "relative",
      boxShadow: "0 20px 60px rgba(0,0,0,.5)"
    });
  }

  function createToast(message) {
    const toast = document.createElement("div");
    toast.textContent = message;

    Object.assign(toast.style, {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      background: "#0f172a",
      color: "white",
      padding: "12px 18px",
      borderRadius: "12px",
      zIndex: "99999",
      opacity: "0",
      transition: "all .2s ease"
    });

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(-8px)";
    });

    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 200);
    }, 1800);
  }
});
