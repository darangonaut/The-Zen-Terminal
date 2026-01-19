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

## Commands

The following commands are available to control the application:

### Task Management

*   **`do [text]`**
    *   Adds a new task.
    *   Supports adding multiple tasks at once, separated by a semicolon.
    *   *Example:* `do Buy milk; Take out trash`

*   **`list`**
    *   Displays a list of all tasks.

*   **`done [id]`**
    *   Marks a task as completed (releases dopamine).
    *   *Example:* `done 1`

*   **`del [id]`** or **`del all`**
    *   Deletes a specific task or the entire list.
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

### Cloud & Data

*   **`login`**
    *   Initiates Google Login and synchronizes your data with the cloud.

*   **`logout`**
    *   Disconnects from the cloud and returns to local mode.

*   **`whoami`**
    *   Displays information about the currently logged-in user.

*   **`export`**
    *   Exports your current data to a secure code string, automatically copied to your clipboard.
    
*   **`import [code]`**
    *   Restores data from a previously generated export code.

### Other

*   **`clear`**
    *   Clears the terminal screen.

*   **`help`**
    *   Displays a quick overview of commands.

## Keyboard Shortcuts

*   **Tab:** Command autocomplete.
*   **Arrow Up / Down:** Navigate command history.
*   **Arrows (in Theme menu):** Select theme.
*   **q / Esc:** Exit Focus mode or Theme selection.