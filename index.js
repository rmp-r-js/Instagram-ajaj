const express = require('express');
const { IgApiClient, IgCheckpointError } = require('instagram-private-api');

const app = express();
const port = process.env.PORT || 3000;

app.get('/', async (req, res) => {
  const username = 'YOUR_IG_USERNAME';
  const password = 'YOUR_IG_PASSWORD';

  const ig = new IgApiClient();

  try {
    console.log(`[LOG] API Hit. Device generate kar raha hu for: ${username}`);
    ig.state.generateDevice(username);
    
    // 🔥 OPTIONAL PRO-TIP: Usi phone ka user-agent set karo jisse tumne acct banaya tha
    // ig.state.userAgent = 'Mozilla/5.0 ...'; (agar specific lagana ho)

    console.log('[LOG] Logging in...');
    const loggedInUser = await ig.account.login(username, password);
    console.log(`[LOG] ✅ Login Done! User ID: ${loggedInUser.pk}`);

    const userInfo = await ig.account.userInfo(loggedInUser.pk);
    
    res.json({
      status: 'success',
      data: {
        username: loggedInUser.username,
        followers: userInfo.follower_count,
        following: userInfo.following_count
      }
    });

  } catch (error) {
    // 🔥 CHECKPOINT ERROR HANDLER (Yeh pakdega Instagram ki trick)
    if (error instanceof IgCheckpointError) {
      console.log('[WARN] Instagram ne Checkpoint (Verification) maang liya hai!');
      try {
        // IG ko bolo ki email pe security code bhej de
        await ig.challenge.auto(true); 
        console.log('[LOG] ✅ Security Code (OTP) aapke Email/SMS par bhej diya gaya hai!');
        
        return res.status(401).json({
          status: 'checkpoint_required',
          message: 'Instagram ne bot detect kiya hai. Tera email check kar, OTP aaya hoga. Official app me login karke clear kar pehle.'
        });
      } catch (challengeError) {
        console.error('[ERROR] Challenge auto-resolve nahi hua:', challengeError.message);
      }
    }

    console.error('[ERROR] ❌ Phat gaya:', error.message);
    res.status(500).json({ 
      status: 'failed', 
      error: error.message 
    });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server port ${port} par start ho gaya hai`);
});
