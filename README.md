# Task Dashboard · Focus

A modern, lightweight task-management dashboard built with **vanilla HTML, CSS and JavaScript** — no frameworks, no build tools, no dependencies. Tasks are persisted in the browser's `localStorage`, making the app fully client-side and instantly deployable as a static site.

---

## Table of Contents

1. [Features](#features)
2. [Quick Start](#quick-start)
3. [Project Structure](#project-structure)
4. [Architecture Overview](#architecture-overview)
5. [Data Model](#data-model)
6. [Module Reference](#module-reference)
7. [UI Components](#ui-components)
8. [Notification System](#notification-system)
9. [Keyboard Shortcuts](#keyboard-shortcuts)
10. [Customisation & Theming](#customisation--theming)
11. [Responsive Behaviour](#responsive-behaviour)
12. [Browser Support](#browser-support)
13. [Contributing](#contributing)
14. [License](#license)

---

## Features

| Category | Details |
|---|---|
| **Task CRUD** | Create, read, update and delete tasks with a title, optional description and notes. |
| **Pending / Completed tabs** | Toggle a task's status with a single click; completed tasks are visually struck through. |
| **Date filtering** | A day-picker control lets you view and add tasks scoped to a specific date. |
| **Time scheduling** | Assign a specific time to any task via the expanded form or edit modal. |
| **Repetitive tasks** | Mark a task as *Repeat daily* so it appears on every date. |
| **Inline notes** | Expand any pending task to attach quick inline notes that auto-save on blur. |
| **Sidebar deep notes** | Click a pending task to open a larger note editor in the sidebar panel. |
| **Live metrics** | The sidebar displays real-time Pending, Completed, Total and Completion-rate cards. |
| **Edit modal** | Edit a task's title, description, notes and scheduled time via a dedicated modal dialog. |
| **In-app toast notifications** | Slide-in toast alerts when a scheduled task is approaching its time (5 and 10 minute warnings). |
| **Audio alerts** | A three-beep alarm sound plays alongside each notification to draw attention. |
| **System notifications** | Desktop-level push notifications using the Notification API — alerts reach you even when the browser tab is in the background. |
| **Persistence** | All task state is stored in `localStorage`. |
| **Accessibility** | ARIA roles (`application`, `tablist`, `tab`, `checkbox`, `aria-live`), keyboard navigation and focus management. |
| **Responsive** | Two-column layout collapses to a single-column stack below 900 px; optimised for mobile and small screens. |
| **Zero dependencies** | No npm packages, no framework, no build step. |

---

## Quick Start

1. **Clone or download** the repository.
2. **Open** `index.html` in any modern browser — that's it.

```
# Or serve via any static file server:
npx -y serve .
```

3. Start adding tasks!

---

## Project Structure

```
Task Board/
├── index.html      # Application markup — dashboard layout, edit modal, notification container
├── styles.css      # Complete stylesheet with CSS custom properties
├── app.js          # Application logic — state, rendering, events, notification scheduler
└── README.md       # ← You are here
```

All three source files are self-contained. The only external resource loaded at runtime is **Google Fonts (Inter)**.

---

## Architecture Overview

The application follows a simple **state → render** architecture:

```
                  ┌─────────────┐
                  │ localStorage │
                  │  taskDashboardState │
                  └──────┬──────┘
                         │ loadState() / saveState()
                         ▼
                  ┌──────────────┐
                  │   tasks[]    │  ← Single source of truth
                  └──────┬───────┘
                         │ getFilteredTasks()
                         ▼
  ┌──────────────────────────────────────────┐
  │               render()                    │
  │  ├─ renderCounter()    ─── pendingCount   │
  │  ├─ renderTaskList()   ─── task cards     │
  │  ├─ renderBadges()     ─── tab badges     │
  │  └─ renderSidebarMetrics() ── 4 metrics   │
  └──────────────────────────────────────────┘
                         │
       User actions → addTask / toggleTaskStatus / deleteTask / saveNotes
                         │
                 saveState(tasks) + render()
                         │
                  ┌───────────────────────────┐
                  │   Notification Scheduler   │
                  │   checks every 30s         │
                  │   ├─ in-app toast          │
                  │   ├─ audio beep (3×)       │
                  │   └─ system notification   │
                  └───────────────────────────┘
```

1. **State**: A single `tasks` array is the source of truth, loaded from `localStorage`.
2. **Mutations**: Functions like `addTask()`, `toggleTaskStatus()`, `deleteTask()` and `saveNotes()` mutate the array and call `saveState()` + `render()`.
3. **Rendering**: `render()` orchestrates four sub-renderers that declaratively rebuild the DOM.
4. **Events**: All events are bound once in `DOMContentLoaded`; the task list uses **event delegation**.
5. **Notifications**: A background interval (30s) checks pending tasks with scheduled times and triggers in-app toasts, audio alerts, and system-level push notifications at the 10-minute and 5-minute marks.

---

## Data Model

### Task Object

```js
{
  id:           String,   // Unique ID (base-36 timestamp + random suffix)
  title:        String,   // Required — task title
  description:  String,   // Optional — short description
  status:       String,   // "pending" | "completed"
  dateCreated:  String,   // ISO 8601 timestamp
  taskDate:     String,   // YYYY-MM-DD — the day this task belongs to
  notes:        String,   // Optional — detailed notes
  isRepetitive: Boolean,  // If true, task appears on every date
  taskTime:     String    // HH:MM — scheduled time (24-hour format)
}
```

### localStorage Keys

| Key | Value |
|---|---|
| `taskDashboardState` | JSON array of task objects |
| `taskNotifiedSet` | JSON array of notified task keys (`taskId:YYYY-MM-DD:minutes`) — used to prevent duplicate notifications per session |

---

## Module Reference

### `app.js` — Sections

| Section | Purpose |
|---|---|
| **STATE** | `loadState()`, `saveState()`, global variables (`tasks`, `selectedTaskId`, `currentTab`, `selectedDate`). |
| **UTILITY** | `uid()`, `formatDate()`, `formatTime()`, `toLocalDate()`, `getTodayDate()`, `escapeHtml()`. |
| **TASK FILTERING** | `getFilteredTasks()` — filters by `currentTab`, `selectedDate`, and `isRepetitive`. |
| **RENDER** | `render()`, `renderCounter()`, `renderTaskList()`, `renderBadges()`, `renderSidebarMetrics()`. |
| **NOTIFICATIONS** | `checkScheduledTasks()`, `cleanupNotifiedTasks()`, `showTaskNotification()`, `showSystemNotification()`, `playNotificationSound()`, `primeAudio()`, `setupNotificationInterval()`. |
| **SIDEBAR DEEP NOTES** | `selectTaskForNotes()`, `deselectNotes()`, `updateNotesPanel()`. |
| **STATE MUTATIONS** | `addTask()`, `toggleTaskStatus()`, `deleteTask()`, `saveNotes()`, `clearSelectedNotes()`. |
| **EDIT MODAL** | `openEditModal()`, `closeEditModal()`, `saveEdit()`. |
| **FORM HELPERS** | `clearForm()`, `toggleFormExpand()`, `updateTabUI()`. |
| **EVENT BINDING** | All DOM event listeners registered within `DOMContentLoaded`. |

### Key Functions

| Function | Description |
|---|---|
| `addTask(title, description, notes, isRepetitive, taskTime)` | Creates a new task with an optional scheduled time, saves, and re-renders. |
| `toggleTaskStatus(taskId)` | Flips between `"pending"` and `"completed"`. |
| `deleteTask(taskId)` | Removes a task by ID. |
| `saveNotes(taskId, notes)` | Persists updated notes for a given task. |
| `getFilteredTasks()` | Returns tasks matching the current tab and selected date. |
| `render()` | Master render — calls counter, list, badges, and metrics sub-renderers. |
| `formatTime(time)` | Converts `HH:MM` to 12-hour format (e.g. `"14:30"` → `"2:30 PM"`). |
| `checkScheduledTasks()` | Scans pending tasks for approaching scheduled times and triggers notifications at 10-minute and 5-minute marks. |
| `showTaskNotification(task, minutesBefore)` | Displays the in-app toast notification and delegates to audio and system notification handlers. |
| `showSystemNotification(task, minutesBefore)` | Fires a desktop push notification via the Notification API. |
| `playNotificationSound()` | Generates three 880 Hz square-wave beeps using the Web Audio API. |
| `primeAudio()` | Initialises or resumes the AudioContext on first user interaction to satisfy browser autoplay policies. |
| `escapeHtml(str)` | Safely escapes user-supplied text to prevent XSS. |

---

## UI Components

### 1. Header & Pending Counter
Displays the app title and a pill-shaped counter showing total pending tasks with a flip animation on count change.

### 2. Task Creation Form
- **Title input** (required) and **Add Task** button in a single row.
- **Expandable section** (`▼ Add details`) reveals description, notes, a time picker for scheduling, and a repeat-daily checkbox.

### 3. Day Picker
A native `<input type="date">` prefixed with a calendar icon. Changing the date re-filters the task list.

### 4. Tab Bar
Two tabs — **Pending** and **Completed** — with animated underline indicator and badge counts for each status.

### 5. Task List
Scrollable list of task cards with:
- Status toggle (round check indicator with orange/green states)
- Title with repetitive-task badge
- Description preview line
- Metadata row showing creation date, scheduled time (if set), repetitive label, and notes indicator
- Edit and Delete buttons (visible on hover)
- Expandable inline notes section for pending tasks

### 6. Sidebar
- **Metrics panel** — 2×2 grid (desktop) / single-column (mobile): Pending, Completed, Total Tasks, Completion %.
- **Deep Notes panel** — Empty state prompt or active note editor showing the selected task title, a resizable textarea, and Save / Clear buttons.

### 7. Edit Modal
Centred dialog with backdrop blur for editing task title, description, notes, and scheduled time. Supports keyboard submission (Enter) and dismissal (Escape).

### 8. Notification Toast
A fixed-position toast container in the top-right corner. Each notification slides in with a left accent border, task title, scheduled time, and a dismiss button. Automatically disappears after 8 seconds.

---

## Notification System

When a pending task has a scheduled time (`taskTime`), the application monitors it and delivers multi-channel alerts:

### Alert Schedule

| Trigger | Channels |
|---|---|
| **10 minutes before** scheduled time | In-app toast + sound + system notification |
| **5 minutes before** scheduled time | In-app toast + sound + system notification |

### Channels

| Channel | Description | Requirements |
|---|---|---|
| **In-app toast** | Slide-in notification card at the top-right of the dashboard. Always works. | None. |
| **Audio alert** | Three rapid 880 Hz square-wave beeps generated via the Web Audio API. | User must interact with the page once (click / keypress / touch) to prime the audio context. |
| **System notification** | Desktop push notification via the W3C Notification API. Appears outside the browser window. | User must grant notification permission on first interaction. Not supported on iOS Safari. |

### Behaviour

- The scheduler runs every 30 seconds while the page is open.
- Each task triggers each alert window (10-min and 5-min) only once per day. Duplicates are prevented via a `sessionStorage`-backed set keyed by `taskId:YYYY-MM-DD:minutes`.
- Old notification keys from previous days are automatically cleaned up on each check cycle.

---

## Keyboard Shortcuts

| Key | Context | Action |
|---|---|---|
| `Enter` | Status toggle focused | Toggle task pending/completed |
| `Space` | Status toggle focused | Toggle task pending/completed |
| `Enter` | Edit modal title input | Save changes |
| `Escape` | Edit modal open | Close the edit modal |
| `Escape` | Task selected in sidebar | Deselect the task |

---

## Customisation & Theming

The entire colour palette and layout dimensions are defined as **CSS custom properties** in `:root` (see `styles.css`). To create a custom theme, override these variables:

```css
:root {
  /* Background palette */
  --bg-primary:    #1a2332;
  --bg-secondary:  #1f2a3f;
  --bg-tertiary:   #25324b;

  /* Surface / card colours */
  --surface:       #f0f4fc;
  --surface-alt:   #e6edf8;
  --card-shadow:   rgba(0, 0, 0, 0.25);

  /* Accent blues */
  --accent:        #2b7bff;
  --accent-hover:  #1a62e0;
  --accent-glow:   #4d94ff;
  --electric:      #00b8d9;

  /* Text */
  --text-primary:  #1e293b;
  --text-secondary:#526580;
  --text-light:    #94a3b8;

  /* Status indicators */
  --pending-dot:   #f97316;
  --completed-dot: #22c55e;

  /* Layout */
  --sidebar-w:     380px;
  --radius:        12px;
  --radius-sm:     8px;
  --transition:    0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## Responsive Behaviour

| Breakpoint | Behaviour |
|---|---|
| **> 900 px** | Two-column layout: workspace (flex: 1) + sidebar (380 px fixed). |
| **≤ 900 px** | Single-column stack with 12 px body padding. Workspace and sidebar become full-width. |
| **≤ 600 px** | Edge-to-edge layout (no body padding). Form stacks vertically with larger inputs. Sidebar metrics stack in single column with more spacing. Edit/delete buttons always visible. Task check circles enlarge for touch. Notification container spans full width. |
| **≤ 400 px** | Header stacks vertically. Day picker wraps. Sidebar notes further compacted for very small screens. |

---

## Browser Support

The app uses standard ES6+ features and modern CSS (custom properties, `inset`, `gap`, `grid`, `backdrop-filter`). Supported in:

- Chrome / Edge 88+
- Firefox 78+
- Safari 14+
- Opera 74+

> `backdrop-filter` is used on the edit modal overlay. In browsers that don't support it, everything still functions — only the blur effect is absent.

### Notification System Compatibility

| Feature | Chrome / Edge | Firefox | Safari (macOS) | Safari (iOS) |
|---|---|---|---|---|
| In-app toast | ✅ | ✅ | ✅ | ✅ |
| Audio alerts | ✅ | ✅ | ✅ | ✅ (requires tap gesture) |
| System notifications | ✅ | ✅ | ✅ | ❌ not supported |

---

## Contributing

1. **Fork** the repository.
2. Create a feature branch: `git checkout -b feature/my-change`.
3. Make your changes — keep to the existing code style (vanilla JS, no build tools).
4. Test across major browsers.
5. Submit a **pull request** with a clear description of what you changed and why.

### Code Style Guidelines

- Use `function` declarations (no arrow-function top-levels) for named module functions.
- HTML IDs use **camelCase** (e.g. `taskTitleInput`, `selectedDate`).
- CSS classes use **kebab-case** (e.g. `task-list-wrap`, `sidebar-notes`).
- Sections in `app.js` are delimited with banner comments (`/* === ... === */`).
- All user-supplied text must be passed through `escapeHtml()` before DOM insertion.

---

## License

This project is provided as-is for client use. Consult with the project owner for specific licensing terms.
