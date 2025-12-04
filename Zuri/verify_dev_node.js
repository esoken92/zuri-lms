const fs = require('fs');
(async () => {
  const base = 'http://localhost:5000';
  try {
    const r = await fetch(base + '/api/auth/dev-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'devtester', role: 'Administrator' })
    });

    const text = await r.text();
    fs.writeFileSync('tmp_devlogin_response.txt', text, 'utf8');

    const setCookie = r.headers.get('set-cookie') || r.headers.get('Set-Cookie');
    const cookie = setCookie ? setCookie.split(';')[0] : null;
    if (!cookie) fs.appendFileSync('tmp_devlogin_response.txt', '\nNO_COOKIE_RECEIVED');

    try {
      const me = await fetch(base + '/me', {
        method: 'GET',
        headers: cookie ? { Cookie: cookie } : {}
      });
      const meText = await me.text();
      fs.writeFileSync('tmp_me_response.txt', meText, 'utf8');
    } catch (e) {
      try {
        const me2 = await fetch(base + '/api/me', {
          method: 'GET',
          headers: cookie ? { Cookie: cookie } : {}
        });
        const meText2 = await me2.text();
        fs.writeFileSync('tmp_me_response.txt', meText2, 'utf8');
      } catch (e2) {
        fs.writeFileSync('tmp_me_error.txt', e2.toString(), 'utf8');
      }
    }
  } catch (err) {
    fs.writeFileSync('tmp_devlogin_error.txt', err.toString(), 'utf8');
  }
})();
