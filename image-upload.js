/* ==========================================================================
   Image Upload — نظام رفع صور Modular وقابل للتبديل
   ==========================================================================
   الفكرة: أي مكان بالواجهة يحتاج رفع صورة يستدعي فقط:
       window.ImageUpload.upload(file).then(url => ...)
   ولا يعرف/يهتم من أين جاء الرابط. لإضافة مزوّد رفع جديد مستقبلاً
   (مثلاً عبر Blogger لو صار الرفع متاحًا، أو أي CDN خاص) يكفي:
       window.ImageUpload.registerProvider('اسم-المزود', function(file){
         return Promise.resolve('https://...رابط الصورة بعد الرفع');
       });
   ثم تغيير window.APP_CONFIG.IMAGE_UPLOAD_PROVIDER لاسم المزوّد الجديد —
   بدون أي تعديل على باقي الكود (products.js / product-form.js).
   ========================================================================== */
(function(){
  var providers = {};

  function registerProvider(name, handlerFn){
    providers[name] = handlerFn;
  }

  function isProviderAvailable(name){
    return typeof providers[name] === 'function';
  }

  // upload(file, providerName?) => Promise<string لرابط الصورة>
  function upload(file, providerName){
    var name = providerName || (window.APP_CONFIG && window.APP_CONFIG.IMAGE_UPLOAD_PROVIDER);
    var handler = providers[name];
    if(!handler){
      return Promise.reject(new Error('مزوّد رفع الصور "' + name + '" غير مُفعّل حاليًا'));
    }
    return handler(file);
  }

  // -------- مزوّد Blogger (مجهّز للمستقبل) --------
  // Blogger API v3 العام لا يوفر endpoint لرفع الوسائط (الصور) حاليًا —
  // فقط Posts/Pages نصية. عند توفر طريقة رسمية (أو خدمة وسيطة تديرها أنت
  // بنفسك لاحقًا)، استبدل جسم هذه الدالة بمنطق الرفع الفعلي وستعمل تلقائيًا
  // بكل مكان بالواجهة دون أي تعديل إضافي.
  registerProvider('blogger', function(){
    return Promise.reject(new Error(
      'الرفع المباشر غير متاح حاليًا لأن Blogger API لا يوفر رفع وسائط عبر واجهته العامة. الصق رابط الصورة يدويًا بالحقل بالأسفل.'
    ));
  });

  window.ImageUpload = {
    registerProvider: registerProvider,
    isProviderAvailable: isProviderAvailable,
    upload: upload
  };
})();
