/* ==========================================================================
   Menu Repository
   يخزّن بيانات المنيو (نفس بنية MENU_CONFIG_ALT من القالب) كنص JSON مُرمّز
   Base64 داخل محتوى تدوينة مسودة (Draft) مخفية عن الزوار، ويقرأها/يكتبها
   عبر Blogger API. هذه هي نقطة الوصل الوحيدة بين لوحة التحكم والقالب.
   ========================================================================== */
(function(){
  var CACHE_KEY = 'balkony_menu_post_id';

  function getBlogId(){
    return window.APP_CONFIG.BLOG_ID;
  }

  function encode(dataObj){
    var json = JSON.stringify(dataObj);
    return btoa(unescape(encodeURIComponent(json)));
  }

  function decode(encoded){
    var json = decodeURIComponent(escape(atob(encoded)));
    return JSON.parse(json);
  }

  // يستخرج النص المرمّز من محتوى HTML للتدوينة (نضعه داخل <pre id="menu-json">)
  function extractEncodedFromContent(html){
    var match = html && html.match(/<pre id="menu-json"[^>]*>([\s\S]*?)<\/pre>/);
    return match ? match[1].trim() : null;
  }

  function wrapContent(encoded){
    return '<p>بيانات منيو Balkony — لا تحذف هذه التدوينة ولا تعدّلها يدويًا، لوحة التحكم تديرها تلقائيًا. '
      + 'هذه التدوينة منشورة (وليست مسودة) عن قصد حتى يستطيع قالب المنيو قراءتها من متصفح أي زائر دون تسجيل دخول؛ '
      + 'محتواها مُرمّز Base64 وغير قابل للقراءة المباشرة، وهي غير مرتبطة من أي مكان بالموقع.</p>'
      + '<pre id="menu-json" style="display:none">' + encoded + '</pre>';
  }

  function getCachedPostId(){
    return sessionStorage.getItem(CACHE_KEY);
  }
  function setCachedPostId(id){
    sessionStorage.setItem(CACHE_KEY, id);
  }

  function findDataPost(){
    var cachedId = getCachedPostId();
    if(cachedId){
      return window.BloggerAPI.getPost(getBlogId(), cachedId).catch(function(){
        sessionStorage.removeItem(CACHE_KEY);
        return null;
      });
    }
    return window.BloggerAPI.findPostByTitle(getBlogId(), window.APP_CONFIG.MENU_DATA_POST_TITLE)
      .then(function(post){
        if(post) setCachedPostId(post.id);
        return post;
      });
  }

  // يجلب بيانات المنيو الحالية. إن لم توجد تدوينة بعد، يعيد null (أول استخدام)
  function getMenuData(){
    return findDataPost().then(function(post){
      if(!post) return null;
      var encoded = extractEncodedFromContent(post.content);
      if(!encoded) return null;
      return decode(encoded);
    });
  }

  // يحفظ بيانات المنيو: يُنشئ التدوينة المخفية إن لم تكن موجودة، أو يحدّثها
  function saveMenuData(dataObj){
    var blogId = getBlogId();
    var encoded = encode(dataObj);
    var content = wrapContent(encoded);

    return findDataPost().then(function(post){
      if(post){
        return window.BloggerAPI.updatePost(blogId, post.id, {
          title: window.APP_CONFIG.MENU_DATA_POST_TITLE,
          content: content
        });
      }
      return window.BloggerAPI.createPost(blogId, {
        title: window.APP_CONFIG.MENU_DATA_POST_TITLE,
        content: content,
        labels: ['__system__']
      }, /* isDraft */ false).then(function(created){
        setCachedPostId(created.id);
        return created;
      });
    });
  }

  window.MenuRepository = {
    getMenuData: getMenuData,
    saveMenuData: saveMenuData
  };
})();
