import { auth, provider, db } from './firebase-config.js';
import { signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, onSnapshot, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { term } from './terminal.js';
import { state, loadTasksFromCloud, setCloudSaver, updatePrompt } from './state.js';
import { applyTheme } from './theme.js';

let currentUser = null;
let unsubscribeSnapshot = null;

// Hook up state saver
setCloudSaver(() => {
    if (currentUser) saveUserData(currentUser);
});

export function initAuth() {
    onAuthStateChanged(auth, async (user) => {
        updatePrompt(user);
        if (user) {
            currentUser = user;
            // Start listening for cloud changes
            startCloudListener(user);
        } else {
            currentUser = null;
            if (unsubscribeSnapshot) {
                unsubscribeSnapshot();
                unsubscribeSnapshot = null;
            }
        }
    });
}

function startCloudListener(user) {
    if (unsubscribeSnapshot) unsubscribeSnapshot();

    const docRef = doc(db, "users", user.uid);
    unsubscribeSnapshot = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Optimization: Only update if cloud data is newer or different
            // Firestore metadata can help, but for now we just sync
            loadTasksFromCloud(data);
            
            // Optionally apply theme if changed from another device
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
