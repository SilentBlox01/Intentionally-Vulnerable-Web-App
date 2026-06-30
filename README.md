# SecureTrust Bank

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white)
![Tests](https://img.shields.io/badge/Tests-45%20passing-brightgreen)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Test Accounts](#test-accounts)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Interactive Tutorial](#interactive-tutorial)

---

## Overview

**SecureTrust Bank** is an intentionally vulnerable online banking web application designed for security training and educational purposes. It simulates a realistic banking portal with user accounts, transactions, document management, file uploads, PDF/Excel report generation, analytics dashboards, and an administration panel.

> **WARNING:** This application contains intentional security vulnerabilities. Do NOT deploy in production or expose to public networks.

---

## Features

### Core Banking & UI
- Realistic banking UI with a professional dashboard
- User registration and login system
- Account balance and transaction history
- Money transfer functionality
- Support ticket system

### Documents & Reports
- Document management with comments and categories
- File upload system with Multer
- PDF financial report generation (PDFKit)
- Excel export for reports and user data (ExcelJS)

### Dashboards & Analytics
- Enhanced dashboard with Chart.js (line, doughnut charts)
- Financial metrics cards (income, expenses, savings, activity)
- Reports page with filters and summary cards
- Admin analytics panel with role distribution and transaction trends

### Gamification & Training
- **🏆 CTF Challenge Mode** integrated into the CLI lab tool
- 5 hidden flags (e.g., `FLAG{...}`) distributed across the system
- Interactive scoreboard and progress saving

### Administration
- Admin panel with stats, charts, and tabbed data views
- Tools for Network Ping testing (Vulnerable to Command Injection)
- Tools for External Receipt fetching (Vulnerable to SSRF)
- User role management (admin, user, restricted, guest)
- User status management (active, inactive, suspended)
- Excel export of all users
- Audit log viewer

### Code Quality
- Centralized configuration (`config/constants.js`)
- Reusable query builder (`utils/queryBuilder.js`)
- Input validation functions (`utils/validators.js`)
- Structured error logging throughout

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| **Runtime** | Node.js |
| **Framework** | Express.js 4.x |
| **Database** | SQLite3 (via `better-sqlite3`) |
| **Template Engine** | EJS (Embedded JavaScript) |
| **PDF Generation** | PDFKit |
| **Excel Generation** | ExcelJS |
| **Charts** | Chart.js |
| **File Upload** | Multer |
| **Session Management** | express-session |
| **Frontend** | Vanilla HTML/CSS/JS |
| **Testing** | Jest + Supertest |

---

## Project Structure

```
SecureTrust Bank/
├── server.js              # Main application entry point
├── config.js              # Configuration (imports from config/)
├── package.json
├── .env                   # Environment variables (secrets & flags)
├── internal_api/          # Secondary Node.js microservice for SSRF target
├── config/
│   └── constants.js       # Centralized constants (limits, patterns, timeouts)
├── database/
│   └── init.js            # Database initialization, schema, and CTF flags
├── middleware/
│   └── auth.js            # Authentication & authorization middleware
├── routes/
│   ├── auth.js            # Login, register, logout
│   ├── users.js           # Profile, search, transfers, user API
│   ├── documents.js       # Document CRUD and comments
│   ├── admin.js           # Admin panel, analytics, vulnerable tools
│   ├── upload.js          # File upload handling
│   └── reports.js         # Reports, PDF/Excel export, analytics API
├── utils/
│   ├── queryBuilder.js    # Reusable SQL WHERE clause builder
│   └── validators.js      # Input validation functions
├── views/                 # EJS templates
│   ├── admin/             # Admin specific templates
│   └── ...                # Other templates
├── public/
│   ├── css/style.css      # Application styles
│   └── js/app.js          # Client-side JavaScript
├── __tests__/             # Test suites (Jest, tests all vulnerabilities)
├── uploads/               # User-uploaded files
├── protected/             # Protected file storage
├── backup/                # Database backups
├── secret.txt             # CTF Flag file for Command Injection
└── lab.js                 # Interactive terminal tutorial & CTF mode
```

---

## Prerequisites

- **Node.js** v16 or higher - [Download here](https://nodejs.org/)
- **npm** (included with Node.js)

Verify your installation:

```bash
node --version   # Should be v16+
npm --version    # Should be v8+
```

---

## Installation

```bash
# Clone or download the project
cd "SecureTrust Bank"

# Install dependencies
npm install
```

---

## Running the Application

### Start the server

```bash
node server.js
```

### Or use npm scripts

```bash
npm start
```

The server will start at **http://localhost:3000** and display available test accounts in the terminal.

---

## Deployment

### GitHub Repository
You can find the official repository and contribute at:
👉 **[GitHub: SilentBlox01/Intentionally-Vulnerable-Web-App](https://github.com/SilentBlox01/Intentionally-Vulnerable-Web-App)**

### 1-Click Deploy to Replit

You can easily run this application in Replit. Just import the GitHub repository URL into Replit, and the provided `.replit` and `replit.nix` configurations will automatically install dependencies and compile native modules to start the app.

[![Run on Replit](https://replit.com/badge/github/SilentBlox01/Intentionally-Vulnerable-Web-App)](https://replit.com/new/github/SilentBlox01/Intentionally-Vulnerable-Web-App)

### Deploy with Docker (Multi-Container Architecture)

A `docker-compose.yml` is included to easily containerize and deploy the application along with its internal microservices (used for SSRF labs).

```bash
# Build and run the containers
docker-compose up --build
```
*The main application runs on port 3000. An internal API microservice runs on port 4000 (accessible only via SSRF).*

---

## Test Accounts

| Username | Password | Role | Description |
|----------|----------|------|-------------|
| `admin` | `admin123` | `admin` | Full admin access |
| `carlos` | `carlos2024` | `user` | Regular user with transactions |
| `maria` | `mariaSecure!` | `user` | User with transactions |
| `guest` | `guest` | `guest` | Limited access |
| `roberto` | `roberto99` | `user` | Business user |
| `ana` | `ana2024!` | `user` | Regular user |

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/login` | Login page |
| POST | `/login` | Process login |
| GET | `/register` | Registration page |
| POST | `/register` | Create new account |
| GET | `/logout` | Destroy session |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile/:id?` | User profile (authenticated) |
| POST | `/profile/:id/update` | Update profile |
| GET | `/search?q=` | Search users (authenticated) |
| POST | `/transfer` | Send money (authenticated) |
| GET | `/api/users` | List all users (JSON) |
| GET | `/api/users/:id` | Get user by ID (JSON) |
| PUT | `/api/users/:id/role` | Update user role |

### Documents
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/documents` | List documents (authenticated) |
| GET | `/documents/:id` | View document |
| POST | `/documents/create` | Create document |
| POST | `/documents/:id/comment` | Add comment |
| GET | `/api/documents` | List all documents (JSON) |
| GET | `/api/documents/:id` | Get document by ID (JSON) |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin` | Admin panel (admin only) |
| GET | `/api/admin/stats` | Admin statistics |
| GET | `/api/admin/analytics` | Full analytics data |
| POST | `/admin/users/:id/status` | Toggle user status |
| POST | `/admin/users/:id/role` | Update user role |
| POST | `/admin/users/:id/delete` | Delete user |
| GET | `/admin/export/users` | Export users to Excel |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reports` | Reports page (authenticated) |
| GET | `/reports/generate/:userId?` | Generate PDF report |
| GET | `/reports/export/excel` | Export report to Excel |
| GET | `/api/reports/analytics` | Analytics data for charts |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Home (redirects to dashboard or login) |
| GET | `/dashboard` | Dashboard (authenticated) |
| GET | `/api/dashboard/stats` | Dashboard chart data |
| POST | `/tickets/create` | Create support ticket |

### Debug (Intentionally Exposed)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/debug` | Server environment info |
| GET | `/api/debug/db` | Database schema and stats |
| GET | `/.env` | Exposed environment file |

---

## Testing

### Run all tests

```bash
npm test
```

Or directly:

```bash
node node_modules/jest/bin/jest.js --forceExit --detectOpenHandles
```

### Test coverage

```bash
npm run test:coverage
```

### Test suites

| Suite | Tests | Description |
|-------|-------|-------------|
| `auth.test.js` | 6 | Login, register, logout |
| `users.test.js` | 9 | Profile, transfers, search, user API |
| `documents.test.js` | 6 | Document CRUD, API |
| `admin.test.js` | 6 | Admin panel, stats, analytics, debug |
| `reports.test.js` | 5 | Reports page, PDF/Excel export, analytics |
| `dashboard.test.js` | 8 | Dashboard, home redirect, stats, 404 |
| **Total** | **45** | All passing |

---

## Interactive Learning Lab

We have built a dedicated **Terminal-based Interactive Learning Lab** that includes an architecture tutorial and guides you step-by-step through discovering, exploiting, and mitigating the 8 main vulnerabilities within the running application.

To start the interactive lab and tutorial:
```bash
npm run lab
```

### Lab Modules Included:
1. SQL Injection (SQLi)
2. Cross-Site Scripting (XSS)
3. Cross-Site Request Forgery (CSRF)
4. Broken Access Control
5. Insecure Session Management
6. Sensitive Data Exposure
7. Insecure Direct Object Reference (IDOR)
8. Insecure File Upload
9. Server-Side Request Forgery (SSRF)
10. OS Command Injection
11. Brute Force (Lack of Rate Limiting)

## Intentional Vulnerabilities

This application contains **11 intentional security vulnerabilities** for educational purposes:

- **SQL Injection** - Login form, search, documents, user API
- **Broken Authentication** - Cookie-based session bypass
- **Broken Access Control** - Role checks via cookies/headers
- **XSS (Cross-Site Scripting)** - Reflected/stored in multiple endpoints
- **IDOR (Insecure Direct Object Reference)** - Profile/document access
- **Information Disclosure** - Debug endpoints, verbose errors, `.env` exposure
- **No CSRF Protection** - State-changing requests without tokens
- **Weak Session Configuration** - `httpOnly: false`, `secure: false`
- **Insecure File Upload** - No MIME/extension validation on file uploads
- **SSRF (Server-Side Request Forgery)** - External receipt fetcher blindly trusts URLs
- **OS Command Injection** - Network ping tool passes user input directly to the shell
- **Brute Force** - No rate limiting on authentication endpoints

> These vulnerabilities are by design. Do NOT attempt to fix or remediate them.

---

## License

Educational use only. Not for production deployment.
