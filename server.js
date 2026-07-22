const express = require('express');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

// ============================================================
// 🔐 TERI COOKIES (Hardcoded)
// ============================================================
const USERNAME = 'the.mindzenic';

const COOKIE_STRING =
  `sessionid=27668585804%3AdS58wogpeC57vV%3A13%3AAYixIs7tGB_wD_tf_XiDlBuF-8a2ftstFpG3e5P9EQ; ` +
  `ds_user_id=27668585804; ` +
  `csrftoken=HSJPTuejTST-ZIgFa6eDHx; ` +
  `ig_did=3527E059-6B2B-44F1-AF66-7EC3539F94B4; ` +
  `mid=al-LWwABAAEXkXMLldzgepEOx1bI; ` +
  `datr=W4tfakhIslRusnqAA_DmZL43; ` +
  `rur=CCO%2C17841427654128573%2C1785893838%3A01ffda87642ad8b73c954cae418943e5084109bda7771a80e9a33bc3826c54531a0b1735; ` +
  `ps_n=1; ps_l=1; wd=360x668; dpr=2`;

// ============================================================
// 🧠 USER-AGENT POOL (Mobile + Desktop)
// ============================================================
const userAgents = [
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.230 Mobile Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

function getRandomUserAgent() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

// ============================================================
// 🚀 FETCH FUNCTION (with retry)
// ============================================================
async function fetchUserInfo(username, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Random delay between 1-3 seconds to avoid rate limit
      if (attempt > 1) {
        const delay = 1000 + Math.random() * 2000;
        await new Promise(r => setTimeout(r, delay));
      }

      const response = await axios.get(
        `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
        {
          headers: {
            'User-Agent': getRandomUserAgent(),
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Cookie': COOKIE_STRING,
            'X-Requested-With': 'XMLHttpRequest',
            'X-IG-App-ID': '936619743392459',
            'Referer': 'https://www.instagram.com/',
            'Origin': 'https://www.instagram.com',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin'
          },
          timeout: 10000
        }
      );

      const user = response.data?.data?.user;
      if (!user) throw new Error('User not found in response');

      return {
        username: user.username,
        followers: user.edge_followed_by?.count || 0,
        following: user.edge_follow?.count || 0,
        full_name: user.full_name || '',
        id: user.id || user.pk
      };

    } catch (error) {
      // Agar 429 ya network error ho toh retry
      if (error.response && error.response.status === 429) {
        console.log(`[WARN] 429 – Attempt ${attempt}/${retries}`);
        continue;
      }
      // Agar 401/403 – cookies expired
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        throw new Error('Cookies expired or invalid. Please update sessionid.');
      }
      // Any other error – propagate
      throw error;
    }
  }
  throw new Error('Rate limit exceeded after retries');
}

// ============================================================
// 🚀 EXPRESS ROUTE
// ============================================================
app.get('/', async (req, res) => {
  try {
    const data = await fetchUserInfo(USERNAME);
    res.json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('[ERROR]', error.message);
    const status = error.message.includes('expired') ? 401 : 500;
    res.status(status).json({
      status: 'failed',
      error: error.message
    });
  }
});

// ============================================================
// 🚀 SERVER START
// ============================================================
app.listen(port, () => {
  console.log(`🚀 Server port ${port} par start ho gaya hai`);
  console.log('🔥 Axios with cookies + retry – ready to rock!');
});