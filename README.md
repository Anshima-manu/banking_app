# Banking Admin Portal

A full-stack banking administration portal with a FastAPI backend, MySQL database, Alembic migrations, and a React/Vite frontend.

## Features

- Administrator authentication with JWT access tokens
- Customer and address management
- Bank account and loan management
- Deposits, withdrawals, transfers, and loan repayments
- Customer, account, transaction, and loan reports
- Dashboard summaries and reporting APIs
- India location and pincode lookup support

## Technology Stack

- Backend: Python, FastAPI, SQLAlchemy, Alembic, Pydantic Settings
- Database: MySQL
- Frontend: React, Vite, React Router, Axios, Tailwind CSS, Recharts

## Project Structure

```text
backend/
  app/                 FastAPI application
  alembic/             Database migrations
  scripts/             Development and data-management scripts
  requirements.txt     Python dependencies
frontend/
  src/                 React application
  public/              Static frontend assets
  package.json         Node.js dependencies and scripts
.gitignore
README.md
```

## Prerequisites

Install the following before starting:

- Python 3.11 or newer
- Node.js 18 or newer and npm
- MySQL 8 or newer

Create an empty MySQL database and a user with permission to access it. The database URL uses this format:

```text
mysql+pymysql://USER:PASSWORD@HOST:3306/DATABASE
```

## Backend Setup

From the repository root, create and activate a virtual environment:

### Windows PowerShell

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Create `backend/.env` locally. Do not commit it:

```env
APP_NAME=Banking Admin Portal
DEBUG=true
DATABASE_URL=mysql+pymysql://banking_user:change-this-password@localhost:3306/banking_db
JWT_SECRET=replace-with-a-long-random-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
FRONTEND_URL=http://localhost:5173
```

Apply the database migrations from the `backend` directory:

```powershell
alembic upgrade head
```

Start the API:

```powershell
uvicorn app.main:app --reload
```

The backend is available at `http://127.0.0.1:8000`.

Useful endpoints:

- Health check: `http://127.0.0.1:8000/health`
- Interactive API documentation: `http://127.0.0.1:8000/docs`

## Local Administrator Setup

To create the initial local administrator, run this from the `backend` directory:

```powershell
python scripts/seed_admin.py
```

The script is intended for local development. Change the generated credentials and use a secure credential-management process for any shared or production environment.

## Frontend Setup

Open a second terminal from the repository root:

```powershell
cd frontend
npm install
```

Create `frontend/.env` locally:

```env
VITE_API_URL=http://127.0.0.1:8000/api/v1
```

Start the development server:

```powershell
npm run dev
```

The frontend is normally available at `http://localhost:5173`.

## Frontend Commands

Run these commands from `frontend/`:

```powershell
npm run dev       # Start the Vite development server
npm run build     # Create a production build
npm run preview   # Preview the production build locally
npm run lint      # Run ESLint
```

## Database Migrations

Run migration commands from `backend/`:

```powershell
alembic upgrade head       # Apply all migrations
alembic current            # Show the current database revision
alembic history            # Show migration history
```

Alembic migration files are stored in `backend/alembic/versions/` and should be committed to version control.

## Location Data

The India pincode directory is intentionally excluded from this repository by `.gitignore` because it is a large local import dataset. To import location data, obtain the approved dataset separately and place it at:

```text
backend/data/all_india_pincode_directory.csv
```

Then run the location import script from `backend/`:

```powershell
python scripts/import_india_locations.py
```

## Security Notes

- Never commit `.env` files, passwords, JWT secrets, database dumps, or private keys.
- Use a unique, randomly generated `JWT_SECRET` outside local development.
- Replace development database credentials before deploying.
- Do not use default or shared administrator credentials in production.
- Configure `FRONTEND_URL` and database access for the deployment environment.

## Publishing Checklist

Before publishing the repository:

- Confirm `.env` files are ignored and are not already tracked.
- Confirm virtual environments and `node_modules` are ignored.
- Confirm database files, logs, reports, and generated exports are not included.
- Confirm no passwords, tokens, private keys, or connection strings are present in tracked files.
- Keep Alembic migrations, source code, dependency manifests, and frontend lockfiles.
