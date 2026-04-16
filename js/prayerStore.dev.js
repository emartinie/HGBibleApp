// prayerStore.dev.js
import { db } from "./firebase-init.dev.js"; // Assuming this path is correct and no circular dependency
import { collection, onSnapshot, query, orderBy }
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"; // Use 10.7.1 for consistency

console.log("🙏 prayerStore.dev.js loaded");

// Define your collection reference and potentially a query
const prayersCollectionRef = collection(db, "prayers");
const orderedPrayersQuery = query(prayersCollectionRef, orderBy("createdAt", "desc")); // Assuming 'timestamp' field exists

/**
 * Sets up a real-time listener for prayer documents and calls a callback for each change.
 * @param {(change: { id: string, type: 'added' | 'modified' | 'removed', data?: any }) => void} callback
 *        A function to be called for each document change.
 *        'data' will be present for 'added' and 'modified' types.
 * @returns {() => void} A function to unsubscribe from the listener.
 */
export function listenForPrayers(callback) {
  const unsubscribe = onSnapshot(orderedPrayersQuery, (querySnapshot) => {
    querySnapshot.docChanges().forEach((change) => {
      const prayerData = {
        id: change.doc.id,
        type: change.type,
      };

      // Only add data for 'added' and 'modified' types
      if (change.type === "added" || change.type === "modified") {
        prayerData.data = change.doc.data();
      }

      callback(prayerData); // Pass the structured change object
    });
  }, (error) => {
    console.error("Error listening for prayers:", error);
    // You might want to pass error info to the callback too, or handle it differently
  });

  return unsubscribe; // Crucially, return the unsubscribe function
}
