const express = require('express');
const { IgApiClient } = require('instagram-private-api');

const app = express();
const port = process.env.PORT || 3000;

app.get('/', async (req, res) => {
  // Render pe test karne ke liye hardcoded credentials
  const username = 'YOUR_IG_USERNAME';
  const password = 'YOUR_IG_PASSWORD';

  const ig = new IgApiClient();

  try {
    console.log(`[LOG] API Hit hui. Device generate kar raha hu for: ${username}`);
    ig.state.generateDevice(username);
    
    console.log('[LOG] Logging in...');
    const loggedInUser = await ig.account.login(username, password);
    console.log(`[LOG] ✅ Login Done! User ID: ${loggedInUser.pk}`);

    console.log('[LOG] Fetching profile info...');
    const userInfo = await ig.account.userInfo(loggedInUser.pk);
    
    console.log(`[LOG] Data aagaya! Followers: ${userInfo.follower_count}`);

    // Browser par JSON response bhej do
    res.json({
      status: 'success',
      data: {
        username: loggedInUser.username,
        fullName: userInfo.full_name,
        followers: userInfo.follower_count,
        following: userInfo.following_count
      }
    });

  } catch (error) {
    console.error('[ERROR] ❌ Phat gaya:', error.message);
    res.status(500).json({ 
      status: 'failed', 
      error: error.message 
    });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server Render (ya local) ke port ${port} par start ho gaya hai`);
});
