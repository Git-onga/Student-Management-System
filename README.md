# Ikonex Academy – Quick Start Guide

## 📋 Prerequisites
- **Operating System**: Windows (as you are on Windows)
- **Node.js**: v18+ (includes npm). Install from https://nodejs.org/
- **PostgreSQL**: v14+ – ensure the server is running and you have a user with rights to create a database.
- **Git** (optional) – to clone the repository.

## 📦 Project Structure
```
Ikonex Academy/
├─ backEnd/            # Express + TypeScript API
│   ├─ src/            # Controllers, routes, services
│   ├─ db/             # DB schema & migration scripts
│   └─ .env.example    # Template for environment variables
├─ frontEnd/           # React + TypeScript UI (Vite/CRA)
│   ├─ src/            # Pages, components, utils
│   └─ index.css       # Global styling
└─ README.md          # Project overview (this guide expands on it)
```

---

## 🔧 Backend Setup
1. **Clone the repo** (if you haven't already):
```bash
git clone <repo-url> "Ikonex Academy"
cd "Ikonex Academy"
```
2. **Create a PostgreSQL database**:
```sql
CREATE DATABASE ikonex_academy;
```
   - Remember the DB name, host (`localhost`), port (`5432`), user, and password.
3. **Prepare environment variables**:
   - Copy the template:
   ```bash
   cp backEnd/.env.example backEnd/.env
   ```
   - Edit `backEnd/.env` and fill in:
     ```
     DB_HOST=localhost
     DB_PORT=5432
     DB_NAME=ikonex_academy
     DB_USER=your_pg_user
     DB_PASSWORD=your_pg_password
     PORT=3000   # API port (can stay as‑is)
     ```
4. **Install backend dependencies**:
```bash
cd backEnd
npm install
```
5. **Run database migrations / seeds** (the repo ships a script to add the missing `code` column and any other required tables):
```bash
npm run migrate   # If a script exists, otherwise run the provided JS migration manually:
node backEnd/scripts/add_subject_code.js
```
   - Verify no errors and that `psql -d ikonex_academy -c "\d+ Subject"` shows the `code` column.
6. **Start the backend server** (development mode watches files):
```bash
npm run dev
```
   - You should see:
   ```
   🚀 Ikonex Academy API running on http://localhost:3000
   ```
   - Keep this terminal open.

---

## 🎨 Front‑end Setup
1. **Navigate to the front‑end folder** and install deps:
```bash
cd ../frontEnd   # from the backEnd folder or directly from project root
npm install
```
2. **Configure proxy (optional)** – the front‑end expects the API at `http://localhost:3000`. If you change the backend port, edit `vite.config.ts` or the CRA proxy settings accordingly.
3. **Run the UI development server**:
```bash
npm run dev   # (Vite) or npm start (CRA)
```
   - The app will launch at `http://localhost:5173` (or 3000 for CRA). Open it in a browser.

---

## 🚀 Deployment (Production)
### Backend
1. Build the TypeScript code:
```bash
npm run build   # creates dist/ with compiled JS
```
2. Run the compiled server (ensure environment variables are set, e.g., via a `.env` file or a process manager like PM2):
```bash
node dist/index.js
```
   - For production you may prefer a reverse‑proxy (NGINX) and enable HTTPS.
### Front‑end
1. Create an optimized static bundle:
```bash
npm run build   # Vite outputs to /dist (or CRA to /build)
```
2. Serve the static files with any HTTP server (NGINX, Apache, or a simple Node static‑serve):
```bash
npx serve -s dist   # quick test
```
   - Deploy the generated folder to your web host.

---

## 📚 System Usage Overview
| Feature | Where to Find | What It Does |
|--------|----------------|--------------|
| **Score Entry** | `Assessments` page (🧮) | Select stream → subject → term (Opener / Mid / End). Enter CA (out of 40) and Exam (out of 60). The UI now computes the weighted total (`0.4 × CA + 0.6 × Exam`).
| **Academic Engine** | `utils/academicEngine.ts` | Helper functions for fetching stream scores, computing rankings, and generating subject‑level summaries.
| **Reports** | `Reports` tab on the Assessments page | Download individual report cards, bulk PDFs for a stream, subject‑mean performance, or overall class performance.
| **Rankings** | `GET /api/scores/stream/:streamId/rankings` (used internally) | Returns a JSON list of students sorted by total marks, with class‑average and rank numbers.
| **Subject Detail** | `SubjectDetailPage` | Shows per‑subject breakdown for a student, including term‑wise scores and cumulative totals.

### Common Workflows
1. **Add a new score** – Navigate to *Score Entry*, pick the appropriate term (Opener, Mid, End), fill the two fields, click **Save**.
2. **Generate a report card** – In the *Reports* tab, select a stream & student, then click **Download Report Card**.
3. **View class rankings** – Press the **Class Performance** report button; the backend computes rankings using the weighted total.
4. **Fix data issues** – The API will reject out‑of‑range scores (CA 0‑40, Exam 0‑60). After the recent change we relaxed those validations, but you can still enforce them client‑side.

---

## 🛠️ Tips & Gotchas
- **Port conflict**: If you see `EADDRINUSE` errors, another process is using the port. Stop the duplicate (`Ctrl+Break` in the terminal) or change the port in `.env`.
- **Database migrations**: After schema changes (e.g., adding `code` to `Subject`), re‑run the migration script or manually alter the table.
- **Hot‑reload**: Both `npm run dev` commands watch for file changes. After editing a controller, the server restarts automatically.
- **Environment variables**: Never commit real passwords. Use `.env.example` as a template for teammates.
- **Testing**: The repo includes API endpoints under `/api/*`. You can test them with Postman or curl, e.g.:
  ```bash
  curl http://localhost:3000/api/streams
  ```

---

## 📄 Next Steps
- Add **Docker** support to simplify local setup.
- Implement a **login** flow for teachers vs. students.
- Expand the **grading scale** UI to allow custom thresholds.

**Enjoy building and using Ikonex Academy!**
