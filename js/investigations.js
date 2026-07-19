import { db, auth } from "./firebase-init.js";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  serverTimestamp,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  GoogleAuthProvider,
  linkWithPopup,
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const INVESTIGATIONS = [
  { title: "Trust Over Agreement #000", file: "why-trust-matters-more-than-agreement.html" },
  { title: "Where Did the Sabbath Go? #001", file: "where_did_the_sabbath_go.html" },
  { title: "Who was Paul, or Rabbi Shaul? #002", file: "who-was-paul-or-rabbi-shaul-investigation-v1.html" },
  { title: "Was Jesus born September 11th? #003", file: "was-yeshua-born-september-11-3-bc.html" },
  { title: "Was Clean and Unclean Food Changed? #004", file: "investigating-food-laws.html" },
  { title: "Did the Creator leave His fingerprint in the Torah? #005", file: "equidistant-letter-sequences-in-the-torah.html" },
  { title: "Is the Son the Father? #006", file: "is-the-son-the-father.html" },
  { title: "Messiah 2030: Claims, Evidence, and Method correct? #007", file: "messiah-2030-claims-evidence-and-method.html" },
  { title: "What Should All Biblical Believers Be Called? #008", file: "what-should-all-biblical-believers-be-called.html" },
  { title: "The Genesis 5 Gospel in the Names Claim? #009", file: "genesis-5-gospel-in-the-names-claim.html" },
  { title: "Biblical References to Non-Canonical and Lost Sources? #010", file: "biblical-references-to-non-canonical-and-lost-sources.html" },
  { title: "Non-Canonical Sources Quoted or Echoed in the New Testament? #011", file: "non-canonical-sources-quoted-or-echoed-in-the-new-testament.html" },
  { title: "Testing Prophetic Claims #012", file: "testing-prophetic-claims.html" },
  { title: "The Continuity of Progressive Revelation #013", file: "continuity-of-progressive-revelation.html" }
];

const PAGE_SIZE = 40;
let activeController = null;
let authUnsubscribe = null;
let backlog = null;
let filteredTopics = [];
let visibleTopicCount = PAGE_SIZE;
let ballot = null;
let currentVoteIds = new Set();
let activeRoot = null;
let publishedSearchIndex = null;
let publishedSearchPromise = null;
let publishedSearchRequest = 0;
let suggestionLoadRequest = 0;

function el(id) { return activeRoot?.querySelector(`#${id}`) || null; }
function setMessage(id, text) { const node = el(id); if (node) node.textContent = text; }

function renderPublishedMatches(matches) {
  const list = el("investigationList");
  if (!list) return;
  list.replaceChildren();
  if (!matches.length) {
    const empty = document.createElement("div");
    empty.className = "hg-empty";
    empty.textContent = "No investigations match your search.";
    list.append(empty);
    return;
  }
  matches.forEach(item => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ui-btn w-full text-left";
    button.dataset.file = item.file;
    button.textContent = item.title;
    list.append(button);
  });
}

function renderPublishedStatus(message) {
  const list = el("investigationList");
  if (!list) return;
  const status = document.createElement("div");
  status.className = "hg-empty";
  status.textContent = message;
  list.replaceChildren(status);
}

