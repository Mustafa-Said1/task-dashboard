# TaskFlow — Premium Task Management Dashboard

A modern, production-quality task management dashboard built with **HTML5**, **CSS3**, and **Vanilla JavaScript (ES6+)**. Inspired by Notion, Trello, Linear, and Jira design language.

![TaskFlow Dashboard](assets/images/screenshot-placeholder.png)

## Project Overview

TaskFlow is a fully functional front-end task management application featuring authentication, CRUD operations, Kanban boards, drag-and-drop, statistics charts, import/export, and a responsive glassmorphism UI. Data persists in **Local Storage** with a modular architecture designed for easy extension to backend APIs and real authentication.

## Features

### Authentication
- Simulated login with Local Storage
- Demo account auto-created on first launch
- Remember Me session persistence
- Dashboard route protection
- Logout preserves tasks and settings

### Task Management
- Create, edit, delete, duplicate, and favorite tasks
- Fields: title, description, category, priority, status, due date, estimated time, tags, color label
- Instant search across title, category, description, and tags
- Filters: all, completed, pending, in progress, favorites, priority, today, overdue
- Sort: newest, oldest, priority, alphabetical, due date
- Kanban board with drag-and-drop between columns
- Pagination and lazy-loaded views

### Dashboard
- Summary cards and progress circle
- Recent activity feed
- Upcoming deadlines
- Calendar widget (UI)
- Quick-add task form

### Statistics
- Chart.js visualizations: pie, bar, line, and doughnut charts
- Status, priority, weekly activity, and category distributions

### Data & Storage
- Local Storage for tasks, session, theme, sidebar state, filters, sort, and settings
- Fetch API integration with [DummyJSON](https://dummyjson.com/todos)
- JSON import/export with validation
- Undo/redo support

### UI/UX
- Dark and light themes with smooth transitions
- Toast notifications and animated loaders
- Modal dialogs with focus trap
- Keyboard shortcuts (N, Esc, Ctrl+S, Ctrl+F, Ctrl+Z)
- Floating action button and back-to-top
- Fully responsive (mobile, tablet, desktop)
- ARIA labels and keyboard navigation

## Folder Structure

```
task-dashboard/
├── index.html              # Login page
├── dashboard.html          # Main dashboard
├── README.md
├── css/
│   ├── style.css           # Base styles & design system
│   ├── dashboard.css       # Dashboard layout & components
│   ├── responsive.css      # Media queries
│   ├── dark.css            # Dark theme overrides
│   └── animations.css      # Animations & transitions
├── js/
│   ├── authentication.js   # Auth business logic
│   ├── login.js            # Login page controller
│   ├── app.js              # Dashboard app controller
│   ├── storage.js          # Local Storage abstraction
│   ├── tasks.js            # Task CRUD & statistics
│   ├── ui.js               # DOM rendering
│   ├── modal.js            # Modal management
│   ├── toast.js            # Toast notifications
│   ├── chart.js            # Chart.js integration
│   ├── fetch.js            # Fetch API module
│   ├── dragdrop.js         # SortableJS integration
│   ├── validation.js       # Form validation
│   ├── theme.js            # Theme management
│   ├── router.js           # View routing
│   └── utils.js            # Shared utilities
└── assets/
    ├── avatar.png          # Default profile avatar
    ├── avatar.svg          # SVG avatar variant
    ├── images/
    └── icons/
```

## Technologies Used

| Technology | Purpose |
|---|---|
| HTML5 | Semantic markup |
| CSS3 | Styling, CSS variables, glassmorphism |
| Vanilla JavaScript (ES6+) | Application logic (ES modules) |
| Local Storage | Data persistence |
| Fetch API | External task import |
| [Chart.js](https://www.chartjs.org/) | Statistics charts |
| [SortableJS](https://sortablejs.github.io/Sortable/) | Drag and drop |
| [Font Awesome 6](https://fontawesome.com/) | Icons |
| [Google Fonts (Inter)](https://fonts.google.com/) | Typography |

## Installation

1. **Clone or download** the repository:
   ```bash
   git clone <repository-url>
   cd task-dashboard
   ```

2. **Serve locally** (ES modules require a web server):
   ```bash
   # Using Python
   python -m http.server 8080

   # Using Node.js (npx)
   npx serve .

   # Using PHP
   php -S localhost:8080
   ```

3. Open `http://localhost:8080` in your browser.

## GitHub Pages Deployment

1. Push the `task-dashboard` folder to a GitHub repository.
2. Go to **Settings → Pages**.
3. Set source to your branch and `/task-dashboard` folder (or root if deployed at repo root).
4. Access at `https://<username>.github.io/<repo>/`.

## Usage

### Login
1. Navigate to `index.html`
2. Sign in with the demo credentials below
3. You'll be redirected to the dashboard

### Demo Account

| Field | Value |
|---|---|
| **Email** | `admin@example.com` |
| **Password** | `Admin@123` |

### Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `N` | New task |
| `Esc` | Close modal |
| `Ctrl + S` | Save task (in modal) |
| `Ctrl + F` | Focus search |
| `Ctrl + Z` | Undo |
| `Ctrl + Shift + Z` | Redo |

## Screenshots

> Placeholder — add screenshots of your deployed application here.

| Login Page | Dashboard |
|---|---|
| ![Login](assets/images/screenshot-login.png) | ![Dashboard](assets/images/screenshot-dashboard.png) |

| Kanban Board | Statistics |
|---|---|
| ![Kanban](assets/images/screenshot-kanban.png) | ![Statistics](assets/images/screenshot-stats.png) |

## Architecture

The application follows **clean architecture** principles:

- **Separation of Concerns** — Business logic (`tasks.js`, `authentication.js`) is separate from UI (`ui.js`) and storage (`storage.js`)
- **Modular ES Modules** — Each feature is an independent module
- **No Global Variables** — State managed through module exports and a central app controller
- **DRY & KISS** — Reusable utilities and minimal abstractions
- **Future-Proof** — Storage and auth layers can be swapped for API calls without refactoring UI

## Future Improvements

- [ ] User registration and multi-user support
- [ ] Backend API with real authentication (JWT/OAuth)
- [ ] Database integration (PostgreSQL, MongoDB)
- [ ] Real-time collaboration and notifications
- [ ] Email reminders for due dates
- [ ] PWA support with service workers
- [ ] Unit and integration tests
- [ ] Internationalization (i18n)
- [ ] Recurring tasks and subtasks
- [ ] File attachments on tasks

## License

This project is open source and available under the [MIT License](https://opensource.org/licenses/MIT).

---

Built with care for scalability, maintainability, and premium user experience.
