# Deployment and Local Configuration Guide (DEPLOY.md)

This guide details how to configure, run, and deploy the web application on your local machine or in different environments.

---

## 1. Local Deployment (Physical Machine)

The most direct way to test the application is by running it directly with Node.js on your computer.

### Prerequisites
- **Node.js**: Version 16.x or higher. (18.x recommended)
- **Git**: To clone the repository.

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
   cd "SecureTrust Bank"
   ```

2. **Install dependencies**:
   This will install all necessary libraries (`express`, `sqlite3`, etc.) listed in `package.json`.
   ```bash
   npm install
   ```

3. **Configure Environment Variables and Settings**:
   Rename the example files so the application can read them:
   ```bash
   cp .env.example .env
   cp config.js.example config.js
   ```
   **Intentional Security Note:** In this project, fake credentials are intentionally included in the example files. The application will read the values from these files automatically. You do not need to configure anything else unless you want to change the ports or fake passwords.

4. **Run the application**:
   ```bash
   npm start
   ```
   *Alternative: `node server.js`*

5. **Access the web**:
   Open your browser and go to: **[http://localhost:3000](http://localhost:3000)**. 
   The SQLite database will initialize automatically if it does not exist.

---

## 2. Deployment using Docker

If you do not want to install Node.js on your machine, or prefer to keep the application isolated, you can use Docker. The project already includes a configured `Dockerfile`.

### Requirements
- **Docker Desktop** or the Docker engine installed and running.

### Steps

1. **Build the Docker image**:
   Run this in the project root to create the image.
   ```bash
   docker build -t securetrust-bank .
   ```

2. **Run the container**:
   This will start the container and map port 3000 on your machine to port 3000 on the container.
   ```bash
   docker run -p 3000:3000 securetrust-bank
   ```

3. **Access**:
   Go to **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 3. Quick Deployment on Replit (Cloud)

The project is ready to run directly on Replit without additional configuration thanks to the `.replit` and `replit.nix` files.

1. Upload the project to your GitHub account.
2. Log in to [Replit](https://replit.com/).
3. Click the **"Import from GitHub"** button.
4. Paste your repository URL.
5. Replit will read the configuration files, install Node.js 18, run `npm install` automatically, and start the web server.

---

## Common Troubleshooting

- **Error: `EADDRINUSE: address already in use :::3000`**
  This means you already have another application running on port 3000. Close that process or change the port in your `.env` or `server.js` file.

- **Error: `better-sqlite3` failed to compile**
  On some systems (especially Windows), if you don't have C++ build tools, `better-sqlite3` may fail. Ensure you have Python and the build tools installed, or use the Docker version which already includes a prepared environment.

- **Missing test data**
  The database resets automatically if the `database/bank.db` folder is deleted. If the application starts but you cannot log in, simply restart the server; the `database/init.js` file will ensure the test users (`admin`, `carlos`, etc.) are created.
