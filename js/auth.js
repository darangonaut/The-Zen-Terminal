import { auth, provider, db } from './firebase-config.js';
import { signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, onSnapshot, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { term } from './terminal.js';
import { state, loadTasksFromCloud, updatePrompt, resetCloudState } from './state.js';
import { applyTheme } from './theme.js';

let currentUser = null;
let unsubscribeSnapshot = null;
let cloudDataResolver = null;
let cloudDataPromise = null;

// Manual sync only - no automatic cloud saves to reduce Firebase usage

// Create promise for waiting on initial cloud data
function createCloudDataPromise() {
    cloudDataPromise = new Promise((resolve) => {
        cloudDataResolver = resolve;
    });
}

// Wait for cloud data to be loaded (call this before showing UI if logged in)
export function waitForCloudData() {
    return cloudDataPromise || Promise.resolve();
}

export function initAuth() {
    // Create promise before auth check
    createCloudDataPromise();

    onAuthStateChanged(auth, async (user) => {
        updatePrompt(user);
        if (user) {
            currentUser = user;
            // Fetch cloud data immediately (one-time read)
            await fetchCloudDataOnce(user);
            // Then start listening for subsequent changes
            startCloudListener(user);
        } else {
            currentUser = null;
            resetCloudState();
            if (unsubscribeSnapshot) {
                unsubscribeSnapshot();
                unsubscribeSnapshot = null;
            }
            // Resolve promise for non-logged in users
            if (cloudDataResolver) {
                cloudDataResolver();
                cloudDataResolver = null;
            }
        }
    });
}

// One-time fetch of cloud data (used on initial load)
async function fetchCloudDataOnce(user) {
    try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            loadTasksFromCloud(data);
            if (data.theme) {
                applyTheme(data.theme);
            }
        }
        // Resolve the promise - cloud data is ready
        if (cloudDataResolver) {
            cloudDataResolver();
            cloudDataResolver = null;
        }
    } catch (error) {
        console.error("Error fetching cloud data:", error);
        // Resolve anyway to not block the app
        if (cloudDataResolver) {
            cloudDataResolver();
            cloudDataResolver = null;
        }
    }
}

function startCloudListener(user) {
    if (unsubscribeSnapshot) unsubscribeSnapshot();

    let isFirstSnapshot = true; // Skip first snapshot (we already fetched via getDoc)
    const docRef = doc(db, "users", user.uid);

    unsubscribeSnapshot = onSnapshot(docRef, (docSnap) => {
        // Skip first snapshot - we already loaded data via getDoc
        if (isFirstSnapshot) {
            isFirstSnapshot = false;
            return;
        }

        // Metadata change only (e.g., local write acknowledged) - skip
        if (docSnap.metadata.hasPendingWrites) return;

        if (docSnap.exists()) {
            const data = docSnap.data();
            loadTasksFromCloud(data);

            // Apply theme if changed from another device
            if (data.theme && data.theme !== state.currentTheme) {
                applyTheme(data.theme);
            }
        } else {
            // New user - first save will create the doc
            saveUserData(user);
        }
    }, (error) => {
        console.error("Cloud listener error:", error);
    });
}

export function getCurrentUser() {
    return currentUser;
}

// Manual sync function - call this explicitly to save to cloud
export async function manualSync() {
    if (!currentUser) {
        return { success: false, message: 'Not logged in. Use "login" first.' };
    }
    try {
        await saveUserData(currentUser);
        return { success: true, message: 'Data synced to cloud.' };
    } catch (error) {
        return { success: false, message: `Sync failed: ${error.message}` };
    }
}

export async function loginUser() {
    try {
        term.writeln('[SYSTEM]: Initiating secure connection with Google Identity Services...');
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        currentUser = user;
        updatePrompt(user);
        term.writeln(`[SYSTEM]: Authentication successful. Identity: ${user.email}`);
        term.write(`\r\n${state.prompt}`);
    } catch (error) {
        term.writeln(`[ERROR]: Login failed. ${error.message}`);
    }
}

export async function logoutUser() {
    try {
        if (unsubscribeSnapshot) {
            unsubscribeSnapshot();
            unsubscribeSnapshot = null;
        }
        await signOut(auth);
        currentUser = null;
        updatePrompt(null);
        term.writeln('[SYSTEM]: Disconnected from cloud. Returning to local mode.');
    } catch (error) {
        term.writeln(`[ERROR]: Logout failed. ${error.message}`);
    }
}

export async function saveUserData(user) {
    if (!user) return;
    try {
        await setDoc(doc(db, "users", user.uid), {
            tasks: state.tasks,
            archive: state.archive,
            theme: state.currentTheme,
            totalCompleted: state.totalCompleted,
            commandHistory: state.commandHistory,
            lastUpdated: new Date()
        });
    } catch (error) {
        console.error("Error saving to cloud:", error);
    }
}
