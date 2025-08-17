function normalizeWeekData(data) {
  return {
    title: data.title || `Week ${data.week || "?"}`,
    intro: {
      summary: data.intro?.summary || "No summary available.",
      instructions: data.intro?.instructions || ""
    },
    sections: {
      audio_playlist: data.sections?.audio_playlist || [],
      chapter_outlines: data.sections?.chapter_outlines || {
        Torah: [], Prophets: [], Writings: [], Gospels: [], Letters: [], Revelation: []
      },
      commentary: data.sections?.commentary || { quote: "", content: "" },
      deeper_learning: data.sections?.deeper_learning || "",
      aleph_tav: data.sections?.aleph_tav || "",
      kids_study: data.sections?.kids_study || { videos: [], pdf: "" },
      language_learning: data.sections?.language_learning || { hebrew: {}, greek: {}, audio: "" }
      // add any other sections here
    }
  };
}
