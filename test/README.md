# Test Tools

This directory contains automated testing tools for the YouTube Music API Proxy.

## Files

- `test-headless.js` - Comprehensive headless browser test using Puppeteer

## Prerequisites

Make sure you have Node.js and npm installed, then install the required dependencies:

```bash
npm install puppeteer
```

## Usage

### Running the Headless Browser Test

```bash
node test/test-headless.js
```

This test will:

1. **Launch a headless browser** (Chrome/Chromium)
2. **Navigate to the application** at `http://localhost/index.html`
3. **Check all UI elements** for existence and visibility
4. **Test JavaScript managers** (playerManager, contentManager, etc.)
5. **Test API endpoints** (health, search, song info)
6. **Test user interactions** (clicking buttons, typing in inputs)
7. **Provide comprehensive status report**

### What the Test Checks

#### UI Elements
- All player controls (play, pause, next, previous, repeat, shuffle)
- Navigation items (Library, Songs, Artists, Albums)
- Sidebar and right sidebar elements
- Search functionality
- Progress bar and volume controls

#### JavaScript Functionality
- All manager objects (playerManager, contentManager, etc.)
- Global functions (playSong, pauseSong, etc.)
- API integration
- Event listeners

#### API Endpoints
- Health check (`/api`)
- Search functionality (`/api/search`)
- Song information (`/api/song/{id}`)

### Test Results

The test provides detailed output including:

- ✅ **Success indicators** for working functionality
- ❌ **Error messages** for failed operations
- ⚠️ **Warnings** for missing elements
- 📊 **Detailed status reports** for all components

### Troubleshooting

If the test fails:

1. **Ensure the API is running** on `http://localhost`
2. **Check that Puppeteer is installed**: `npm install puppeteer`
3. **Verify the application is accessible** in a regular browser
4. **Check console output** for specific error messages

### Customization

You can modify the test script to:

- **Change the target URL** by modifying the `page.goto()` call
- **Add new element checks** by adding IDs to the `allIds` array
- **Test additional API endpoints** by adding new fetch calls
- **Modify timing** by changing the `setTimeout` values

## Notes

- The test uses a **non-headless browser** by default for debugging
- Set `headless: true` in the browser launch options for automated testing
- The test includes comprehensive logging for debugging purposes
