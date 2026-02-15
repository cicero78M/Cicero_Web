# Build Troubleshooting Guide

## Issue: Page Not Found Error During Build

### Error Message
```
[Error [PageNotFoundError]: Cannot find module for page: /amplify/khusus] {
  code: 'ENOENT'
}
```

### Root Cause
This error typically occurs when:
1. Dependencies (`node_modules`) are not installed
2. Build cache (`.next` directory) is corrupted or outdated
3. Node.js version doesn't match requirements

### Solution

#### 1. Clean Install Dependencies
```bash
cd cicero-dashboard
rm -rf node_modules package-lock.json
npm install
```

#### 2. Clear Build Cache
```bash
cd cicero-dashboard
npm run clean  # This removes .next directory (or run: rm -rf .next)
npm run build
```

#### 3. Full Clean Build
```bash
cd cicero-dashboard
rm -rf node_modules package-lock.json .next
npm install
npm run build
```

#### 4. Verify Node Version
Ensure you're using Node.js >= 20 as specified in `package.json`:
```bash
node --version  # Should be v20.x or higher
```

### Prevention

For CI/CD pipelines, ensure:
1. Dependencies are installed before build: `npm ci` or `npm install`
2. Cache is cleared if needed: `npm run clean`
3. Node.js version matches requirements

### Successful Build Output
A successful build should show routes like:
```
├ ○ /amplify/khusus                             153 B         262 kB
├ ○ /amplify/khusus/rekap                       153 B         262 kB
```

If these routes are missing from build output, check:
1. Files exist: `app/amplify/khusus/page.jsx` and `app/amplify/khusus/rekap/page.jsx`
2. Files are tracked by git: `git ls-files app/amplify/`
3. No syntax errors in component files
