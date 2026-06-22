const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m"
};

const steps = [
  {
    title: "Welcome to SecureTrust Bank Tutorial",
    content: "SecureTrust Bank is a full-stack web application built with Node.js, Express, and SQLite.\nIt simulates a modern online banking environment.",
    action: "Press Enter to learn about the architecture..."
  },
  {
    title: "Application Architecture",
    content: "The application uses a monolithic architecture:\n- Frontend: HTML, CSS, Vanilla JS, and EJS templates.\n- Backend: Node.js with Express.\n- Database: SQLite (via better-sqlite3) for fast, file-based data storage.",
    action: "Press Enter to explore the features..."
  },
  {
    title: "Key Features",
    content: "1. User Authentication (Login / Registration)\n2. Dashboard with real-time balance and transaction history\n3. Money Transfers\n4. Document Management & File Uploads\n5. PDF Report Generation (using PDFKit)\n6. Role-based Access Control (Admin, User, Restricted, Guest)",
    action: "Press Enter to see how to run it..."
  },
  {
    title: "Getting Started",
    content: "To run the application locally:\n\n1. Run `npm install` to install dependencies.\n2. Run `node server.js` to start the server.\n3. Open your browser and navigate to `http://localhost:3000`.\n\nYou can log in with predefined accounts like 'admin' (password: admin123) or 'carlos' (password: carlos2024).",
    action: "Press Enter to finish the tutorial..."
  }
];

let currentStep = 0;

function clearScreen() {
  process.stdout.write('\x1Bc');
}

function displayStep() {
  clearScreen();
  console.log(`\n${colors.cyan}${colors.bright}╔══════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}║          SecureTrust Bank Interactive Tutorial       ║${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}╚══════════════════════════════════════════════════════╝${colors.reset}\n`);
  
  const step = steps[currentStep];
  
  console.log(`${colors.yellow}${colors.bright}Step ${currentStep + 1} of ${steps.length}: ${step.title}${colors.reset}\n`);
  console.log(`${colors.green}${step.content}${colors.reset}\n`);
  
  rl.question(`${colors.magenta}${step.action}${colors.reset}`, () => {
    currentStep++;
    if (currentStep < steps.length) {
      displayStep();
    } else {
      clearScreen();
      console.log(`${colors.blue}${colors.bright}Tutorial Completed!${colors.reset}\n`);
      console.log(`You are now ready to explore SecureTrust Bank.`);
      console.log(`Run ${colors.green}node server.js${colors.reset} to start the server.\n`);
      rl.close();
    }
  });
}

// Start tutorial
displayStep();