async function buildPublishedSearchIndex() {
  if (publishedSearchIndex) return publishedSearchIndex;
  if (publishedSearchPromise) return publishedSearchPromise;

  publishedSearchPromise = Promise.all(INVESTIGATIONS.map(async investigation => {
    let content = "";
    try {
      const response = await fetch(`investigations/${investigation.file}`, {
        signal: activeController?.signal
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const documentHtml = await response.text();
      const parsed = new DOMParser().parseFromString(documentHtml, "text/html");
      parsed.querySelectorAll("script, style, noscript, template").forEach(node => node.remove());
      content = parsed.body?.textContent || "";
    } catch (error) {
      if (error.name === "AbortError") throw error;
      console.warn("Investigation search indexing failed", investigation.file, error);
    }

    return {
      ...investigation,
      searchableText: `${investigation.title} ${content}`
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase()
    };
  })).then(index => {
    publishedSearchIndex = index;
    return index;
  }).finally(() => {
    publishedSearchPromise = null;
  });

  return publishedSearchPromise;
}

async function searchPublishedInvestigations(query = "") {
  const normalized = query.trim().toLowerCase();
  const requestId = ++publishedSearchRequest;

  if (!normalized) {
    renderPublishedMatches(INVESTIGATIONS);
    return;
  }

  if (!publishedSearchIndex) {
    renderPublishedStatus("Searching titles and investigation contents...");
  }

  try {
    const index = await buildPublishedSearchIndex();
    if (requestId !== publishedSearchRequest || !activeRoot) return;
    renderPublishedMatches(index.filter(item => item.searchableText.includes(normalized)));
  } catch (error) {
    if (error.name !== "AbortError" && requestId === publishedSearchRequest) {
      renderPublishedMatches(INVESTIGATIONS.filter(item => item.title.toLowerCase().includes(normalized)));
    }
  }
}

async function loadInvestigation(file) {
  const viewer = el("investigationViewer");
  if (!viewer) return;
  const [fileName, anchor = ""] = String(file || "").split("#", 2);
  viewer.textContent = "Loading...";
  try {
    const response = await fetch(`investigations/${fileName}`, { signal: activeController?.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    viewer.innerHTML = await response.text();
    if (anchor) {
      Array.from(viewer.querySelectorAll("[id]")).find(node => node.id === anchor)?.scrollIntoView({ block: "start" });
    } else {
      viewer.scrollTop = 0;
    }
  } catch (error) {
    if (error.name !== "AbortError") viewer.textContent = "Investigation could not be loaded.";
  }
}

function selectView(view) {
  activeRoot?.querySelectorAll("[data-investigation-view]").forEach(button => {
    button.classList.toggle("active", button.dataset.investigationView === view);
  });
  activeRoot?.querySelectorAll("[data-investigation-panel]").forEach(panel => {
    panel.hidden = panel.dataset.investigationPanel !== view;
  });
  if (view === "backlog") loadBacklog();
  if (view === "vote") {
    loadBallot();
    updateSuggestionControls(auth.currentUser);
    if (isGoogleUser(auth.currentUser)) loadOwnSuggestions(auth.currentUser);
  }
}

async function loadBacklog() {
  if (backlog) { applyBacklogFilters(); return; }
  setMessage("topicBacklogSummary", "Loading the research backlog...");
  try {
    const response = await fetch("investigations/topics/content-backlog.json", { signal: activeController?.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    backlog = await response.json();
    const categories = [...new Set(backlog.topics.map(topic => topic.category).filter(Boolean))].sort();
    const select = el("topicBacklogCategory");
    categories.forEach(category => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      select?.append(option);
    });
    applyBacklogFilters();
  } catch (error) {
    if (error.name !== "AbortError") setMessage("topicBacklogSummary", "The research backlog could not be loaded.");
  }
}

function applyBacklogFilters() {
  if (!backlog) return;
  const query = String(el("topicBacklogSearch")?.value || "").trim().toLowerCase();
  const category = el("topicBacklogCategory")?.value || "";
  filteredTopics = backlog.topics.filter(topic => {
    const haystack = `${topic.id} ${topic.title} ${topic.category || ""} ${topic.subcategory || ""}`.toLowerCase();
    return (!query || haystack.includes(query)) && (!category || topic.category === category);
  });
  visibleTopicCount = PAGE_SIZE;
  renderBacklog();
}

function renderBacklog() {
  const list = el("topicBacklogList");
  const more = el("topicBacklogMore");
  if (!list || !more) return;
  list.replaceChildren();
  filteredTopics.slice(0, visibleTopicCount).forEach(topic => {
    const card = document.createElement("article");
    card.className = "topic-card";
    const meta = document.createElement("div");
    meta.className = "topic-meta";
    meta.textContent = `${topic.id}  |  ${topic.category || "Uncategorized"}`;
    const title = document.createElement("h3");
    title.className = "font-semibold text-slate-100 mt-1";
    title.textContent = topic.title;
    const status = document.createElement("div");
    status.className = "topic-meta mt-2";
    status.textContent = `Status: ${topic.status || "candidate"}`;
    card.append(meta, title, status);
    list.append(card);
  });
  setMessage("topicBacklogSummary", `${filteredTopics.length.toLocaleString()} topic${filteredTopics.length === 1 ? "" : "s"} found. Showing ${Math.min(visibleTopicCount, filteredTopics.length).toLocaleString()}.`);
  more.hidden = visibleTopicCount >= filteredTopics.length;
}

function isGoogleUser(user) {
  return Boolean(user && !user.isAnonymous && user.providerData.some(provider => provider.providerId === "google.com"));
}

async function loadBallot() {
  if (ballot) { renderBallot(); return; }
  setMessage("investigationVoteStatus", "Checking for an open community ballot...");
  try {
    const snapshot = await getDoc(doc(db, "investigationBallots", "current"));
    if (!snapshot.exists() || snapshot.data().status !== "open") {
      setMessage("investigationVoteStatus", "No community ballot is open right now. Please explore the research backlog and check back later.");
      return;
    }
    ballot = snapshot.data();
    renderBallot();
    await loadOwnVote(auth.currentUser);
  } catch (error) {
    console.error("Ballot load failed", error);
    setMessage("investigationVoteStatus", "The community ballot is temporarily unavailable.");
  }
}

function renderBallot() {
  if (!ballot) return;
  const options = el("investigationVoteOptions");
  const actions = el("investigationVoteActions");
  if (!options || !actions) return;
  setMessage("investigationVoteStatus", `${ballot.title || "Help choose the next investigation"}  -  select up to ${ballot.maxSelections}.`);
  options.replaceChildren();
  (ballot.candidates || []).forEach(candidate => {
    const label = document.createElement("label");
    label.className = "topic-card vote-option";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = candidate.id;
    checkbox.checked = currentVoteIds.has(candidate.id);
    checkbox.dataset.voteTopic = candidate.id;
    const text = document.createElement("span");
    const title = document.createElement("strong");
    title.textContent = candidate.title;
    const meta = document.createElement("small");
    meta.className = "topic-meta block mt-1";
    meta.textContent = `${candidate.id}  |  ${candidate.category || "Research candidate"}`;
    text.append(title, meta);
    label.append(checkbox, text);
    options.append(label);
  });
  actions.hidden = false;
  updateAuthControls(auth.currentUser);
}

async function loadOwnVote(user) {
  currentVoteIds = new Set();
  if (!ballot || !isGoogleUser(user)) { renderBallot(); return; }
  try {
    const snapshot = await getDoc(doc(db, "investigationVotes", ballot.ballotId, "users", user.uid));
    if (snapshot.exists()) currentVoteIds = new Set(snapshot.data().topicIds || []);
    renderBallot();
    setMessage("investigationVoteMessage", snapshot.exists() ? "Your saved choices are shown." : "You have not voted in this ballot yet.");
  } catch (error) {
    console.error("Vote load failed", error);
    setMessage("investigationVoteMessage", "Your saved choices could not be loaded.");
  }
}

function updateAuthControls(user) {
  const signIn = el("investigationSignInBtn");
  const save = el("investigationSaveVoteBtn");
  const signOutButton = el("investigationSignOutBtn");
  const googleUser = isGoogleUser(user);
  if (signIn) signIn.hidden = googleUser;
  if (save) save.hidden = !googleUser;
  if (signOutButton) signOutButton.hidden = !googleUser;
  if (ballot && !googleUser) setMessage("investigationVoteMessage", "Browsing is public. Google sign-in is required only to save a vote.");
}

function updateSuggestionControls(user) {
  const signIn = el("investigationSuggestionSignInBtn");
  const signOutButton = el("investigationSuggestionSignOutBtn");
  const form = el("investigationSuggestionForm");
  const googleUser = isGoogleUser(user);
  if (signIn) signIn.hidden = googleUser;
  if (signOutButton) signOutButton.hidden = !googleUser;
  if (form) form.hidden = !googleUser;
  if (!googleUser) {
    setMessage("investigationSuggestionMessage", "Google sign-in is required to submit and view your private suggestions.");
    renderSuggestionListMessage("Sign in to view your private suggestions.");
  }
}

function renderSuggestionListMessage(message) {
  const list = el("investigationSuggestionList");
  if (!list) return;
  const state = document.createElement("div");
  state.className = "hg-empty";
  state.textContent = message;
  list.replaceChildren(state);
}

function formatSuggestionDate(value) {
  try {
    return value?.toDate?.().toLocaleDateString() || "Just submitted";
  } catch {
    return "Submitted";
  }
}

function renderSuggestions(suggestions) {
  const list = el("investigationSuggestionList");
  if (!list) return;
  list.replaceChildren();
  if (!suggestions.length) {
    renderSuggestionListMessage("You have not submitted any suggestions yet.");
    return;
  }

  suggestions.forEach(suggestion => {
    const card = document.createElement("article");
    card.className = "topic-card";

    const meta = document.createElement("div");
    meta.className = "topic-meta";
    meta.textContent = `${formatSuggestionDate(suggestion.createdAt)} | Status: ${suggestion.status || "submitted"}`;

    const title = document.createElement("h3");
    title.className = "font-semibold text-slate-100 mt-1";
    title.textContent = suggestion.topic;

    card.append(meta, title);

    if (suggestion.why) {
      const why = document.createElement("p");
      why.className = "text-sm text-slate-300 mt-2";
      why.textContent = suggestion.why;
      card.append(why);
    }

    if (suggestion.status === "submitted") {
      const withdraw = document.createElement("button");
      withdraw.type = "button";
      withdraw.className = "ui-btn mt-3";
      withdraw.dataset.withdrawSuggestion = suggestion.id;
      withdraw.textContent = "Withdraw suggestion";
      card.append(withdraw);
    }

    list.append(card);
  });
}

async function loadOwnSuggestions(user) {
  const requestId = ++suggestionLoadRequest;
  if (!isGoogleUser(user)) {
    renderSuggestionListMessage("Sign in to view your private suggestions.");
    return;
  }

  renderSuggestionListMessage("Loading your private suggestions...");
  try {
    const suggestionsQuery = query(
      collection(db, "investigationSuggestionUsers", user.uid, "suggestions"),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(suggestionsQuery);
    if (requestId !== suggestionLoadRequest || !activeRoot || auth.currentUser?.uid !== user.uid) return;
    renderSuggestions(snapshot.docs.map(item => ({ id: item.id, ...item.data() })));
  } catch (error) {
    console.error("Suggestion load failed", error);
    if (requestId === suggestionLoadRequest) renderSuggestionListMessage("Your private suggestions could not be loaded.");
  }
}

async function signInWithGoogle(messageId = "investigationVoteMessage") {
  setMessage(messageId, "Opening Google sign-in...");
  const provider = new GoogleAuthProvider();
  try {
    if (auth.currentUser?.isAnonymous) {
      await linkWithPopup(auth.currentUser, provider);
    } else {
      await signInWithPopup(auth, provider);
    }
  } catch (error) {
    if (error.code === "auth/credential-already-in-use" || error.code === "auth/email-already-in-use") {
      await signOut(auth);
      await signInWithPopup(auth, provider);
      return;
    }
    console.error("Google sign-in failed", error);
    setMessage(messageId, "Google sign-in was not completed. Please allow the sign-in window and try again.");
  }
}

function enforceVoteLimit(changedCheckbox) {
  if (!ballot || !changedCheckbox.checked) return;
  const selected = activeRoot.querySelectorAll("input[data-vote-topic]:checked");
  if (selected.length > ballot.maxSelections) {
    changedCheckbox.checked = false;
    setMessage("investigationVoteMessage", `Please select no more than ${ballot.maxSelections} topics.`);
  }
}

async function saveVote() {
  const user = auth.currentUser;
  if (!ballot || !isGoogleUser(user)) { await signInWithGoogle(); return; }
  const topicIds = Array.from(activeRoot.querySelectorAll("input[data-vote-topic]:checked"), input => input.value);
  if (!topicIds.length) { setMessage("investigationVoteMessage", "Select at least one topic before saving."); return; }
  if (topicIds.length > ballot.maxSelections) { setMessage("investigationVoteMessage", `Select no more than ${ballot.maxSelections} topics.`); return; }
  setMessage("investigationVoteMessage", "Saving your choices...");
  try {
    await setDoc(doc(db, "investigationVotes", ballot.ballotId, "users", user.uid), {
      uid: user.uid,
      ballotId: ballot.ballotId,
      topicIds,
      updatedAt: serverTimestamp()
    });
    currentVoteIds = new Set(topicIds);
    setMessage("investigationVoteMessage", "Your choices are saved. You may change them while this ballot remains open.");
  } catch (error) {
    console.error("Vote save failed", error);
    setMessage("investigationVoteMessage", "Your vote could not be saved. Please try again.");
  }
}

async function submitSuggestion(event) {
  event.preventDefault();
  const user = auth.currentUser;
  if (!isGoogleUser(user)) {
    await signInWithGoogle("investigationSuggestionMessage");
    return;
  }

  const topic = String(el("investigationSuggestionTopic")?.value || "").trim();
  const why = String(el("investigationSuggestionWhy")?.value || "").trim();
  const evidence = String(el("investigationSuggestionEvidence")?.value || "").trim();
  const context = String(el("investigationSuggestionContext")?.value || "").trim();
  if (!topic) {
    setMessage("investigationSuggestionMessage", "Please enter a proposed question or topic.");
    el("investigationSuggestionTopic")?.focus();
    return;
  }

  const submitButton = el("investigationSuggestionSubmitBtn");
  if (submitButton) submitButton.disabled = true;
  setMessage("investigationSuggestionMessage", "Submitting privately...");

  try {
    await addDoc(collection(db, "investigationSuggestionUsers", user.uid, "suggestions"), {
      uid: user.uid,
      topic,
      why,
      evidence,
      context,
      status: "submitted",
      createdAt: serverTimestamp()
    });
    el("investigationSuggestionForm")?.reset();
    setMessage("investigationSuggestionMessage", "Your private suggestion was submitted.");
    await loadOwnSuggestions(user);
  } catch (error) {
    console.error("Suggestion submit failed", error);
    setMessage("investigationSuggestionMessage", "Your suggestion could not be submitted. Please try again.");
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
}

async function withdrawSuggestion(suggestionId) {
  const user = auth.currentUser;
  if (!isGoogleUser(user) || !suggestionId) return;
  if (!window.confirm("Withdraw this suggestion? It will remain in your private submission history.")) return;

  setMessage("investigationSuggestionMessage", "Withdrawing suggestion...");
  try {
    await updateDoc(doc(db, "investigationSuggestionUsers", user.uid, "suggestions", suggestionId), {
      status: "withdrawn",
      withdrawnAt: serverTimestamp()
    });
    setMessage("investigationSuggestionMessage", "The suggestion was withdrawn.");
    await loadOwnSuggestions(user);
  } catch (error) {
    console.error("Suggestion withdrawal failed", error);
    setMessage("investigationSuggestionMessage", "The suggestion could not be withdrawn. Please try again.");
  }
}

async function initInvestigationsCard(root = document) {
  destroyInvestigationsCard();
  activeRoot = root && typeof root.querySelector === "function" ? root : document;
  if (!el("investigationList") || !el("investigationViewer")) return;
  activeController = new AbortController();
  const { signal } = activeController;
  searchPublishedInvestigations(el("investigationSearch")?.value || "");

  activeRoot.querySelectorAll("[data-investigation-view]").forEach(button => button.addEventListener("click", () => selectView(button.dataset.investigationView), { signal }));
  el("investigationSearch")?.addEventListener("input", event => searchPublishedInvestigations(event.target.value), { signal });
  el("investigationList")?.addEventListener("click", event => {
    const button = event.target.closest("button[data-file]");
    if (!button) return;
    el("investigationList").querySelectorAll("button").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    loadInvestigation(button.dataset.file);
  }, { signal });
  el("topicBacklogSearch")?.addEventListener("input", applyBacklogFilters, { signal });
  el("topicBacklogCategory")?.addEventListener("change", applyBacklogFilters, { signal });
  el("topicBacklogMore")?.addEventListener("click", () => { visibleTopicCount += PAGE_SIZE; renderBacklog(); }, { signal });
  el("investigationVoteOptions")?.addEventListener("change", event => { if (event.target.matches("input[data-vote-topic]")) enforceVoteLimit(event.target); }, { signal });
  el("investigationSignInBtn")?.addEventListener("click", () => signInWithGoogle(), { signal });
  el("investigationSaveVoteBtn")?.addEventListener("click", saveVote, { signal });
  el("investigationSignOutBtn")?.addEventListener("click", () => signOut(auth), { signal });
  el("investigationSuggestionSignInBtn")?.addEventListener("click", () => signInWithGoogle("investigationSuggestionMessage"), { signal });
  el("investigationSuggestionSignOutBtn")?.addEventListener("click", () => signOut(auth), { signal });
  el("investigationSuggestionForm")?.addEventListener("submit", submitSuggestion, { signal });
  el("investigationSuggestionList")?.addEventListener("click", event => {
    const button = event.target.closest("button[data-withdraw-suggestion]");
    if (button) withdrawSuggestion(button.dataset.withdrawSuggestion);
  }, { signal });

  authUnsubscribe = onAuthStateChanged(auth, user => {
    updateAuthControls(user);
    updateSuggestionControls(user);
    if (ballot) loadOwnVote(user);
    const suggestionPanel = activeRoot?.querySelector('[data-investigation-panel="vote"]');
    if (isGoogleUser(user) && suggestionPanel && !suggestionPanel.hidden) loadOwnSuggestions(user);
  });

  if (window.pendingInvestigationFile) {
    const pending = window.pendingInvestigationFile;
    const fileName = pending.split("#", 1)[0];
    await loadInvestigation(pending);
    Array.from(el("investigationList").querySelectorAll("button[data-file]")).find(item => item.dataset.file === fileName)?.classList.add("active");
    window.pendingInvestigationFile = null;
  }
}

function destroyInvestigationsCard() {
  activeController?.abort();
  authUnsubscribe?.();
  activeController = null;
  authUnsubscribe = null;
  activeRoot = null;
  ballot = null;
  currentVoteIds = new Set();
  suggestionLoadRequest += 1;
}

window.initInvestigationsCard = initInvestigationsCard;
window.destroyInvestigationsCard = destroyInvestigationsCard;

