/* ==========================================================================
   Blogger API v3 — طبقة اتصال عامة (Posts فقط، هي ما يدعمه الـ API للكتابة)
   التوثيق: https://developers.google.com/blogger/docs/3.0/reference
   ========================================================================== */
(function(){
  var BASE = 'https://www.googleapis.com/blogger/v3';

  function authHeaders(){
    var token = window.Auth.getToken();
    if(!token) throw new Error('انتهت الجلسة، الرجاء تسجيل الدخول من جديد');
    return { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' };
  }

  function handle(res){
    if(res.status === 401){
      window.Auth.logout();
      throw new Error('انتهت صلاحية الجلسة');
    }
    if(!res.ok){
      return res.json().catch(function(){ return {}; }).then(function(body){
        var msg = (body.error && body.error.message) || ('خطأ في الاتصال بـ Blogger API (' + res.status + ')');
        throw new Error(msg);
      });
    }
    return res.json();
  }

  var BloggerAPI = {
    // يبحث عن تدوينة بعنوان محدد (تُستخدم لإيجاد تدوينة بيانات المنيو المخفية)
    // يشمل المسودات (status=ALL) لأن تدوينة البيانات لا يجب أن تكون منشورة للعامة
    findPostByTitle: function(blogId, title){
      var url = BASE + '/blogs/' + blogId + '/posts/search'
        + '?q=' + encodeURIComponent(title)
        + '&fetchBodies=true&status=ALL';
      return fetch(url, { headers: authHeaders() }).then(handle).then(function(data){
        var items = data.items || [];
        return items.find(function(p){ return p.title === title; }) || null;
      });
    },

    getPost: function(blogId, postId){
      var url = BASE + '/blogs/' + blogId + '/posts/' + postId + '?view=AUTHOR';
      return fetch(url, { headers: authHeaders() }).then(handle);
    },

    createPost: function(blogId, payload, isDraft){
      var url = BASE + '/blogs/' + blogId + '/posts/?isDraft=' + (isDraft ? 'true' : 'false');
      return fetch(url, { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) }).then(handle);
    },

    updatePost: function(blogId, postId, payload){
      var url = BASE + '/blogs/' + blogId + '/posts/' + postId + '?revert=false';
      return fetch(url, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(payload) }).then(handle);
    },

    // يجلب بيانات المدونة نفسها (يشمل رابطها العام) — تُستخدم لتوليد QR للمنيو
    getBlog: function(blogId){
      var url = BASE + '/blogs/' + blogId;
      return fetch(url, { headers: authHeaders() }).then(handle);
    }
  };

  window.BloggerAPI = BloggerAPI;
})();
