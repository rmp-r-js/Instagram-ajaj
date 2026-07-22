const express = require('express');
const { IgApiClient } = require('instagram-private-api');

const app = express();
const port = process.env.PORT || 3000;

// ============================================================
// 🔐 TERI REAL COOKIES (JSON se hardcoded)
// ============================================================
const USERNAME = 'the.mindzenic';

// 🌍 User-Agent (Chrome 120 – jo tune cookies li thi usi ka)
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// 🍪 Sab cookies – as per teri list
const COOKIES = {
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

// ============================================================
// 🚀 EXPRESS ROUTE
// ============================================================
app.get('/', async (req, res) => {
  const ig = new IgApiClient();

  try {
    // 1️⃣ Device generate
    ig.state.generateDevice(USERNAME);
    
    // 2️⃣ Exact User-Agent set
    ig.state.userAgent = USER_AGENT;

    // 3️⃣ Saari cookies inject karo (domain .instagram.com, path /)
    const domain = '.instagram.com';
    const url = 'https://www.instagram.com';

    await ig.state.cookieJar.setCookie(
      `sessionid=${COOKIES.sessionid}; Domain=${domain}; Path=/; Secure; HttpOnly;`,
      url
    );
    await ig.state.cookieJar.setCookie(
      `ds_user_id=${COOKIES.ds_user_id}; Domain=${domain}; Path=/; Secure;`,
      url
    );
    await ig.state.cookieJar.setCookie(
      `csrftoken=${COOKIES.csrftoken}; Domain=${domain}; Path=/; Secure;`,
      url
    );
    await ig.state.cookieJar.setCookie(
      `ig_did=${COOKIES.ig_did}; Domain=${domain}; Path=/; Secure; HttpOnly;`,
      url
    );
    await ig.state.cookieJar.setCookie(
      `mid=${COOKIES.mid}; Domain=${domain}; Path=/; Secure;`,
      url
    );
    await ig.state.cookieJar.setCookie(
      `datr=${COOKIES.datr}; Domain=${domain}; Path=/; Secure; HttpOnly;`,
      url
    );
    await ig.state.cookieJar.setCookie(
      `rur=${COOKIES.rur}; Domain=${domain}; Path=/; Secure; HttpOnly;`,
      url
    );
    await ig.state.cookieJar.setCookie(
      `ps_n=${COOKIES.ps_n}; Domain=${domain}; Path=/; Secure; HttpOnly;`,
      url
    );
    await ig.state.cookieJar.setCookie(
      `ps_l=${COOKIES.ps_l}; Domain=${domain}; Path=/; Secure; HttpOnly;`,
      url
    );
    await ig.state.cookieJar.setCookie(
      `wd=${COOKIES.wd}; Domain=${domain}; Path=/; Secure;`,
      url
    );
    await ig.state.cookieJar.setCookie(
      `dpr=${COOKIES.dpr}; Domain=${domain}; Path=/; Secure;`,
      url
    );

    console.log('[LOG] ✅ Saari cookies inject ho gayin! Ab user info le raha hu...');

    // 4️⃣ User ID se info fetch (login call nahi)
    const userId = parseInt(COOKIES.ds_user_id, 10);
    const userInfo = await ig.account.userInfo(userId);

    // 5️⃣ Response
    res.json({
      status: 'success',
      data: {
        username: userInfo.username,
        followers: userInfo.follower_count,
        following: userInfo.following_count,
        full_name: userInfo.full_name,
        id: userInfo.pk
      }
    });

  } catch (error) {
    console.error('[ERROR] ❌:', error.message);

    if (error.message && (error.message.includes('checkpoint') || error.message.includes('challenge'))) {
      return res.status(401).json({
        status: 'checkpoint_required',
        message: 'Render ka IP mismatch – proxy laga, ya pehle phone se login kar ke IP allow kar.'
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
  console.log('🔥 Saari cookies hardcoded hain – ab chalega!');
});