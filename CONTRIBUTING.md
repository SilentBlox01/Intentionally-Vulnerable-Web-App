# Contributing to SecureTrust Bank

First off, thank you for considering contributing to SecureTrust Bank! 

## ⚠️ Important Note on Vulnerabilities

**SecureTrust Bank is an intentionally vulnerable web application.** Its primary purpose is educational—to help developers and security enthusiasts learn about web security flaws and how to exploit them in a safe, controlled environment.

Therefore, the golden rule of contributing is:
**DO NOT submit pull requests that fix or patch the security vulnerabilities.**

If you fix the vulnerabilities, the application loses its educational value!

## How You Can Contribute

While we don't want security fixes, there are many ways you can contribute:

1. **Add New Vulnerabilities**: Have a cool idea for a new intentionally vulnerable feature? (e.g., SSRF, XML External Entities, new types of Injection). We'd love to see it!
2. **Improve the UI/UX**: Making the banking interface look more realistic or adding new "features" makes the simulation better.
3. **Add Tests**: We have a test suite! Writing tests ensures the app works correctly (even if it's securely broken).
4. **Documentation**: Improving this documentation, adding tutorials, or writing guides on how to exploit the existing vulnerabilities.
5. **Translations**: Translating the UI or documentation to other languages.

## Submitting Changes

1. **Fork the repository** on GitHub.
2. **Create a new branch** for your feature (`git checkout -b feature/new-vulnerability`).
3. **Commit your changes** (`git commit -m 'Add intentional IDOR in user settings'`).
4. **Push to the branch** (`git push origin feature/new-vulnerability`).
5. **Open a Pull Request**!

### Pull Request Guidelines
- In your PR description, clearly explain what you added or changed.
- If you added a new vulnerability, explain what it is and how an attacker might exploit it (you can hide this inside a spoiler tag if you want).
- Ensure that your code doesn't unintentionally break the existing features or tests.

## Code Style
This is a standard Express.js application. Please try to match the existing code style:
- Use standard ES6 syntax where applicable.
- Ensure that the intentional flaws are clear in the code (adding a comment like `// VULNERABILITY: ...` is highly encouraged).

Thank you for helping make SecureTrust Bank a great learning tool!
