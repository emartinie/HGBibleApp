const ABOUT_SEEN_KEY = "hg-about-homegroups-seen-v1";

function hasSeenAbout() {
  try {
    return localStorage.getItem(ABOUT_SEEN_KEY) === "true";
  } catch {
    return false;
  }
}

function rememberAbout() {
  try {
    localStorage.setItem(ABOUT_SEEN_KEY, "true");
  } catch {
    // The introduction still works when storage is unavailable.
  }
}

function initAboutHomeGroups() {
  const dialog = document.getElementById("aboutHomeGroupsDialog");
  const openButton = document.getElementById("aboutHomeGroupsBtn");
  const closeButton = document.getElementById("aboutHomeGroupsClose");
  const enterButton = document.getElementById("aboutHomeGroupsEnter");

  if (!dialog || !openButton || !closeButton || !enterButton) return;

  function openAbout() {
    if (typeof dialog.showModal === "function") {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
    closeButton.focus();
  }

  function closeAbout() {
    rememberAbout();
    if (typeof dialog.close === "function") {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
    openButton.focus();
  }

  openButton.addEventListener("click", openAbout);
  closeButton.addEventListener("click", closeAbout);
  enterButton.addEventListener("click", closeAbout);
  dialog.addEventListener("click", event => {
    if (event.target === dialog) closeAbout();
  });
  dialog.addEventListener("cancel", rememberAbout);

  window.openAboutHomeGroups = openAbout;

  if (!hasSeenAbout()) {
    window.setTimeout(openAbout, 250);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAboutHomeGroups, { once: true });
} else {
  initAboutHomeGroups();
}

