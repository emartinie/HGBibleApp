(function () {

  // =========================================================
  // 📦 DOM REFERENCES (core bindings)
  // =========================================================

  const NT_BASE = "cards/nt.html";
  const root = document.getElementById("nt-root");

  const params = new URLSearchParams(window.location.search);

  const book = params.get("book");
  const chapter = params.get("chapter");
  const view = params.get("view");
  const section = params.get("section");

  // =========================================================
  // 🧰 HELPERS
  // =========================================================

  function getParams() {
    const params = new URLSearchParams(window.location.search);

    return {
      book: params.get("book"),
      chapter: params.get("chapter"),
      view: params.get("view"),
      section: params.get("section")
    };
  }

  function escapeHtml(str = "") {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function copyToClipboard(text) {
    if (!text) return;

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.write
