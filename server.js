const express = require('express');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

// ============================================================
// 🔐 COOKIES (Teri hi hain)
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
// 🧠 HEADERS (Mobile + Desktop mix – zyada safe)
// ============================================================
const getHeaders = () => ({
  'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Cookie': COOKIE_STRING,
  'X-Requested-With': 'XMLHttpRequest',
  'X-IG-App-ID': '936619743392459',  // common Instagram app ID
  'Referer': 'https://www.instagram.com/',
  'Origin': 'https://www.instagram.com',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin'
});

// ============================================================
// 🚀 ROUTE – with retry
// ============================================================
app.get('/', async (req, res) => {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      // Thoda delay (1 sec) taaki rate limit na lage
      if (attempts > 1) await new Promise(r => setTimeout(r, 2000));

      const response = await axios.get(
        `https://www.instagram.com/api/v1/users/web_profile_info/?username=${USERNAME}`,
        { headers: getHeaders() }
      );

      const user = response.data.data.user;
      if (!user) throw new Error('User not found');

      return res.json({
        status: 'success',
        data: {
          username: user.username,
          followers: user.edge_followed_by.count,
          following: user.edge_follow.count,
          full_name: user.full_name,
          id: user.id
        }
      });

    } catch (error) {
      if (error.response && error.response.status === 429) {
        console.log(`[WARN] 429 – Attempt ${attempts}/${maxAttempts}`);
        continue; // retry
      }
      // Other errors
      console.error('[ERROR]', error.message);
      return res.status(500).json({ status: 'failed', error: error.message });
    }
  }

  // Agar 3 attempts fail ho gaye
  res.status(429).json({
    status: 'rate_limited',
    message: 'Instagram ne rate limit laga di. Thoda der baad try karo, ya proxy use karo.'
  });
});

// ============================================================
// 🚀 SERVER START
// ============================================================
app.listen(port, () => {
  console.log(`🚀 Server port ${port} par start ho gaya hai`);
  console.log('🔥 Hardcoded cookies + retry logic – chal raha hai!');
});