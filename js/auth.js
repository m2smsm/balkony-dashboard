/* ==========================================================================
   Auth — تسجيل الدخول بحساب Google (Google Identity Services)
   يمنح توكن وصول لـ Blogger API مباشرة من المتصفح، بدون أي سيرفر خلفي.
   ========================================================================== */
(function(){
  var TOKEN_KEY = 'balkony_gis_token';
  var PROFILE_KEY = 'balkony_gis_profile';
  var tokenClient = null;

  function saveSession(tokenResponse, profile){
    var expiresAt = Date.now() + (Number(tokenResponse.expires_in || 3500) * 1000);
    sessionStorage.setItem(TOKEN_KEY, JSON.stringify({
      access_token: tokenResponse.access_token,
      expires_at: expiresAt
    }));
    if(profile) sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }

  function getStoredToken(){
    try{
      var raw = sessionStorage.getItem(TOKEN_KEY);
      if(!raw) return null;
      var data = JSON.parse(raw);
      if(!data.access_token || Date.now() >= data.expires_at) return null;
      return data.access_token;
    }catch(e){ return null; }
  }

  function getProfile(){
    try{
      var raw = sessionStorage.getItem(PROFILE_KEY);
      return raw ? JSON.parse(raw) : null;
    }catch(e){ return null; }
  }

  function isLoggedIn(){
    return !!getStoredToken();
  }

  function logout(){
    var token = getStoredToken();
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(PROFILE_KEY);
    if(token && window.google && google.accounts && google.accounts.oauth2){
      google.accounts.oauth2.revoke(token, function(){});
    }
    window.location.href = 'index.html';
  }

  // يجلب بيانات الملف الشخصي (اسم/صورة) عبر userinfo endpoint باستخدام نفس التوكن
  function fetchProfile(accessToken){
    return fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: 'Bearer ' + accessToken }
    }).then(function(res){
      if(!res.ok) throw new Error('تعذر جلب بيانات الحساب');
      return res.json();
    });
  }

  // يبدأ تدفق تسجيل الدخول ويعيد Promise<accessToken>
  function login(){
    return new Promise(function(resolve, reject){
      if(!window.google || !google.accounts || !google.accounts.oauth2){
        reject(new Error('تعذر تحميل مكتبة تسجيل الدخول من Google. تحقق من الاتصال بالإنترنت.'));
        return;
      }
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: window.APP_CONFIG.GOOGLE_CLIENT_ID,
        scope: window.APP_CONFIG.OAUTH_SCOPE,
        callback: function(response){
          if(response.error){ reject(new Error(response.error)); return; }
          fetchProfile(response.access_token).then(function(profile){
            saveSession(response, profile);
            resolve(response.access_token);
          }).catch(function(){
            saveSession(response, null);
            resolve(response.access_token);
          });
        },
        error_callback: function(err){
          reject(new Error(err && err.message ? err.message : 'فشل تسجيل الدخول'));
        }
      });
      tokenClient.requestAccessToken({ prompt: 'select_account' });
    });
  }

  // يتأكد من وجود جلسة صالحة قبل دخول صفحات لوحة التحكم، وإلا يعيد التوجيه لصفحة الدخول
  function requireAuth(){
    if(!isLoggedIn()){
      window.location.href = 'index.html';
      return false;
    }
    return true;
  }

  window.Auth = {
    login: login,
    logout: logout,
    isLoggedIn: isLoggedIn,
    getToken: getStoredToken,
    getProfile: getProfile,
    requireAuth: requireAuth
  };
})();
