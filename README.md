# The Zen Terminal v2.1

A minimalist task manager inspired by retro terminal aesthetics and the philosophy of Deep Work. The application provides a "zen" environment for organizing thoughts without distractions. Now available as an installable desktop application.

## Functionality

The Zen Terminal operates as a web-based command-line simulation. All interactions take place via text commands.

### Key Features

*   **Authentic Experience:** Built on `xterm.js` with retro visuals and CRT effects.
*   **Progressive Web App (PWA):** Installable as a native-like desktop application with offline support.
*   **Cloud Sync:** Securely synchronize your tasks and settings across devices using Google Identity Services and Firebase.
*   **Focus & Break Modes:** Optimized for Deep Work with Matrix concentration mode and a Breathing exercise mode for breaks.
*   **Visual Themes:** Switch between classic **Green**, **Amber**, and **Cyan** color schemes.
*   **Command History:** Navigate through previous commands using Up/Down arrows (synced to cloud).
*   **Data Persistence:** Automatic local saving (LocalStorage) with manual Cloud sync.
*   **Batch Actions:** Support for adding multiple tasks at once.
*   **Tagging System:** Organize tasks with `@tags` and filter them easily.

## Installation (Desktop App)

To install Zen Terminal as a standalone application:
1.  Open the site in a Chromium-based browser (Chrome, Edge, Brave) or Safari.
2.  Click the **"Install"** icon in the address bar (or select "Install Zen Terminal" from the browser menu).
3.  The app will launch in its own window and integrate with your OS dock/taskbar.

## Commands

The following commands are available to control the application:

### Task Management

*   **`add [text] [@tag]`**
    *   Adds a new task.
    *   Supports tags for organization (e.g., `@work`, `@home`).
    *   Supports adding multiple tasks at once, separated by a semicolon.
    *   *Example:* `add Buy milk @home; Finish report @work`

*   **`list`**
    *   Displays a list of all tasks.
    *   **`list @tag`**: Filters tasks by a specific tag.
    *   **`list tags`**: Shows a list of all currently active tags.

*   **`done [id]`**
    *   Marks a task as completed (releases dopamine).
    *   *Example:* `done 1`

*   **`rm [id]`, `rm all` or `rm done`**
    *   Deletes a specific task, the entire list, or **only completed tasks**.
    *   The list is automatically renumbered after deletion.

*   **`undo`**
    *   Reverts the last change (a lifesaver for accidentally deleted tasks).

### Productivity & Visuals

*   **`focus [minutes] [optional_task_id]`**
    *   Starts Deep Work mode.
    *   The entire screen switches to the **Matrix effect**.
    *   Default: 25 minutes.
    *   Exit the mode by pressing **`q`** or **`Esc`**.
    *   *Example:* `focus` or `focus 45 1`

*   **`break [minutes]`**
    *   Starts a Breathing Break session.
    *   Visual animation to guide your breathing rhythm.
    *   Default: 5 minutes.
    *   Exit the mode by pressing **`q`** or **`Esc`**.
    *   *Example:* `break` or `break 2`

*   **`theme [name]`**
    *   Changes the color scheme.
    *   Typing just `theme` launches an interactive menu (select with arrows).
    *   Available colors: `green`, `amber`, `cyan`.
    *   *Example:* `theme amber`

*   **`sound [on/off]`**
    *   Toggles sound effects (typing sounds, task completion).
    *   *Example:* `sound on`

*   **`stats`**
    *   Displays the total number of completed tasks (long-term statistics).

*   **`review`**
    *   Provides a 24-hour retrospective.
    *   Shows all tasks completed in the last 24 hours, even if they were archived via `rm done`.
    *   *Example:* `review`

### Cloud & Data

*   **`login`**
    *   Initiates Google Login and connects to the cloud.

*   **`logout`**
    *   Disconnects from the cloud and returns to local mode.

*   **`sync`**
    *   Manually saves your data to the cloud.
    *   Use this after making changes you want to persist across devices.
    *   Data is also automatically synced when closing the browser tab.
    *   *Example:* `sync`

*   **`whoami`**
    *   Displays information about the currently logged-in user.

### Other

*   **`clear`**
    *   Clears the terminal screen.

*   **`help`**
    *   Displays a quick overview of commands.

## Keyboard Shortcuts

*   **Tab:** Command autocomplete (supports commands, tags, and arguments).
*   **Arrow Up / Down:** Navigate command history.
*   **Arrows (in Theme menu):** Select theme.
*   **q / Esc:** Exit Focus/Break mode or Theme selection.
