 
  const ORIGINS_INFO = {
    overview: {
      title: "Origins Overview",
      content: `
        <p>This card brings different perspectives to the same table.</p>
        <p>It is designed to help people explore one of humanity's oldest questions without pressure.</p>
      `
    },

    creation: {
      title: "Creation / Design Perspective",
      content: `
        <p>This view sees the universe, life, and humanity as intentional rather than accidental.</p>
        <p>Many who hold this perspective see order, beauty, consciousness, morality, and meaning as signs of a Creator.</p>
        <p>In Biblical tradition, creation is not only about origin, but about purpose and relationship.</p>
      `
    },

    natural: {
      title: "Natural Processes Perspective",
      content: `
        <p>This view explains the universe and life through natural processes that can be observed, modeled, and tested.</p>
        <p>It often includes cosmology, geology, biology, and evolution as part of a coherent explanation of origins.</p>
        <p>Its strength is in explaining mechanisms and processes over time.</p>
      `
    },

    bridge: {
      title: "A Shared Question",
      content: `
        <p>Science and faith are often treated like enemies, but many people experience them as addressing different dimensions of reality.</p>
        <p>Science often asks how. Faith often asks why.</p>
        <p>This card makes room for both questions without forcing a conclusion.</p>
      `
    },

    reflection: {
      title: "Reflection",
      content: `
        <p>What has shaped your view of origins most deeply?</p>
        <p>Family? Faith? Science? Personal experience? Doubt? Wonder?</p>
        <p>What kind of world makes the most sense of the life you have actually lived?</p>
      `
    }
  };

  function openOriginsInfo(key) {
    const item = ORIGINS_INFO[key];
    if (!item) return;
    openMiniModal(item.title, item.content);
  }

  function goDeeperOrigins() {
    // Swap this out later for your full modal / Dock C content load
    openMiniModal(
      "Go Deeper",
      `
      <p>This is where longer reading, audio, scripture, articles, or study content can open later.</p>
      <p>For now, this button marks the path from quick overview into deeper exploration.</p>
      `
    );
  }

  window.openOriginsInfo = openOriginsInfo;
  window.goDeeperOrigins = goDeeperOrigins;
 
