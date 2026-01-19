import { auth, provider, db } from './firebase-config.js';
import { signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { term } from './terminal.js';
import { state, loadTasksFromCloud, setCloudSaver } from './state.js';
import { applyTheme } from './theme.js';

let currentUser = null;

// Hook up state saver
setCloudSaver(() => {
    if (currentUser) saveUserData(currentUser);
});

export function initAuth() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
        } else {
            currentUser = null;
        }
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
        term.writeln(`[SYSTEM]: Authentication successful. Identity: ${user.email}`);
        await loadUserData(user);
    } catch (error) {
        term.writeln(`[ERROR]: Login failed. ${error.message}`);
    }
}

export async function logoutUser() {
    try {
        await signOut(auth);
        currentUser = null;
        term.writeln('[SYSTEM]: Disconnected from cloud. Returning to local mode.');
    } catch (error) {
        term.writeln(`[ERROR]: Logout failed. ${error.message}`);
    }
}

async function loadUserData(user) {
    try {
        term.writeln('[SYSTEM]: Syncing cognitive data...');
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            loadTasksFromCloud(data);
            if (data.theme) applyTheme(data.theme);
            term.writeln(`[INFO]: Loaded ${data.tasks ? data.tasks.length : 0} tasks from cloud.`);
        } else {
            term.writeln('[SYSTEM]: Creating new cloud profile from local data...');
            await saveUserData(user);
        }
    } catch (error) {
        term.writeln(`[ERROR]: Cloud sync failed. ${error.message}`);
    }
}

export async function saveUserData(user) {
    if (!user) return;
    try {
        await setDoc(doc(db, "users", user.uid), {
            tasks: state.tasks,
            theme: state.currentTheme,
            totalCompleted: state.totalCompleted,
            lastUpdated: new Date()
        });
    } catch (error) {
        console.error("Error saving to cloud:", error);
    }
}
