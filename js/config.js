/* ==========================================================================
   إعدادات المشروع — عدّل هذا الملف فقط عند ربط لوحة تحكم بمدونة Blogger جديدة
   ========================================================================== */
window.APP_CONFIG = {
  // [إلزامي] Client ID من Google Cloud Console (OAuth 2.0 Web Application)
  // Google Cloud Console → APIs & Services → Credentials
  GOOGLE_CLIENT_ID: '960694882182-6li9fagipotpktpl08cvcgbmkoh4n6k1.apps.googleusercontent.com',

  // [إلزامي] API Key عام (يُستخدم للقراءة العامة بدون تسجيل دخول)
  // ⚠️ يجب أن تطابق REMOTE_MENU_SOURCE.API_KEY داخل ملف القالب أيضًا
  GOOGLE_API_KEY: 'AIzaSyCH8RbuZWU2jL8t7UAoLVgyRZyltHypcUY',

  // [إلزامي] رقم مدونة Blogger (Blog ID) — يظهر في رابط لوحة Blogger:
  // blogger.com/blog/posts/{BLOG_ID}
  // ⚠️ يجب أن يطابق REMOTE_MENU_SOURCE.BLOG_ID داخل ملف القالب أيضًا
  BLOG_ID: '7995406045121029953',

  // [إلزامي] صلاحية الوصول المطلوبة من Google (كتابة/قراءة على Blogger)
  OAUTH_SCOPE: 'https://www.googleapis.com/auth/blogger',

  // [تلقائي] عنوان تدوينة بيانات المنيو (تُنشأ منشورة وليست مسودة، لكنها غير
  // مرتبطة من أي مكان بالموقع، حتى يقرأها القالب لأي زائر بدون تسجيل دخول).
  // ⚠️ يجب أن تكون هذه القيمة مطابقة حرفيًا لقيمة REMOTE_MENU_SOURCE.DATA_POST_TITLE
  // داخل template/balkony-blogger-template-final.xml — غيّرهما معًا دائمًا.
  MENU_DATA_POST_TITLE: 'DATA_POST_TITLE: '__MENU_DATA__',

  // لغة الواجهة الافتراضية للوحة التحكم
  DEFAULT_LANG: 'ar',

  // [قابل للتبديل] مزوّد رفع الصور الحالي — راجع js/modules/image-upload.js
  // 'blogger' غير مفعّل حاليًا (الـ API العام لا يوفر رفع وسائط)، فيُستخدم كإطار جاهز فقط.
  // لإضافة مزوّد جديد لاحقًا: سجّله عبر ImageUpload.registerProvider() وغيّر القيمة هنا.
  IMAGE_UPLOAD_PROVIDER: 'blogger'
};
