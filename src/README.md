# YouTube Music API Proxy Frontend

This directory contains the TypeScript frontend for the YouTube Music API Proxy application.

## Project Structure

```
src/
├── css/           # SCSS/CSS source files
│   ├── main.scss  # Main SCSS entry point
│   └── *.css      # Individual component styles
├── js/            # TypeScript/JavaScript source files
│   ├── app.ts     # Main application entry point
│   ├── constants.ts # Application constants and types
│   └── *.js       # Other modules (to be converted to TypeScript)
├── package.json   # Node.js dependencies and scripts
├── tsconfig.json  # TypeScript configuration
├── webpack.config.js # Webpack build configuration
├── build.ps1      # PowerShell build script
└── README.md      # This file
```

## Prerequisites

- Node.js (v16 or higher)
- npm (comes with Node.js)
- PowerShell (for build scripts)

## Quick Start

1. **Install dependencies:**
   ```powershell
   cd src
   npm install
   ```

2. **Build for development:**
   ```powershell
   .\build.ps1
   ```

3. **Build for production (minified):**
   ```powershell
   .\build.ps1 -Production
   ```

4. **Watch mode (auto-rebuild on changes):**
   ```powershell
   .\build.ps1 -Watch
   ```

5. **Clean build:**
   ```powershell
   .\build.ps1 -Clean
   ```

## Build Output

The build process generates the following files in the `../wwwroot/` directory:

- `app.js` - Minified JavaScript bundle
- `styles.css` - Minified CSS bundle
- `vendors.js` - Third-party dependencies (if any)

## Development Workflow

1. **Development Mode:**
   - Run `.\build.ps1 -Watch` to start watch mode
   - Make changes to TypeScript/SCSS files
   - Files are automatically rebuilt and output to `wwwroot/`

2. **Production Build:**
   - Run `.\build.ps1 -Production` for optimized, minified output
   - This removes console logs and debugger statements
   - CSS and JS are minified for smaller file sizes

## TypeScript Conversion Status

- ✅ `app.js` → `app.ts` (converted)
- ✅ `constants.js` → `constants.ts` (converted)
- ⏳ Other modules (pending conversion)

## Available Scripts

- `npm run build` - Production build
- `npm run build:dev` - Development build
- `npm run watch` - Watch mode
- `npm run clean` - Clean build artifacts
- `npm run type-check` - TypeScript type checking
- `npm run lint` - ESLint code linting

## Configuration Files

- **tsconfig.json**: TypeScript compiler options
- **webpack.config.js**: Webpack bundling configuration
- **package.json**: Dependencies and scripts

## Notes

- The build system automatically handles CSS imports and bundling
- Source maps are generated in development mode
- Production builds are optimized and minified
- The build output is compatible with the existing ASP.NET Core application
