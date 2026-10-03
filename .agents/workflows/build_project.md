---
description: Build the LinkFlow NextJS Application
---

# Build Project

This workflow installs dependencies and compiles the Next.js application.

1. Ensure you are in the correct directory (the project root).
   ```bash
   cd c:\Users\maske\Downloads\NIS-MANA
   ```

2. Install the necessary dependencies (Node module dependencies).
   // turbo
   ```bash
   cmd.exe /c "npm install"
   ```

3. Typecheck the codebase to catch any errors.
   // turbo
   ```bash
   cmd.exe /c "npm run typecheck"
   ```

4. Build the application for production.
   // turbo
   ```bash
   cmd.exe /c "npm run build"
   ```
