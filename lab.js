const inquirer = require('inquirer');
const { exec } = require('child_process');

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  red: "\x1b[31m"
};

function clearScreen() {
  process.stdout.write('\x1Bc');
}

function printHeader() {
  console.log(`\n${colors.cyan}${colors.bright}╔══════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}║      Intentionally Vulnerable Web App - Learning Lab ║${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}╚══════════════════════════════════════════════════════╝${colors.reset}\n`);
}

const tutorialSteps = [
  {
    title: "Welcome to SecureTrust Bank Tutorial",
    content: "SecureTrust Bank is a full-stack web application built with Node.js, Express, and SQLite.\nIt simulates a modern online banking environment."
  },
  {
    title: "Application Architecture",
    content: "The application uses a monolithic architecture:\n- Frontend: HTML, CSS, Vanilla JS, and EJS templates.\n- Backend: Node.js with Express.\n- Database: SQLite (via better-sqlite3) for fast, file-based data storage."
  },
  {
    title: "Key Features",
    content: "1. User Authentication (Login / Registration)\n2. Dashboard with real-time balance and transaction history\n3. Money Transfers\n4. Document Management & File Uploads\n5. PDF Report Generation (using PDFKit)\n6. Role-based Access Control (Admin, User, Restricted, Guest)"
  },
  {
    title: "Getting Started",
    content: "To run the application locally:\n\n1. Run `npm install` to install dependencies.\n2. Run `npm start` to start the server.\n3. Open your browser and navigate to `http://localhost:3000`.\n\nYou can log in with predefined accounts like 'admin' (password: admin123) or 'carlos' (password: carlos2024)."
  }
];

async function runTutorial() {
  for (let i = 0; i < tutorialSteps.length; i++) {
    clearScreen();
    printHeader();
    const step = tutorialSteps[i];
    console.log(`${colors.yellow}${colors.bright}Step ${i + 1} of ${tutorialSteps.length}: ${step.title}${colors.reset}\n`);
    console.log(`${colors.green}${step.content}${colors.reset}\n`);
    
    if (i < tutorialSteps.length - 1) {
      await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
    } else {
      await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to finish the tutorial and return to the main menu...' }]);
    }
  }
  mainMenu();
}

function runVerificationTest(testName) {
  return new Promise((resolve) => {
    // Using npx jest to run the specific test case
    const command = `npx jest __tests__/security.test.js -t "${testName}" --forceExit`;
    exec(command, (error, stdout, stderr) => {
      // In jest, an error means the test failed
      if (error) {
        console.log(`\n${colors.red}${colors.bright}❌ VERIFICATION FAILED${colors.reset}`);
        console.log(`${colors.yellow}The vulnerability is still present in the code. Keep trying!${colors.reset}\n`);
      } else {
        console.log(`\n${colors.green}${colors.bright}✅ VERIFICATION SUCCESSFUL${colors.reset}`);
        console.log(`${colors.cyan}Congratulations! You have successfully patched this vulnerability.${colors.reset}\n`);
      }
      resolve();
    });
  });
}

async function runLab(lab) {
  clearScreen();
  printHeader();
  console.log(`${colors.yellow}${colors.bright}--- [ ${lab.name} ] ---${colors.reset}\n`);
  
  // Phase 1: Theory
  console.log(`${colors.cyan}📖 PHASE 1: THEORY${colors.reset}`);
  console.log(`${lab.theory}\n`);
  
  await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to proceed to the Exploitation phase...' }]);
  
  // Phase 2: Exploitation
  console.log(`\n${colors.red}🧨 PHASE 2: EXPLOITATION${colors.reset}`);
  console.log(`${lab.exploit}\n`);
  
  await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter once you have successfully executed the exploit...' }]);
  
  // Phase 3: Mitigation
  console.log(`\n${colors.green}🛡️  PHASE 3: MITIGATION${colors.reset}`);
  console.log(`${lab.mitigation}\n`);
  
  if (lab.testName) {
    const { verify } = await inquirer.prompt([{ 
      type: 'confirm', 
      name: 'verify', 
      message: 'Would you like to verify your patch using the automated test suite?', 
      default: false 
    }]);

    if (verify) {
      console.log(`\n${colors.cyan}Running verification test for: ${lab.name}... Please wait.${colors.reset}`);
      await runVerificationTest(lab.testName);
    }
  }

  await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to return to the main menu...' }]);
  mainMenu();
}

