# The Zen Terminal v1.0

A minimalist task manager inspired by retro terminal aesthetics and the philosophy of Deep Work. The application provides a "zen" environment for organizing thoughts without distractions.

## Functionality

The Zen Terminal operates as a web-based command-line simulation. All interactions take place via text commands.

### Key Features

*   **Authentic Experience:** Built on `xterm.js` with retro visuals.
*   **Cloud Sync:** Securely synchronize your tasks and settings across devices using Google Identity Services and Firebase.
*   **Focus Mode (Matrix):** A special concentration mode featuring falling characters (Matrix rain effect) and a countdown timer.
*   **Visual Themes:** Switch between classic **Green**, **Amber**, and **Cyan** color schemes.
*   **Command History:** Navigate through previous commands using Up/Down arrows.
*   **Data Persistence:** Automatic local saving (LocalStorage) with optional Cloud backup.
*   **Batch Actions:** Support for adding multiple tasks at once.
*   **Tagging System:** Organize tasks with `@tags` and filter them easily.

## Commands

The following commands are available to control the application:

### Task Management

*   **`do [text] [@tag]`**
    *   Adds a new task.
    *   Supports tags for organization (e.g., `@work`, `@home`).
    *   Supports adding multiple tasks at once, separated by a semicolon.
    *   *Example:* `do Buy milk @home; Finish report @work`

*   **`list`**
    *   Displays a list of all tasks.
    *   **`list @tag`**: Filters tasks by a specific tag.
    *   **`list tags`**: Shows a list of all currently active tags.

*   **`done [id]`**
    *   Marks a task as completed (releases dopamine).
    *   *Example:* `done 1`

*   **`del [id]`**, **`del all`** or **`del done`**
    *   Deletes a specific task, the entire list, or **only completed tasks**.
    *   The list is automatically renumbered after deletion.

*   **`undo`**
    *   Reverts the last change (a lifesaver for accidentally deleted tasks).

### Productivity & Visuals

*   **`focus [minutes] [optional_task_id]`**
    *   Starts Deep Work mode.
    *   The entire screen switches to the **Matrix effect**.
    *   If you provide a task ID (e.g., `focus 25 3`), its name will be displayed above the timer.
    *   Exit the mode by pressing **`q`** or **`Esc`**.
    *   *Example:* `focus 25` (Pomodoro) or `focus 45 1` (Work on task #1)

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
    *   Shows all tasks completed in the last 24 hours, even if they were archived via `del done`.
    *   *Example:* `review`

### Cloud & Data

*   **`login`**
    *   Initiates Google Login and synchronizes your data with the cloud.

*   **`logout`**
    *   Disconnects from the cloud and returns to local mode.

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
*   **q / Esc:** Exit Focus mode or Theme selection.
