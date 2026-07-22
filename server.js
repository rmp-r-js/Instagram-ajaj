const express = require('express');
const { CookieLoader } = require('insta-chat-api');

const app = express();
const port = process.env.PORT || 3000;

// ============================================================
// 🔐 TERI COOKIES (JSON se)
// ============================================================
const cookies = {
  sessionid: '27668585804%3AdS58wogpeC57vV%3A13%3AAYixIs7tGB_wD_tf_XiDlBuF-8a2ftstFpG3e5P9EQ',
  ds_user_id: '27668585804',
  csrftoken: 'HSJPTuejTST-ZIgFa6eDHx',
  ig_did: '3527E059-6B2B-44F1-AF66-7EC3539F94B4',
  mid: 'al-LWwABAAEXkXMLldzgepEOx1bI',
  datr: 'W4tfakhIslRusnqAA_DmZL43',
  rur: 'CCO%2C17841427654128573%2C1785893838%3A01ffda87642ad8b73c954cae418943e5084109bda7771a80e9a33bc3826c54531a0b1735',
  ps_n: '1',
  ps_l: '1',
  wd: '360x668',
  dpr: '2'
};

let igClient = null;

// ============================================================
// 🔄 INIT – Cookies load karke client bana
// ============================================================
async function initClient() {
  if (igClient) return igClient;

  const loader = new CookieLoader();
  // Load cookies from object
  await loader.loadCookies(cookies);
  // Get the authenticated client
  igClient = loader.getClient();
  console.log('[LOG] ✅ Instagram client initialized with cookies!');
  return igClient;
}

// ============================================================
// 🚀 EXPRESS ROUTE
// ============================================================
app.get('/', async (req, res) => {
  try {
    const client = await initClient();

    // Username ka profile info fetch
    const user = await client.getUserInfo('the.mindzenic');

    res.json({
      status: 'success',
      data: {
        username: user.username,
        followers: user.followerCount,
        following: user.followingCount,
        full_name: user.fullName,
        id: user.id
      }
    });

  } catch (error) {
    console.error('[ERROR] ❌:', error.message);

    // Agar error mein "checkpoint" ya "challenge" ho toh
    if (error.message && (error.message.includes('checkpoint') || error.message.includes('challenge'))) {
      return res.status(401).json({
        status: 'checkpoint_required',
        message: 'Cookies expired ya IP mismatch. Naya sessionid nikaal aur update kar.'
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
app.listen(port, async () => {
  console.log(`🚀 Server port ${port} par start ho gaya hai`);
  // Pehle se hi client init kar lo
  try {
    await initClient();
    console.log('🔥 Session active – sab ready hai!');
  } catch (e) {
    console.warn('⚠️ Init me error, but server chal raha hai:', e.message);
  }
});