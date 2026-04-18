console.log("🙏 prayerStore.dev.js loaded");

function listenForPrayers(callback) {
  if (typeof db === "undefined") {
    console.error("❌ db is not defined");
    return () => {};
  }

  if (
    typeof collection === "undefined" ||
    typeof onSnapshot === "undefined" ||
    typeof query === "undefined" ||
    typeof orderBy === "undefined"
  ) {
    console.error("❌ Firestore helpers are not available globally");
    return () => {};
  }

  const prayersCollectionRef = collection(db, "prayers");
  const orderedPrayersQuery = query(prayersCollectionRef, orderBy("createdAt", "desc"));

  const unsubscribe = onSnapshot(
    orderedPrayersQuery,
    (querySnapshot) => {
      querySnapshot.docChanges().forEach((change) => {
        const prayerData = {
          id: change.doc.id,
          type: change.type
        };

        if (change.type === "added" || change.type === "modified") {
          prayerData.data = change.doc.data();
        }

        callback(prayerData);
      });
    },
    (error) => {
      console.error("Error listening for prayers:", error);
    }
  );

  return unsubscribe;
}

window.listenForPrayers = listenForPrayers;
