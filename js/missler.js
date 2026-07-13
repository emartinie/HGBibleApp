(function () {
  const teachers = [
    {
      id: "chuck-missler",
      enabled: true,
      name: "Dr. Chuck Missler",
      archiveTitle: "Explore the Chuck Missler Archive",
      orientation: "This card gathers archived teaching for visitors who want to explore Missler’s biblical studies in an organized place. Listen thoughtfully and compare every teaching with the text of Scripture.",
      seriesTitle: "Learn the Bible in 24 Hours - the best whole overview ever taught",
      attribution: "Teaching by Chuck Missler – Koinonia House; A complete overview of Scripture from Genesis to Revelation in 24 hours.",
      description: "Chuck is one of my most beloved and respected teachers of my entire life. Find out why...",
      iframeTitle: "Chuck Missler – Learn the Bible in 24 Hours",
      initialVideoIndex: 23,
      videos: [
        { title: "Hour 1", youtubeId: "PZ3hESj__M8" },
        { title: "Hour 2", youtubeId: "0Jd3crAKC3M" },
        { title: "Hour 3", youtubeId: "0syohVIkDHc" },
        { title: "Hour 4", youtubeId: "4NWuM8aRuzE" },
        { title: "Hour 5", youtubeId: "S4mZushkYFE" },
        { title: "Hour 6", youtubeId: "bjjA-FDFmXQ" },
        { title: "Hour 7", youtubeId: "N3WCH5Xmqk8" },
        { title: "Hour 8", youtubeId: "qxk9KNhnjC4" },
        { title: "Hour 9", youtubeId: "o8AXk-zW-nQ" },
        { title: "Hour 10", youtubeId: "5YHHF9QfmF4" },
        { title: "Hour 11", youtubeId: "jwxppukQDLg" },
        { title: "Hour 12", youtubeId: "ZN-Yvhhix2o" },
        { title: "Hour 13", youtubeId: "Ud6pJaLLA8w" },
        { title: "Hour 14", youtubeId: "ZzDUjROQCEg" },
        { title: "Hour 15", youtubeId: "i9wAIjxBZtY" },
        { title: "Hour 16", youtubeId: "qZdPWmrV_ls" },
        { title: "Hour 17", youtubeId: "bgCA70Z1Y7g" },
        { title: "Hour 18", youtubeId: "NDnF08u_z64" },
        { title: "Hour 19", youtubeId: "ddS5ewO9Nys" },
        { title: "Hour 20", youtubeId: "Kron8S_h0Ds" },
        { title: "Hour 21", youtubeId: "qgv9-TN9F38" },
        { title: "Hour 22", youtubeId: "rB5tho_piro" },
        { title: "Hour 23", youtubeId: "kmBLLg_z_Wk" },
        { title: "Hour 24", youtubeId: "cM72PmSIURc" }
      ]
    },

    // Release 1 placeholders. These are intentionally not rendered until
    // approved names, descriptions, attributions, and embeddable video IDs exist.
    {
      id: "brad-scott",
      enabled: true,
      name: "Brad Scott - WildBranch Ministry",
      archiveTitle: "There IS a creator",
      orientation: "This card gathers archived teaching for visitors who want to explore ’s biblical studies in an organized place. Listen thoughtfully and compare every teaching with the text of Scripture.",
      seriesTitle: "God's Learning Channel Series",
      attribution: "Teaching by Brad Scott. He is no longer available to conduct seminars, lead praise and worship, perform Passover seders, etc. He passed away 10 July 2020. May he rest in peace.",
      iframeTitle: "Brad Scott - WildBranch Ministry",
      initialVideoIndex: 23,
      videos: [
        { title: "There is a creator-Hour 1", youtubeId: "_fG7KsbPqJc" },
        { title: "There is a creator-Hour 2", youtubeId: "SYjiYvWIpAk" },
        { title: "Hour 3", youtubeId: "0syohVIkDHc" },
        { title: "Hour 4", youtubeId: "4NWuM8aRuzE" },
        { title: "Hour 5", youtubeId: "S4mZushkYFE" },
        { title: "Hour 6", youtubeId: "bjjA-FDFmXQ" },
        { title: "Hour 7", youtubeId: "N3WCH5Xmqk8" },
        { title: "Hour 8", youtubeId: "qxk9KNhnjC4" },
        { title: "Hour 9", youtubeId: "o8AXk-zW-nQ" },
        { title: "Hour 10", youtubeId: "5YHHF9QfmF4" },
        { title: "Hour 11", youtubeId: "jwxppukQDLg" },
        { title: "Hour 12", youtubeId: "ZN-Yvhhix2o" },
        { title: "Hour 13", youtubeId: "Ud6pJaLLA8w" },
        { title: "Hour 14", youtubeId: "ZzDUjROQCEg" },
        { title: "Hour 15", youtubeId: "i9wAIjxBZtY" },
        { title: "Hour 16", youtubeId: "qZdPWmrV_ls" },
        { title: "Hour 17", youtubeId: "bgCA70Z1Y7g" },
        { title: "Hour 18", youtubeId: "NDnF08u_z64" },
        { title: "Hour 19", youtubeId: "ddS5ewO9Nys" },
        { title: "Hour 20", youtubeId: "Kron8S_h0Ds" },
        { title: "Hour 21", youtubeId: "qgv9-TN9F38" },
        { title: "Hour 22", youtubeId: "rB5tho_piro" },
        { title: "Hour 23", youtubeId: "kmBLLg_z_Wk" },
        { title: "There is a creator-Hour 1", youtubeId: "_fG7KsbPqJc" },
      ]
    },
    { id: "teacher-03", enabled: false, placeholder: true },
    { id: "teacher-04", enabled: false, placeholder: true },
    { id: "teacher-05", enabled: false, placeholder: true },
    { id: "teacher-06", enabled: false, placeholder: true },
    { id: "teacher-07", enabled: false, placeholder: true },
    { id: "teacher-08", enabled: false, placeholder: true },
    { id: "teacher-09", enabled: false, placeholder: true },
    { id: "teacher-10", enabled: false, placeholder: true },
    { id: "teacher-11", enabled: false, placeholder: true }
  ];

  let selectedTeacherId = "chuck-missler";

  function getScope(root) {
    return root && typeof root.querySelector === "function" ? root : document;
  }

  function getDom(root) {
    const scope = getScope(root);
    return {
      archiveTitle: scope.querySelector("#teacherArchiveTitle"),
      orientation: scope.querySelector("#teacherOrientation"),
      seriesTitle: scope.querySelector("#teacherSeriesTitle"),
      attribution: scope.querySelector("#teacherAttribution"),
      teacherName: scope.querySelector("#teacherName"),
      description: scope.querySelector("#teacherDescription"),
      player: scope.querySelector("#misslerPlayer"),
      carousel: scope.querySelector("#misslerCarousel"),
      selector: scope.querySelector("#teacherSelector"),
      selectorStatus: scope.querySelector("#teacherSelectorStatus")
    };
  }

  function getEnabledTeachers() {
    return teachers.filter(teacher => teacher.enabled && Array.isArray(teacher.videos) && teacher.videos.length);
  }

  function getTeacher(teacherId) {
    return getEnabledTeachers().find(teacher => teacher.id === teacherId) || null;
  }

  function loadVideo(teacher, videoIndex, root) {
    const { player } = getDom(root);
    const video = teacher && teacher.videos ? teacher.videos[videoIndex] : null;

    if (!player || !video) return;

    player.src = `https://www.youtube.com/embed/${video.youtubeId}?rel=0&autoplay=0`;
    player.title = `${teacher.name} – ${video.title}`;
    player.dataset.teacherId = teacher.id;
    player.dataset.videoIndex = String(videoIndex);
  }

  function renderPlaylist(teacher, root) {
    const { carousel } = getDom(root);
    if (!carousel) return;

    carousel.innerHTML = "";

    teacher.videos.forEach((video, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "shrink-0 rounded focus:outline-none focus:ring-2 focus:ring-amber-300";
      button.title = video.title;
      button.setAttribute("aria-label", `Play ${video.title} by ${teacher.name}`);

      const image = document.createElement("img");
      image.src = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
      image.alt = `${teacher.name}: ${video.title}`;
      image.className = "w-24 h-14 rounded cursor-pointer hover:scale-105 transition-transform";

      const label = document.createElement("span");
      label.className = "block text-xs text-center mt-1 text-slate-300";
      label.textContent = video.title;

      button.append(image, label);
      button.addEventListener("click", () => loadVideo(teacher, index, root));
      carousel.appendChild(button);
    });
  }

  function updateTeacherButtons(root) {
    const { selector } = getDom(root);
    if (!selector) return;

    selector.querySelectorAll("button[data-teacher-id]").forEach(button => {
      const isSelected = button.dataset.teacherId === selectedTeacherId;
      button.setAttribute("aria-pressed", String(isSelected));
      button.classList.toggle("bg-amber-300", isSelected);
      button.classList.toggle("text-slate-950", isSelected);
      button.classList.toggle("bg-slate-800", !isSelected);
      button.classList.toggle("text-slate-100", !isSelected);
    });
  }

  function renderTeacherButtons(root) {
    const { selector, selectorStatus } = getDom(root);
    if (!selector) return;

    const enabledTeachers = getEnabledTeachers();
    selector.innerHTML = "";

    enabledTeachers.forEach(teacher => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.teacherId = teacher.id;
      button.className = "px-4 py-2 rounded text-left hover:bg-slate-700 transition";
      button.textContent = teacher.name;
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", () => selectTeacher(teacher.id, root));
      selector.appendChild(button);
    });

    if (selectorStatus) {
      selectorStatus.textContent = enabledTeachers.length > 1
        ? "Choose a teacher. Each selection uses the same player and teaching carousel."
        : "Additional teachers will appear here as their teaching selections are approved.";
    }

    updateTeacherButtons(root);
  }

  function selectTeacher(teacherId, root = document) {
    const teacher = getTeacher(teacherId);
    if (!teacher) return;

    selectedTeacherId = teacher.id;

    const {
      archiveTitle,
      orientation,
      seriesTitle,
      attribution,
      teacherName,
      description,
      player
    } = getDom(root);

    if (archiveTitle) archiveTitle.textContent = teacher.archiveTitle;
    if (orientation) orientation.textContent = teacher.orientation;
    if (seriesTitle) seriesTitle.textContent = teacher.seriesTitle;
    if (attribution) attribution.textContent = teacher.attribution;
    if (teacherName) teacherName.textContent = teacher.name;
    if (description) description.textContent = teacher.description;
    if (player) player.title = teacher.iframeTitle;

    renderPlaylist(teacher, root);
    updateTeacherButtons(root);

    const initialVideoIndex = Number.isInteger(teacher.initialVideoIndex)
      ? teacher.initialVideoIndex
      : 0;

    loadVideo(teacher, initialVideoIndex, root);
  }

  window.initMissler = function initMissler(root = document) {
    const { player, carousel, selector } = getDom(root);
    if (!player || !carousel || !selector) return;

    selectedTeacherId = "chuck-missler";
    renderTeacherButtons(root);
    selectTeacher(selectedTeacherId, root);
  };

  window.destroyMissler = function destroyMissler(root = document) {
    const { player, carousel, selector } = getDom(root);

    if (player) {
      player.src = "";
      delete player.dataset.teacherId;
      delete player.dataset.videoIndex;
    }

    if (carousel) carousel.innerHTML = "";
    if (selector) selector.innerHTML = "";

    selectedTeacherId = "chuck-missler";
  };
})();
