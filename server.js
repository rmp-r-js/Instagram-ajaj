const express = require('express');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

// ============================================================
// 🔐 TERI REAL COOKIES (Hardcoded)
// ============================================================
const USERNAME = 'the.mindzenic';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// 🍪 Saari cookies ko ek string mein jod (key=value; ...)
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
// 🚀 EXPRESS ROUTE
// ============================================================
app.get('/', async (req, res) => {
  try {
    const response = await axios.get(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${USERNAME}`,
      {
        headers: {
          'User-Agent': USER_AGENT,
          'Cookie': COOKIE_STRING,
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': 'https://www.instagram.com/',
          // Optional but helps:
          'x-ig-app-id': '936619743392459' // common IG app ID
        }
      }
    );

    const user = response.data.data.user;
    if (!user) {
      throw new Error('User not found or blocked');
    }

    res.json({
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
    console.error('[ERROR] ❌:', error.message);

    // Agar response 401/403 aaya toh checkpoint
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      return res.status(401).json({
        status: 'checkpoint_required',
        message: 'Cookies expired ya IP mismatch. Naya sessionid nikaal aur hardcode kar.'
      });
    }

    res.status(500).json({
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
  console.log('🔥 Axios + hardcoded cookies – chal raha hai!');
});