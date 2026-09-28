# Recruitment Kanban Board (Drag-Drop Pipeline) [BHATIA-T1]

> **Employee Payroll Hub — Talent Acquisition & Pipeline Module**  
> Developed using **HTML5, CSS3 (Flexbox), jQuery 3.7, jQuery UI 1.13, and JSON Server**.

---

## 🌟 Overview & Industry Scenario

In an enterprise Payroll & Talent team tracking candidates across hiring stages, managing pipeline status smoothly is essential. This application provides a **Trello-style drag-and-drop hiring pipeline** connecting candidates from **Applied &rarr; Screening &rarr; Interview &rarr; Hired / Rejected**.

When a candidate card is moved between columns:
1. **DOM Traversing** reads the destination stage: `$(this).closest('.column').data('stage')`
2. An **AJAX PATCH** request (`PATCH /candidates/:id`) updates the server status and logs stage history.
3. Visual **Effects** highlight drop zones, smooth-revert if invalid, and **pulse the card** green upon success.
4. **Column counter badges** dynamically reflect the number of candidates.
5. **WIP Limit Warning** alerts if more than 10 candidates are moved into the Interview stage.
6. **Undo Last Move** action allows one-click reversal of status updates.
7. **Offline / LocalStorage Fallback** ensures the board operates even without running JSON Server.

---

## 🚀 How to Run the Application

You have two easy ways to run this project:

### Method 1: With JSON Server (Recommended for Evaluators)

1. Open your terminal in the project directory:
   ```bash
   cd c:\Users\HP\Desktop\payroll
   ```
2. Start the JSON Server on port 3000:
   ```bash
   npx json-server --watch db.json --port 3000
   ```
   *(or run `npm start` after running `npm install`)*
3. Double-click `index.html` or open it with Live Server in VS Code / browser:
   ```
   http://localhost:5500/index.html (or double-click file:///c:/Users/HP/Desktop/payroll/index.html)
   ```
4. You will see the green status pill: **JSON Server Online (:3000)**.

---

### Method 2: Standalone / Offline Mode (Zero Setup)

Simply **double-click `index.html`** in your file explorer!
- The app automatically detects if JSON Server is unavailable.
- It will load the initial 50 candidates from `db.json` and sync all your drag-and-drop updates, searches, and new additions to **Browser LocalStorage** (`payroll_recruitment_candidates_v1`).
- The status pill will display **Local Storage Mode (Offline)** in amber.

---

## 📁 Project Structure

```
c:\Users\HP\Desktop\payroll\
├── index.html          # Main Kanban board layout, modal dialogs, search bar, & templates
├── css\
│   └── style.css       # XD design tokens, Flexbox layout, animations, responsive rules (390px)
├── js\
│   └── app.js          # jQuery & jQuery UI logic, AJAX PATCH, Traversing, WIP limit, Undo
├── db.json             # Mock candidate database (50 records with Priya Sharma #201)
├── package.json        # NPM scripts and project dependencies
└── README.md           # Documentation & evaluation checklist guide
```

---

## 🎯 Technical Requirements Mapping (Curriculum Topics)

| Technical Requirement | Implementation in Code |
| :--- | :--- |
| **Traversing** | On drop: `$(this).closest('.column').data('stage')`<br>Also uses `$card.parent()`, `.siblings()`, `.find()` |
| **Effects** | Highlight drop zone: `.addClass('highlight-drop')` / `.ui-state-hover`<br>Pulse card on successful move: `$card.addClass('pulse-success')`<br>Toast notifications with slide and fade transitions |
| **Events** | jQuery UI Sortable `start`, `stop`, `receive`<br>Click card to open candidate details modal<br>Search `input` event, filter `change` event, form `submit` |
| **Selectors** | `$('.kanban-card[data-id]')`<br>`$('.column[data-stage="screening"]')`<br>`$('#candidate-search')`, `$('#role-filter')` |
| **Flexbox** | `.kanban-board` has `display: flex; gap: 1.25rem; overflow-x: auto;`<br>Columns have `min-width: 300px; flex: 1 0 320px;`<br>Responsive down to mobile viewport (tested 390px) |
| **jQuery UI Sortable** | `$('.column-cards').sortable({ connectWith: '.column-cards', placeholder: 'kanban-placeholder', revert: 200, ... })` |
| **AJAX Calls** | `$.ajax({ url: 'http://localhost:3000/candidates/201', type: 'PATCH', data: JSON.stringify({ stage: newStage, history: ... }) })` |
| **Data Functions** | `$.grep` for stage filtering, `$.map` & `sort()` for column ordering |
| **RegEx Validations** | Name (`/^[A-Za-z\s]{3,50}$/`), Email (`/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/`), Score (0.0 to 10.0), Date check |
| **Duplicate Prevention** | Prevents adding candidates with existing Name or Email |

---

## 🏆 Bonus Features Implemented

1. **Search Within Board**:
   - Live filtering as you type in the search bar.
   - Filter by Job Role dropdown.
2. **WIP (Work In Progress) Limit Warning**:
   - The **Interview** stage is limited to a maximum of **10 candidates**.
   - If an 11th candidate card is dragged into the Interview column, the move is canceled (`$(ui.sender).sortable('cancel')`) and an alert toast is shown.
3. **Undo Last Move**:
   - After dragging any card, a toast notification appears with an **Undo** button.
   - Clicking **Undo** moves the card back to its previous column and PATCHes the server/storage back to its original stage.
4. **Candidate Details & History Modal**:
   - Clicking any candidate card opens a detailed modal with their score, email, resume link, and full timestamped activity timeline.
5. **Add New Candidate Form**:
   - Complete modal form with client-side RegEx validation and duplicate check.

---

## 📱 Mobile Responsiveness (Tested at 390px)

- The Kanban board uses Flexbox with smooth horizontal touch-scrolling.
- On screens $\le 640\text{px}$ (such as standard iPhone 12/13/14/15/Pro at **390px** width):
  - Each column adjusts cleanly to `85vw` (min 280px).
  - Search and filter controls wrap neatly.
  - jQuery UI Touch Punch enables touch drag-and-drop on phones and tablets.

---

## 💻 Daily Git Practice Commands

To maintain this project in GIT on a daily basis:

```bash
# 1. Check status of changed files
git status

# 2. Stage changes
git add .

# 3. Commit with a meaningful message
git commit -m "feat: complete recruitment kanban board drag-and-drop with ajax patch"

# 4. View commit history
git log --oneline
```
