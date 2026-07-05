const { IgApiClient } = require('instagram-private-api');

// Initialize client
const ig = new IgApiClient();

async function start() {
  const username = 'YOUR_IG_USERNAME';
  const password = 'YOUR_IG_PASSWORD';

  try {
    // 1. Apne account ke liye ek unique device fingerprint generate karo (Bans avoid karne ke liye bohot zaroori hai)
    ig.state.generateDevice(username);

    console.log('Logging in...');
    // 2. Perform the login
    const loggedInUser = await ig.account.login(username, password);
    console.log(`✅ Login successful! Welcome @${loggedInUser.username}`);

    // 3. Apni profile ka additional data fetch karte hain
    const userInfo = await ig.account.userInfo(loggedInUser.pk);
    
    console.log('--- Account Stats ---');
    console.log(`Followers: ${userInfo.follower_count}`);
    console.log(`Following: ${userInfo.following_count}`);

    // Yahan se aage tum DMs bhejne, feeds read karne, ya posts upload karne ka logic add kar sakte ho.

  } catch (error) {
    console.error('❌ Error occurred:', error.message);
  }
}

start();
