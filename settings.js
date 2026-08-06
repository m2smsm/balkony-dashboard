/* ==========================================================================
   Settings Module — إعدادات المطعم/المظهر/الدوام/التواصل
   ========================================================================== */
(function(){
  var state = { data: null };
  var rootEl = null;

  function emptyMenuData(){
    return {
      restaurantName: { ar: '', en: '' },
      description: { ar: '', en: '' },
      logo: '', heroImg: '', heroVideo: '',
      workingHours: { ar: '', en: '' }, prepTime: { ar: '', en: '' },
      whatsappNumber: '', phones: ['', ''],
      social: { instagram: '', facebook: '', tiktok: '', snapchat: '', maps: '', telegram: '' },
      theme: { accent: '#d4af37', bg: '#0a0a0a' },
      menus: { restaurant: { label: { ar: 'المنيو', en: 'Menu' }, categories: [] } }
    };
  }

  // يدمج القيم الافتراضية مع بيانات موجودة فعليًا حتى لا تنكسر لو كانت
  // البيانات قديمة (محفوظة قبل إضافة حقول description/theme مثلاً)
  function withDefaults(data){
    var base = emptyMenuData();
    data = data || {};
    return {
      restaurantName: data.restaurantName || base.restaurantName,
      description: data.description || base.description,
      logo: data.logo || '',
      heroImg: data.heroImg || '',
      heroVideo: data.heroVideo || '',
      workingHours: data.workingHours || base.workingHours,
      prepTime: data.prepTime || base.prepTime,
      whatsappNumber: data.whatsappNumber || '',
      phones: (data.phones && data.phones.length) ? data.phones : ['', ''],
      social: Object.assign({}, base.social, data.social || {}),
      theme: Object.assign({}, base.theme, data.theme || {}),
      menus: data.menus || base.menus,
      rating: data.rating, statusText: data.statusText, menuPdfUrl: data.menuPdfUrl, introVideo: data.introVideo
    };
  }

  function fieldHtml(id, labelText, inputHtml, hint){
    return (
      '<div class="field" id="field-' + id + '">' +
        '<label for="' + id + '">' + labelText + '</label>' +
        inputHtml +
        (hint ? '<span class="hint">' + hint + '</span>' : '') +
        '<span class="error-msg"></span>' +
      '</div>'
    );
  }
  function setFieldError(id, message){
    var wrap = document.getElementById('field-' + id);
    if(!wrap) return;
    if(message){ wrap.classList.add('has-error'); wrap.querySelector('.error-msg').textContent = message; }
    else wrap.classList.remove('has-error');
  }
  function esc(v){
    return String(v || '').replace(/[&<>"']/g, function(c){
      return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c];
    });
  }

  function render(container){
    rootEl = container;
    rootEl.innerHTML = '<div class="empty-state"><span class="spinner" style="width:24px;height:24px;color:var(--purple-2);"></span></div>';

    window.MenuRepository.getMenuData().then(function(data){
      state.data = withDefaults(data);
      renderForm();
    }).catch(function(err){
      showError(err.message || 'تعذر تحميل الإعدادات');
    });
  }

  function renderForm(){
    var d = state.data;

    rootEl.innerHTML =
      '<div style="display:grid;gap:18px;max-width:640px;">' +

        '<div class="card">' +
          '<h3 style="font-size:15px;margin-bottom:16px;">معلومات المطعم</h3>' +
          fieldHtml('s-name-ar', 'اسم المطعم (عربي)', '<input class="input" id="s-name-ar" value="' + esc(d.restaurantName.ar) + '"/>') +
          fieldHtml('s-name-en', 'اسم المطعم (إنجليزي)', '<input class="input" id="s-name-en" value="' + esc(d.restaurantName.en) + '"/>') +
          fieldHtml('s-desc-ar', 'وصف المطعم (عربي)', '<textarea class="input" id="s-desc-ar" maxlength="200">' + esc(d.description.ar) + '</textarea>') +
          fieldHtml('s-logo', 'شعار المطعم',
            '<div style="display:flex;gap:8px;align-items:center;">' +
              '<img id="s-logo-preview" src="' + esc(d.logo) + '" style="width:44px;height:44px;border-radius:10px;object-fit:cover;background:var(--bg-elevated-2);' + (d.logo ? '' : 'display:none;') + '"/>' +
              '<input class="input" id="s-logo" type="url" value="' + esc(d.logo) + '" placeholder="https://..." style="flex:1;"/>' +
              '<button type="button" class="btn btn-secondary btn-sm" id="s-logo-upload-btn"><i class="fa-solid fa-upload"></i></button>' +
              '<input type="file" id="s-logo-file" accept="image/*" style="display:none;"/>' +
            '</div>',
            'رفع الشعار المباشر قيد التجهيز — الصق رابط الصورة حاليًا'
          ) +
        '</div>' +

        '<div class="card">' +
          '<h3 style="font-size:15px;margin-bottom:16px;">مظهر المنيو</h3>' +
          '<div style="display:flex;gap:20px;">' +
            '<div class="field" style="flex:1;"><label for="s-accent">اللون الرئيسي</label><input type="color" class="input" id="s-accent" value="' + esc(d.theme.accent) + '" style="height:42px;padding:4px;"/></div>' +
            '<div class="field" style="flex:1;"><label for="s-bg">لون الخلفية</label><input type="color" class="input" id="s-bg" value="' + esc(d.theme.bg) + '" style="height:42px;padding:4px;"/></div>' +
          '</div>' +
        '</div>' +

        '<div class="card">' +
          '<h3 style="font-size:15px;margin-bottom:16px;">أوقات الدوام</h3>' +
          fieldHtml('s-hours-ar', 'أوقات الدوام (عربي)', '<input class="input" id="s-hours-ar" value="' + esc(d.workingHours.ar) + '" placeholder="مثال: يوميًا 12 ظهرًا - 12 منتصف الليل"/>') +
        '</div>' +

        '<div class="card">' +
          '<h3 style="font-size:15px;margin-bottom:4px;">بيانات التواصل <span style="color:var(--text-dim);font-weight:400;font-size:12px;">(اختياري)</span></h3>' +
          fieldHtml('s-whatsapp', 'رقم واتساب الطلبات', '<input class="input" id="s-whatsapp" value="' + esc(d.whatsappNumber) + '" placeholder="9647xxxxxxxxx"/>') +
          fieldHtml('s-phone1', 'رقم هاتف 1', '<input class="input" id="s-phone1" value="' + esc(d.phones[0]) + '"/>') +
          fieldHtml('s-phone2', 'رقم هاتف 2', '<input class="input" id="s-phone2" value="' + esc(d.phones[1]) + '"/>') +
          fieldHtml('s-instagram', 'رابط انستغرام', '<input class="input" id="s-instagram" value="' + esc(d.social.instagram) + '"/>') +
          fieldHtml('s-facebook', 'رابط فيسبوك', '<input class="input" id="s-facebook" value="' + esc(d.social.facebook) + '"/>') +
          fieldHtml('s-maps', 'رابط خرائط قوقل', '<input class="input" id="s-maps" value="' + esc(d.social.maps) + '"/>') +
        '</div>' +

        '<div style="display:flex;justify-content:flex-end;">' +
          '<button type="button" class="btn btn-primary" id="saveSettingsBtn"><i class="fa-solid fa-check"></i><span>حفظ الإعدادات</span></button>' +
        '</div>' +
      '</div>';

    wireLogoUpload();
    document.getElementById('saveSettingsBtn').addEventListener('click', onSave);
  }

  function wireLogoUpload(){
    var logoInput = document.getElementById('s-logo');
    var preview = document.getElementById('s-logo-preview');
    var uploadBtn = document.getElementById('s-logo-upload-btn');
    var fileInput = document.getElementById('s-logo-file');

    function updatePreview(url){
      if(url){ preview.src = url; preview.style.display = ''; }
      else preview.style.display = 'none';
    }
    logoInput.addEventListener('input', function(){ updatePreview(logoInput.value.trim()); });
    uploadBtn.addEventListener('click', function(){ fileInput.click(); });
    fileInput.addEventListener('change', function(){
      var file = fileInput.files && fileInput.files[0];
      if(!file) return;
      setButtonLoading(uploadBtn, true);
      window.ImageUpload.upload(file).then(function(url){
        logoInput.value = url; updatePreview(url); showSuccess('تم رفع الشعار بنجاح');
      }).catch(function(err){
        showToast(err.message || 'تعذر الرفع المباشر حاليًا، الصق رابط الصورة يدويًا', 'error');
      }).finally(function(){
        setButtonLoading(uploadBtn, false); fileInput.value = '';
      });
    });
  }

  function validate(){
    var ok = true;
    var nameAr = document.getElementById('s-name-ar').value.trim();
    if(!nameAr){ setFieldError('s-name-ar', 'اسم المطعم مطلوب'); ok = false; }
    else setFieldError('s-name-ar', null);
    return ok;
  }

  function onSave(){
    if(!validate()) return;
    var btn = document.getElementById('saveSettingsBtn');

    var updated = Object.assign({}, state.data, {
      restaurantName: { ar: val('s-name-ar'), en: val('s-name-en') },
      description: { ar: val('s-desc-ar'), en: state.data.description.en },
      logo: val('s-logo'),
      theme: { accent: val('s-accent'), bg: val('s-bg') },
      workingHours: { ar: val('s-hours-ar'), en: state.data.workingHours.en },
      whatsappNumber: val('s-whatsapp'),
      phones: [val('s-phone1'), val('s-phone2')].filter(function(p){ return p; }),
      social: Object.assign({}, state.data.social, {
        instagram: val('s-instagram'), facebook: val('s-facebook'), maps: val('s-maps')
      })
    });

    setButtonLoading(btn, true);
    window.MenuRepository.saveMenuData(updated).then(function(){
      state.data = updated;
      showSuccess('تم حفظ الإعدادات بنجاح');
    }).catch(function(err){
      showError(err.message || 'تعذر حفظ الإعدادات');
    }).finally(function(){
      setButtonLoading(btn, false);
    });
  }

  function val(id){ return document.getElementById(id).value.trim(); }

  window.SettingsModule = { render: render };
})();
