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
    theory: "SQL Injection occurs when untrusted user input is directly concatenated into a database query without proper sanitization or parameterization. This allows attackers to manipulate the SQL statement, bypassing authentication or accessing unauthorized data.",
    exploit: "1. Open your browser and go to http://localhost:3000/login\n2. In the 'Username' field, enter: admin' --\n3. Enter any password and click Sign In.\n4. You will be logged in as the admin user because the '--' comments out the password check in the query.",
    mitigation: `Vulnerable Code (routes/auth.js):\n${colors.red}const query = \`SELECT * FROM users WHERE username = '\${username}' AND password = '\${password}'\`;\nconst user = db.prepare(query).get();${colors.reset}\n\nSecure Code (Using Parameterized Queries):\n${colors.green}const query = 'SELECT * FROM users WHERE username = ? AND password = ?';\nconst user = db.prepare(query).get(username, password);${colors.reset}\n\nWhy it works: Parameterized queries treat user input as literal values, not as executable SQL code.`
  },
  {
    name: "Cross-Site Scripting (XSS)",
    theory: "XSS occurs when an application includes untrusted data in a web page without proper validation or escaping. This allows an attacker to execute malicious scripts in the victim's browser.",
    exploit: "1. Log in with any account (e.g., carlos / carlos2024).\n2. Go to 'Search Accounts' (http://localhost:3000/search).\n3. Enter the following payload: <script>alert('XSS')</script>\n4. Submit the search. You will see an alert box pop up because the search term is reflected directly into the HTML.",
    mitigation: `Vulnerable Code (views/search.ejs):\n${colors.red}<h2>Search results for: <%- searchQuery %></h2>${colors.reset}\n\nSecure Code (Using Safe EJS tags):\n${colors.green}<h2>Search results for: <%= searchQuery %></h2>${colors.reset}\n\nWhy it works: In EJS, <%- outputs unescaped HTML (dangerous), while <%= escapes HTML characters like < and >, neutralizing scripts.`
  },
  {
    name: "Cross-Site Request Forgery (CSRF)",
    theory: "CSRF forces an authenticated user to execute unwanted actions on a web application in which they are currently authenticated. It exploits the browser's behavior of automatically sending session cookies.",
    exploit: "1. Ensure you are logged into the bank in one tab.\n2. In a different tab, open a malicious HTML file containing a hidden form that submits a transfer request to http://localhost:3000/transfer.\n3. The browser will automatically attach your banking session cookie, and the transfer will succeed without your consent.",
    mitigation: `Secure Code (Adding Anti-CSRF Tokens):\n${colors.green}1. Generate a random token on login and store it in the session.\n2. Include this token as a hidden field in all forms: <input type="hidden" name="_csrf" value="<%= csrfToken %>">\n3. On the server, verify that the submitted token matches the session token before processing the request.${colors.reset}\n\nWhy it works: The attacker's malicious site cannot read the token from the bank's site due to the Same-Origin Policy, causing the request to fail validation.`
  },
  {
    name: "Broken Access Control",
    testName: "Broken Access Control should be mitigated for Admin Panel",
    theory: "Broken Access Control allows users to act outside of their intended permissions. This can lead to unauthorized information disclosure, modification, or destruction of data.",
    exploit: "1. Log in as a standard user (e.g., carlos / carlos2024).\n2. Look at your cookies (using Developer Tools). You will see a cookie like 'role=user'.\n3. Change the value of the 'role' cookie to 'admin' and add a new cookie 'isAdmin=true'.\n4. Navigate to http://localhost:3000/admin. You now have full administrator access!",
    mitigation: `Vulnerable Code (middleware/auth.js):\n${colors.red}const role = req.cookies.role;\nif (role === 'admin') { // Grants access based on user-controlled cookie }${colors.reset}\n\nSecure Code:\n${colors.green}const role = req.session.role;\nif (role === 'admin') { // Grants access based on server-side session }${colors.reset}\n\nWhy it works: Access control decisions must be made on the server using trusted data (like server-side sessions), never relying on client-modifiable data like cookies or hidden fields.`
  },
  {
    name: "Insecure Session Management",
    theory: "If session tokens are not properly protected, attackers can hijack them. This includes missing HTTP headers, weak session IDs, or failing to rotate session IDs after login.",
    exploit: "1. Log in to the application.\n2. Open Developer Tools -> Application -> Cookies.\n3. Notice that the session cookie does not have the 'HttpOnly' or 'Secure' flags set.\n4. Open the console and type: document.cookie. The session ID is visible to JavaScript, making it easily stealable via XSS.",
    mitigation: `Vulnerable Code (server.js):\n${colors.red}app.use(session({\n  cookie: { httpOnly: false, secure: false }\n}));${colors.reset}\n\nSecure Code:\n${colors.green}app.use(session({\n  cookie: { httpOnly: true, secure: true, sameSite: 'strict' }\n}));${colors.reset}\n\nWhy it works: HttpOnly prevents JavaScript from reading the cookie (mitigating XSS theft). Secure ensures the cookie is only sent over HTTPS. SameSite prevents CSRF.`
  },
  {
    name: "Sensitive Data Exposure",
    theory: "Web applications often inadvertently leak sensitive information such as passwords, API keys, or database details due to misconfigurations or overly verbose error messages.",
    exploit: "1. Go to http://localhost:3000/.env\n2. The server will happily serve you the environment configuration file containing sensitive secrets (like SESSION_SECRET).\n3. Alternatively, go to http://localhost:3000/api/debug/db to see full database schemas and potentially sensitive stats.",
    mitigation: `Vulnerable Code (server.js):\n${colors.red}app.get('/.env', (req, res) => { res.sendFile(path.join(__dirname, '.env')); });${colors.reset}\n\nSecure Code:\n${colors.green}// Remove these endpoints entirely.\n// Configure the web server (Nginx/Apache) to deny access to hidden files (.*)${colors.reset}\n\nWhy it works: Sensitive configuration files and debug endpoints should never be accessible from the public internet. Error messages should be generic in production.`
  },
  {
    name: "Insecure Direct Object Reference (IDOR)",
    testName: "IDOR should be mitigated on Profile viewing",
    theory: "IDOR occurs when an application provides direct access to objects based on user-supplied input. If authorization is not checked, attackers can access other users' data.",
    exploit: "1. Log in as 'carlos' (carlos2024).\n2. Go to 'My Profile' (http://localhost:3000/profile). Note the URL might redirect to /profile/2 (Carlos's ID).\n3. Change the URL to http://localhost:3000/profile/1\n4. You are now viewing the Admin's profile and private data, even though you are logged in as Carlos.",
    mitigation: `Vulnerable Code (routes/users.js):\n${colors.red}const userId = req.params.id;\nconst user = db.prepare('SELECT * FROM users WHERE id = ' + userId).get();${colors.reset}\n\nSecure Code:\n${colors.green}const userId = req.params.id;\n// Check authorization!\nif (userId !== String(req.session.userId) && req.session.role !== 'admin') {\n  return res.status(403).send("Forbidden");\n}\nconst user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);${colors.reset}\n\nWhy it works: The server must always verify that the currently authenticated user has the right to access the requested resource.`
  },
  {
    name: "Insecure File Upload",
    theory: "Allowing users to upload files without strict validation can lead to Remote Code Execution (RCE) if an attacker uploads an executable script (like a web shell) and accesses it.",
    exploit: "1. Log in and go to 'Upload Files' (http://localhost:3000/upload).\n2. Upload a file named 'shell.html' containing malicious JavaScript.\n3. The application does not check the file extension or MIME type.\n4. Go to http://localhost:3000/uploads/shell.html and the file will execute in your browser.",
    mitigation: `Vulnerable Code (routes/upload.js):\n${colors.red}const file = req.files.document;\nfile.mv(path.join(__dirname, '../uploads/', file.name));${colors.reset}\n\nSecure Code:\n${colors.green}const allowedMimeTypes = ['application/pdf', 'image/jpeg'];\nif (!allowedMimeTypes.includes(file.mimetype)) { return error; }\n// Rename the file to a safe, random string\nconst safeFilename = crypto.randomUUID() + '.pdf';\nfile.mv(path.join(__dirname, '../uploads/', safeFilename));${colors.reset}\n\nWhy it works: Validating MIME types and extensions prevents executable files from being uploaded. Renaming files prevents path traversal and executing known filenames.`
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