const labs = [
  {
    name: "SQL Injection (SQLi)",
    testName: "SQL Injection (SQLi) should be mitigated on Login",
    theory: "SQL Injection occurs when untrusted user input is directly concatenated into a database query without proper sanitization or parameterization. This allows attackers to manipulate the structure of the SQL statement, enabling them to bypass authentication mechanisms, read sensitive data, or even modify/drop tables.",
    exploit: "1. Open your browser and navigate to http://localhost:3000/login\n2. In the 'Username' field, enter the following payload: admin' --\n3. Enter any random password and click Sign In.\n4. You will be successfully logged in as the admin user.\n\nExplanation: The payload closes the username string with a quote (') and comments out (-- ) the rest of the query (the password check), effectively making the query evaluate to TRUE just for the username.",
    mitigation: `Vulnerable Code (routes/auth.js):\n${colors.red}const query = \`SELECT * FROM users WHERE username = '\${username}' AND password = '\${password}'\`;\nconst user = db.prepare(query).get();${colors.reset}\n\nSecure Code (Using Parameterized Queries):\n${colors.green}const query = 'SELECT * FROM users WHERE username = ? AND password = ?';\nconst user = db.prepare(query).get(username, password);${colors.reset}\n\nWhy it works: Parameterized queries (or prepared statements) treat user input as literal string values, not as executable SQL code, completely neutralizing the injection.`
  },
  {
    name: "Cross-Site Scripting (XSS)",
    testName: "Cross-Site Scripting (XSS) should be mitigated on Search",
    theory: "Cross-Site Scripting (XSS) occurs when an application includes untrusted data in a web page without proper validation or escaping. If an attacker can inject executable scripts (like JavaScript) into the HTML, they can steal session cookies, hijack accounts, or deface the website.",
    exploit: "1. Log in with any account (e.g., carlos / carlos2024).\n2. Navigate to 'Search Accounts' (http://localhost:3000/search).\n3. In the search box, enter the following payload: <script>alert('XSS Executed!')</script>\n4. Submit the search. An alert box will pop up, proving that the browser executed your injected script.",
    mitigation: `Vulnerable Code (views/search.ejs):\n${colors.red}<h2>Search results for: <%- searchTerm %></h2>${colors.reset}\n\nSecure Code (Using Safe EJS tags):\n${colors.green}<h2>Search results for: <%= searchTerm %></h2>${colors.reset}\n\nWhy it works: In EJS, the <%- tag outputs raw, unescaped HTML, which is dangerous when rendering user input. The <%= tag securely escapes HTML entities (converting < to &lt;), neutralizing scripts.`
  },
  {
    name: "Cross-Site Request Forgery (CSRF)",
    testName: "CSRF should be mitigated on Money Transfer",
    theory: "CSRF forces an authenticated user to execute unwanted actions on a web application in which they are currently authenticated. It exploits the browser's behavior of automatically appending session cookies to cross-origin requests.",
    exploit: "1. Ensure you are logged into SecureTrust Bank in one tab.\n2. In a different tab, open a malicious HTML file containing a hidden form that auto-submits a POST request to http://localhost:3000/transfer with an amount of $10,000.\n3. The browser automatically attaches your banking session cookie to this POST request, and the bank processes the transfer without your explicit consent.",
    mitigation: `Secure Code (Adding Anti-CSRF Tokens):\n${colors.green}1. Generate a cryptographically secure random token on login and store it in the user's session.\n2. Include this token as a hidden field in all state-changing forms: <input type="hidden" name="_csrf" value="<%= csrfToken %>">\n3. On the server, verify that the submitted token matches the session token before processing the request.${colors.reset}\n\nWhy it works: A malicious site cannot read the token from the bank's site due to the Same-Origin Policy (SOP). Without the correct token, the forged request will fail validation.`
  },
  {
    name: "Broken Access Control",
    testName: "Broken Access Control should be mitigated for Admin Panel",
    theory: "Broken Access Control allows users to act outside of their intended permissions. This vulnerability occurs when access control decisions are based on client-side data (like cookies or hidden fields) rather than trusted server-side state.",
    exploit: "1. Log in as a standard user (e.g., carlos / carlos2024).\n2. Open your browser's Developer Tools -> Application -> Cookies.\n3. Notice the application sets a cookie called 'role=user'.\n4. Change the value of the 'role' cookie to 'admin' and manually add a new cookie 'isAdmin=true'.\n5. Navigate to http://localhost:3000/admin. You have bypassed the authorization checks and gained full administrator access!",
    mitigation: `Vulnerable Code (middleware/auth.js):\n${colors.red}const role = req.cookies.role;\nif (role === 'admin') { /* Grants access */ }${colors.reset}\n\nSecure Code:\n${colors.green}const role = req.session.role;\nif (role === 'admin') { /* Grants access */ }${colors.reset}\n\nWhy it works: Access control decisions must ALWAYS be made on the server using trusted, tamper-proof data (like server-side sessions). Never trust data that the client can modify.`
  },
  {
    name: "Insecure Session Management",
    testName: "Insecure Session Management should be mitigated",
    theory: "If session cookies are not properly protected with security flags, they can be easily stolen or intercepted by attackers. This often leads to full account takeover.",
    exploit: "1. Log in to the application.\n2. Open Developer Tools -> Application -> Cookies.\n3. Notice that the session cookie (connect.sid) does not have the 'HttpOnly' or 'Secure' flags set.\n4. Open the Console tab and type: document.cookie. The session ID is clearly visible. If an XSS vulnerability exists on the site, an attacker can use a script to steal this token and hijack the session.",
    mitigation: `Vulnerable Code (server.js):\n${colors.red}app.use(session({\n  cookie: { httpOnly: false, secure: false }\n}));${colors.reset}\n\nSecure Code:\n${colors.green}app.use(session({\n  cookie: { httpOnly: true, secure: true, sameSite: 'strict' }\n}));${colors.reset}\n\nWhy it works: 'HttpOnly' prevents JavaScript from reading the cookie, mitigating XSS theft. 'Secure' ensures the cookie is only transmitted over encrypted HTTPS connections. 'SameSite' mitigates CSRF.`
  },
  {
    name: "Sensitive Data Exposure",
    testName: "Sensitive Data Exposure should be mitigated",
    theory: "Web applications often inadvertently leak highly sensitive information such as passwords, API keys, database credentials, or internal network details due to misconfigurations or overly permissive endpoints.",
    exploit: "1. Open your browser and navigate to http://localhost:3000/.env\n2. The server will openly serve the environment configuration file containing sensitive secrets (like SESSION_SECRET and AWS keys).\n3. Alternatively, navigate to http://localhost:3000/api/debug/db to see full database schemas and internal statistics.",
    mitigation: `Vulnerable Code (server.js):\n${colors.red}app.get('/.env', (req, res) => { res.sendFile(path.join(__dirname, '.env')); });${colors.reset}\n\nSecure Code:\n${colors.green}// 1. Completely remove debug endpoints like /api/debug from production code.\n// 2. Configure the web server (e.g., Express, Nginx) to deny access to hidden files (.*).${colors.reset}\n\nWhy it works: Sensitive configuration files and diagnostic endpoints should never be accessible from the public internet. Ensure your static file serving middleware explicitly ignores sensitive directories.`
  },
  {
    name: "Insecure Direct Object Reference (IDOR)",
    testName: "IDOR should be mitigated on Profile viewing",
    theory: "IDOR occurs when an application provides direct access to internal objects (like database records or files) based on user-supplied input (like an ID in the URL), without verifying if the user is authorized to access that specific object.",
    exploit: "1. Log in as 'carlos' (carlos2024).\n2. Go to 'My Profile' (http://localhost:3000/profile). Notice that the URL might redirect to /profile/2 (Carlos's database ID).\n3. Manually change the URL to http://localhost:3000/profile/1\n4. You are now viewing the Admin's profile and private financial data, even though you are logged in as a standard user.",
    mitigation: `Vulnerable Code (routes/users.js):\n${colors.red}const userId = req.params.id;\nconst user = db.prepare('SELECT * FROM users WHERE id = ' + userId).get();${colors.reset}\n\nSecure Code:\n${colors.green}const requestedId = req.params.id;\n// Enforce Authorization Context\nif (requestedId !== String(req.session.userId) && req.session.role !== 'admin') {\n  return res.status(403).send("Forbidden: You can only view your own profile.");\n}\nconst user = db.prepare('SELECT * FROM users WHERE id = ?').get(requestedId);${colors.reset}\n\nWhy it works: The server must always enforce an authorization check to ensure the currently logged-in session has the right to access the requested resource ID.`
  },
  {
    name: "Insecure File Upload",
    testName: "Insecure File Upload should be mitigated",
    theory: "Allowing users to upload files without strict validation on file type, extension, and contents can lead to Remote Code Execution (RCE) if an attacker uploads a malicious script (like a web shell) and the server executes it.",
    exploit: "1. Log in and navigate to 'Upload Files' (http://localhost:3000/upload).\n2. Create a file named 'shell.html' containing malicious JavaScript or a PHP web shell.\n3. Upload the file. The application accepts it without checking the extension or MIME type.\n4. Navigate to http://localhost:3000/uploads/shell.html. The file will be served directly, executing the malicious payload in your browser or on the server.",
    mitigation: `Vulnerable Code (routes/upload.js):\n${colors.red}const storage = multer.diskStorage({\n  filename: function (req, file, cb) {\n    cb(null, file.originalname); // Trusts the user's filename\n  }\n});${colors.reset}\n\nSecure Code:\n${colors.green}const allowedMimeTypes = ['application/pdf', 'image/jpeg'];\nif (!allowedMimeTypes.includes(file.mimetype)) { return error; }\n// Rename the file to a safe, random string to prevent path traversal and execution\nconst safeFilename = crypto.randomUUID() + '.pdf';\nfile.mv(path.join(__dirname, '../uploads/', safeFilename));${colors.reset}\n\nWhy it works: Strictly validating MIME types and extensions prevents executable files from being uploaded. Generating random, safe filenames ensures attackers cannot guess the file path or rely on malicious extensions.`
  }
];

async function mainMenu() {
  clearScreen();
  printHeader();
  
  const { choice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'choice',
      message: 'Select an option to continue:',
      choices: [
        { name: '📚 1. Interactive Tutorial (Start Here)', value: 'tutorial' },
        new inquirer.Separator(),
        ...labs.map((lab, index) => ({ name: `🧪 ${index + 2}. Lab: ${lab.name}`, value: index })),
        new inquirer.Separator(),
        { name: '🚪 Exit', value: 'exit' }
      ],
      pageSize: 14
    }
  ]);

  if (choice === 'exit') {
    console.log(`\n${colors.cyan}Thanks for using the Learning Lab! Keep hacking safely.${colors.reset}\n`);
    process.exit(0);
  } else if (choice === 'tutorial') {
    await runTutorial();
  } else {
    await runLab(labs[choice]);
  }
}

// Start the app
mainMenu().catch(err => {
  console.error(err);
  process.exit(1);
});
