# Performance Review & Rating Module [BHATIA-T2]

> 360° Review Form with Star Ratings, Weighted Scores, LocalStorage Auto-Save, and Grep Filtering.
> Built with HTML5, CSS3 (Flexbox), jQuery 3.7, Chart.js, and JSON Server.

---

## Technical Topics Implemented

- **Forms**: Dynamic KPI rating form evaluating employees on 5 core performance KPIs with interactive star components and feedback comments.
- **Validations**: Form validation checking required ratings for all 5 KPIs, mandatory reviewer identifiers, and enforcing a minimum of 20 characters in managerial comments whenever any rating or overall score is below 3 stars.
- **Chaining**: jQuery method and animation chaining demonstrated during draft saving: `$('.save').text('Saving...').addClass('loading').delay(500).text('Saved')` and chained status updates.
- **Grep**: High-performance filtering using jQuery `$.grep(reviews, r => r.avg < 3)` to instantly isolate low-scoring employees for the HR Intervention list.
- **LocalStorage**: Automated periodic background draft saving every 30 seconds, manual draft saving, reload restore prompt banners, and draft clearing upon successful review submission.

---

## 5 Core Performance KPIs & Weights

1. **Work Quality & Accuracy** (Weight: 25%)
2. **Punctuality & Delivery** (Weight: 20%)
3. **Teamwork & Culture** (Weight: 20%)
4. **Problem Solving & Initiative** (Weight: 20%)
5. **Communication & Leadership** (Weight: 15%)

Live weighted score calculation:
`Score = (Quality * 0.25) + (Punctuality * 0.20) + (Teamwork * 0.20) + (ProblemSolving * 0.20) + (Communication * 0.15)`

---

## Bonus Features Included

- **Radar Chart**: Interactive radar visualization rendered via Chart.js displaying current KPI polygon vs previous quarter baseline.
- **Quarterly Comparison**: Real-time delta tracker computing improvement or drop against previous quarter rating.
- **Export Review Sheet**: Print-ready formatted appraisal view triggering standard browser print and PDF export.
- **At-Risk Interventions**: One-click action for HR to initiate Performance Improvement Plans (PIP) for employees with ratings below 3.0.

---

## Running the Application

### 1. With JSON Server (Port 3000)

Start JSON Server:
```bash
npm start
```
or:
```bash
npx json-server --watch db.json --port 3000
```

Open `index.html` in your browser:
```
http://localhost:3000/
```
or open `index.html` directly with Live Server.

### 2. Standalone / Offline Mode

Double-click `index.html` in file explorer. The application contains built-in fallback data and will operate with full LocalStorage support even if JSON Server is not running.
