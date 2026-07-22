const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

let browser;

async function initBrowser() {
  try {
    console.log('⏳ Launching Puppeteer...');
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--window-size=1280,720'
      ],
      timeout: 60000
    });
    console.log('✅ Browser ready');
  } catch (error) {
    console.error('❌ Browser launch failed:', error.message);
    process.exit(1);
  }
}
initBrowser();

app.get('/health', (req, res) => {
  res.json({ status: 'OK', browser: browser ? 'active' : 'inactive' });
});

// ========== 📸 Screenshot endpoint (as before) ==========
app.post('/screenshot', async (req, res) => {
  const { sessionid, targetUrl = 'https://www.instagram.com/' } = req.body;
  if (!sessionid) return res.status(400).json({ success: false, error: '"sessionid" required' });

  let page = null;
  try {
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    await page.setCookie({
      name: 'sessionid',
      value: sessionid,
      domain: '.instagram.com',
      path: '/',
      secure: true,
      httpOnly: false,
      sameSite: 'Lax'
    });

    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.evaluate(() => new Promise(r => setTimeout(r, 3000)));

    const screenshotBuffer = await page.screenshot({ fullPage: true, type: 'png', encoding: 'binary' });
    await page.close();

    const base64 = screenshotBuffer.toString('base64');
    res.json({ success: true, dataUri: `data:image/png;base64,${base64}` });
  } catch (error) {
    if (page) await page.close().catch(() => {});
    console.error('Screenshot error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== 📊 Profile Data endpoint (NEW) ==========
app.post('/profile', async (req, res) => {
  const { sessionid, targetUrl = 'https://www.instagram.com/' } = req.body;
  if (!sessionid) return res.status(400).json({ success: false, error: '"sessionid" required' });

  let page = null;
  try {
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    await page.setCookie({
      name: 'sessionid',
      value: sessionid,
      domain: '.instagram.com',
      path: '/',
      secure: true,
      httpOnly: false,
      sameSite: 'Lax'
    });

    console.log(`📍 Navigating to ${targetUrl} for profile data...`);
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.evaluate(() => new Promise(r => setTimeout(r, 3000)));

    // 🧠 Extract data from page's JavaScript context
    const profileData = await page.evaluate(() => {
      try {
        // Method 1: Try to get from window._sharedData (old method)
        let data = window._sharedData?.entry_data?.ProfilePage?.[0]?.graphql?.user;
        if (data) {
          return {
            username: data.username,
            fullName: data.full_name,
            followers: data.edge_followed_by?.count || 0,
            following: data.edge_follow?.count || 0,
            posts: data.edge_owner_to_timeline_media?.count || 0,
            bio: data.biography || '',
            profilePic: data.profile_pic_url_hd || data.profile_pic_url || '',
            isPrivate: data.is_private || false,
            isVerified: data.is_verified || false
          };
        }

        // Method 2: Fallback – scrape from DOM (if _sharedData not available)
        const username = document.querySelector('h2._ap3a')?.innerText || 
                         document.querySelector('header h2')?.innerText || '';
        const fullName = document.querySelector('h1._ap3a')?.innerText || username;
        const bio = document.querySelector('._ab1w ._ap3a span')?.innerText || '';
        const followerElem = document.querySelector('a[href$="/followers/"] span') || 
                             document.querySelector('._ac2a span')?.innerText;
        const followingElem = document.querySelector('a[href$="/following/"] span') ||
                              document.querySelectorAll('._ac2a span')?.[1]?.innerText;

        // Extract numbers from strings like "1.2M"
        const parseCount = (str) => {
          if (!str) return 0;
          str = str.replace(/,/g, '');
          if (str.includes('M')) return parseFloat(str) * 1e6;
          if (str.includes('K')) return parseFloat(str) * 1e3;
          return parseInt(str, 10) || 0;
        };

        return {
          username: username.trim(),
          fullName: fullName.trim(),
          followers: parseCount(followerElem),
          following: parseCount(followingElem),
          posts: 0, // hard to get from DOM without extra parsing
          bio: bio.trim(),
          profilePic: document.querySelector('img[alt*="profile picture"]')?.src || '',
          isPrivate: false,
          isVerified: false
        };
      } catch (e) {
        return { error: e.message };
      }
    });

    if (profileData.error) {
      throw new Error(`Scrape failed: ${profileData.error}`);
    }

    await page.close();
    console.log(`✅ Profile data fetched for ${profileData.username}`);
    res.json({ success: true, data: profileData });

  } catch (error) {
    if (page) await page.close().catch(() => {});
    console.error('Profile error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => { if (browser) await browser.close(); process.exit(0); });
process.on('SIGINT', async () => { if (browser) await browser.close(); process.exit(0); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📸 Screenshot: POST /screenshot`);
  console.log(`📊 Profile: POST /profile`);
});