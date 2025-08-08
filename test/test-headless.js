const puppeteer = require('puppeteer');

async function testJavaScript() {
    console.log('🚀 Starting comprehensive headless browser test...');

    const browser = await puppeteer.launch({
        headless: false, // Set to true for headless mode
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized', '--window-size=1920,1080']
    });

    try {
        const page = await browser.newPage();

        // Set viewport to a large size for better visibility
        await page.setViewport({
            width: 1920,
            height: 1080,
            deviceScaleFactor: 1
        });

        // Enable console logging
        page.on('console', msg => {
            console.log('📱 Browser Console:', msg.text());
        });

        page.on('pageerror', error => {
            console.error('❌ Page Error:', error.message);
        });

        console.log('🌐 Navigating to application...');
        await page.goto('http://localhost/index.html', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        console.log('⏳ Waiting for page to load...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Comprehensive element check
        console.log('🔍 Checking ALL elements...');
        const allElements = await page.evaluate(() => {
            const elements = {};

            // Check all IDs
            const allIds = [
                'sidebar', 'sidebarToggle', 'mobileMenuToggle', 'searchInput', 'rightSidebarMobileToggle',
                'mainContent', 'contentArea', 'welcomeSection', 'searchResults', 'libraryContent',
                'loading', 'error', 'rightSidebar', 'rightSidebarResizeHandle', 'rightSidebarToggle',
                'infoTab', 'lyricsTab', 'infoPanel', 'lyricsPanel', 'playerBar',
                'nowPlayingThumbnail', 'nowPlayingTitle', 'nowPlayingArtist',
                'playButton', 'pauseButton', 'stopButton', 'nextButton', 'prevButton',
                'repeatButton', 'shuffleButton', 'progressBar', 'progressFill',
                'volumeSlider', 'volumeFill', 'volumeThumb', 'notificationContainer',
                'libraryNavItem', 'songsNavItem', 'artistsNavItem', 'albumsNavItem',
                'playlistsSection', 'playlistsList'
            ];

            allIds.forEach(id => {
                elements[id] = {
                    exists: !!document.getElementById(id),
                    visible: document.getElementById(id) ?
                        document.getElementById(id).style.display !== 'none' : false,
                    text: document.getElementById(id) ?
                        document.getElementById(id).textContent.substring(0, 50) : null
                };
            });

            // Check classes
            const classes = [
                'sidebar', 'main-content', 'player-bar', 'control-buttons', 'search-container',
                'welcome-section', 'nav-item', 'right-sidebar', 'notification-container'
            ];

            classes.forEach(className => {
                const elements = document.getElementsByClassName(className);
                elements[className] = {
                    count: elements.length,
                    visible: elements.length > 0 ?
                        Array.from(elements).some(el => el.style.display !== 'none') : false
                };
            });

            return { ids: elements, classes: elements };
        });

        console.log('📊 All Elements Status:', JSON.stringify(allElements, null, 2));

        // Test JavaScript managers
        console.log('🔍 Testing JavaScript managers...');
        const jsManagers = await page.evaluate(() => {
            const managers = {};

            const managerNames = [
                'playerManager', 'contentManager', 'sidebarManager',
                'notificationManager', 'rightSidebarManager', 'ytmAPI'
            ];

            managerNames.forEach(name => {
                managers[name] = {
                    exists: typeof window[name] !== 'undefined',
                    type: typeof window[name],
                    hasInit: typeof window[name]?.init === 'function',
                    hasMethods: typeof window[name] === 'object' ?
                        Object.keys(window[name]).filter(key => typeof window[name][key] === 'function').length : 0
                };
            });

            return managers;
        });

        console.log('📊 JavaScript Managers:', JSON.stringify(jsManagers, null, 2));

        // Test API functionality
        console.log('🔍 Testing API endpoints...');
        const apiTests = await page.evaluate(async () => {
            const tests = {};

            // Test health endpoint
            try {
                const healthResponse = await fetch('/api');
                const healthData = await healthResponse.json();
                tests.health = { success: true, data: healthData };
            } catch (error) {
                tests.health = { success: false, error: error.message };
            }

            // Test search endpoint
            try {
                const searchResponse = await fetch('/api/search?query=test');
                const searchData = await searchResponse.json();
                tests.search = { success: true, results: searchData.results?.length || 0 };
            } catch (error) {
                tests.search = { success: false, error: error.message };
            }

            // Test song endpoint
            try {
                const songResponse = await fetch('/api/song/ipzIYkVthno');
                const songData = await songResponse.json();
                tests.song = { success: true, title: songData.title || songData.name };
            } catch (error) {
                tests.song = { success: false, error: error.message };
            }

            return tests;
        });

        console.log('📊 API Tests:', JSON.stringify(apiTests, null, 2));

        // Wait for playlists to load and print first playlist name
        console.log('🔍 Waiting for playlists to load...');
        try {
            // Wait for the playlists section to be visible and populated
            await page.waitForSelector('#playlistsList', { timeout: 10000 });

            // Wait for playlist items to appear
            await page.waitForSelector('#playlistsList .playlist-item', { timeout: 15000 });

            // Get the first playlist name
            const firstPlaylistName = await page.evaluate(() => {
                const firstPlaylist = document.querySelector('#playlistsList .playlist-item');
                if (firstPlaylist) {
                    const titleElement = firstPlaylist.querySelector('h4');
                    return titleElement ? titleElement.textContent : 'No title found';
                }
                return 'No playlists found';
            });

            console.log('📋 First playlist name:', firstPlaylistName);

            // Also check how many playlists are loaded
            const playlistCount = await page.evaluate(() => {
                const playlists = document.querySelectorAll('#playlistsList .playlist-item');
                return playlists.length;
            });

            console.log('📊 Total playlists loaded:', playlistCount);

        } catch (error) {
            console.log('❌ Failed to load playlists:', error.message);
        }

        // Test user interactions
        console.log('🔍 Testing user interactions...');

        // Test clicking play button
        try {
            await page.click('#playButton');
            console.log('✅ Play button clicked successfully');
        } catch (error) {
            console.log('❌ Failed to click play button:', error.message);
        }

        // Test clicking repeat button
        try {
            await page.click('#repeatButton');
            console.log('✅ Repeat button clicked successfully');
        } catch (error) {
            console.log('❌ Failed to click repeat button:', error.message);
        }

        // Test clicking shuffle button
        try {
            await page.click('#shuffleButton');
            console.log('✅ Shuffle button clicked successfully');
        } catch (error) {
            console.log('❌ Failed to click shuffle button:', error.message);
        }

        // Test navigation items
        try {
            await page.click('#libraryNavItem');
            console.log('✅ Library nav item clicked successfully');
        } catch (error) {
            console.log('❌ Failed to click library nav item:', error.message);
        }

        // Test typing in search (if it exists)
        const searchInput = await page.$('#searchInput');
        if (searchInput) {
            try {
                await page.type('#searchInput', 'test search');
                console.log('✅ Search input typed successfully');
            } catch (error) {
                console.log('❌ Failed to type in search input:', error.message);
            }
        } else {
            console.log('⚠️ Search input not found');
        }

        // Test sidebar toggle (if it exists)
        const sidebarToggle = await page.$('#sidebarToggle');
        if (sidebarToggle) {
            try {
                await page.click('#sidebarToggle');
                console.log('✅ Sidebar toggle clicked successfully');
            } catch (error) {
                console.log('❌ Failed to click sidebar toggle:', error.message);
            }
        } else {
            console.log('⚠️ Sidebar toggle not found');
        }

        // Wait for any delayed effects
        console.log('⏳ Waiting for delayed effects...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Final comprehensive check
        console.log('🔍 Final comprehensive check...');
        const finalCheck = await page.evaluate(() => {
            return {
                documentReady: document.readyState,
                bodyClasses: document.body.className,
                userInteracted: document.body.classList.contains('user-interacted'),
                currentAudio: !!window.currentAudio,
                currentSongInfo: !!window.currentSongInfo,
                allManagersLoaded: {
                    playerManager: !!window.playerManager,
                    contentManager: !!window.contentManager,
                    sidebarManager: !!window.sidebarManager,
                    notificationManager: !!window.notificationManager,
                    rightSidebarManager: !!window.rightSidebarManager,
                    ytmAPI: !!window.ytmAPI
                },
                globalFunctions: {
                    playSong: typeof window.playSong === 'function',
                    pauseSong: typeof window.pauseSong === 'function',
                    nextSong: typeof window.nextSong === 'function',
                    previousSong: typeof window.previousSong === 'function',
                    toggleSidebar: typeof window.toggleSidebar === 'function',
                    handleSearch: typeof window.handleSearch === 'function'
                }
            };
        });

        console.log('📊 Final Comprehensive Check:', JSON.stringify(finalCheck, null, 2));

        console.log('✅ Comprehensive test completed successfully!');

        // Keep browser open for inspection
        console.log('🔍 Keeping browser open for 30 seconds for inspection...');
        await new Promise(resolve => setTimeout(resolve, 30000));
        console.log('⏰ Inspection time completed');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
        console.log('🔚 Browser closed');
    }
}

testJavaScript().catch(console.error);
