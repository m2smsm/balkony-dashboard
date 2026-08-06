/* ==========================================================================
   Product Form — Modal لإضافة/تعديل منتج مع Validation
   ========================================================================== */
(function(){

  function toNumberLoose(str){
    // يسمح بأرقام فيها فواصل آلاف مثل 12,000
    var cleaned = String(str || '').replace(/[^\d.]/g, '');
    return cleaned ? Number(cleaned) : NaN;
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
    if(message){
      wrap.classList.add('has-error');
      wrap.querySelector('.error-msg').textContent = message;
    } else {
      wrap.classList.remove('has-error');
    }
  }

  function buildFormBody(item, categories){
    var catOptions = categories.map(function(cat){
      var label = (cat.label && cat.label.ar) || cat.key;
      return '<option value="' + cat.key + '">' + label + '</option>';
    }).join('');

    var wrap = document.createElement('div');
    wrap.innerHTML =
      fieldHtml('p-name-ar', 'اسم المنتج (عربي)', '<input class="input" id="p-name-ar" type="text" maxlength="80" value="' + escapeAttr(item.name && item.name.ar) + '"/>') +
      fieldHtml('p-name-en', 'اسم المنتج (إنجليزي)', '<input class="input" id="p-name-en" type="text" maxlength="80" value="' + escapeAttr(item.name && item.name.en) + '"/>', 'اختياري — يُستخدم عند تبديل اللغة بالمنيو') +
      fieldHtml('p-category', 'التصنيف',
        '<select class="input" id="p-category">' + catOptions + '<option value="__new__">+ إضافة تصنيف جديد</option></select>' +
        '<input class="input" id="p-category-new" type="text" placeholder="اسم التصنيف الجديد" style="display:none;margin-top:8px;"/>'
      ) +
      fieldHtml('p-price', 'السعر', '<input class="input" id="p-price" type="text" inputmode="numeric" value="' + escapeAttr(item.price) + '" placeholder="مثال: 10,000"/>') +
      fieldHtml('p-desc-ar', 'الوصف (اختياري)', '<textarea class="input" id="p-desc-ar" maxlength="200">' + escapeHtml((item.desc && item.desc.ar) || '') + '</textarea>') +
      fieldHtml('p-image', 'صورة المنتج',
        '<div style="display:flex;gap:8px;align-items:center;">' +
          '<img id="p-image-preview" src="' + escapeAttr(item.image) + '" style="width:44px;height:44px;border-radius:10px;object-fit:cover;background:var(--bg-elevated-2);' + (item.image ? '' : 'display:none;') + '"/>' +
          '<input class="input" id="p-image" type="url" value="' + escapeAttr(item.image) + '" placeholder="https://... (الصق رابط الصورة)" style="flex:1;"/>' +
          '<button type="button" class="btn btn-secondary btn-sm" id="p-image-upload-btn" style="white-space:nowrap;"><i class="fa-solid fa-upload"></i></button>' +
          '<input type="file" id="p-image-file" accept="image/*" style="display:none;"/>' +
        '</div>',
        'رفع الصور المباشر قيد التجهيز حاليًا — الصق رابط صورة مؤقتًا، وسيعمل زر الرفع تلقائيًا فور تفعيله'
      ) +
      (
        '<div class="field">' +
          '<label>ظهور المنتج بالمنيو</label>' +
          '<div style="display:flex;align-items:center;gap:10px;">' +
            '<div class="switch ' + (item.active === false ? '' : 'on') + '" id="p-active-switch"></div>' +
            '<span style="font-size:13px;color:var(--text-muted);" id="p-active-label">' + (item.active === false ? 'مخفي' : 'ظاهر') + '</span>' +
          '</div>' +
        '</div>'
      );

    var catSelect = wrap.querySelector('#p-category');
    var catNewInput = wrap.querySelector('#p-category-new');
    if(item.__categoryKey) catSelect.value = item.__categoryKey;
    catSelect.addEventListener('change', function(){
      catNewInput.style.display = catSelect.value === '__new__' ? '' : 'none';
    });

    var activeSwitch = wrap.querySelector('#p-active-switch');
    var activeLabel = wrap.querySelector('#p-active-label');
    var activeState = item.active !== false;
    activeSwitch.addEventListener('click', function(){
      activeState = !activeState;
      activeSwitch.classList.toggle('on', activeState);
      activeLabel.textContent = activeState ? 'ظاهر' : 'مخفي';
    });
    wrap.dataset.getActive = '';
    wrap.getActiveState = function(){ return activeState; };

    // -------- رفع/معاينة الصورة --------
    var imageInput = wrap.querySelector('#p-image');
    var imagePreview = wrap.querySelector('#p-image-preview');
    var uploadBtn = wrap.querySelector('#p-image-upload-btn');
    var fileInput = wrap.querySelector('#p-image-file');

    function updatePreview(url){
      if(url){ imagePreview.src = url; imagePreview.style.display = ''; }
      else { imagePreview.style.display = 'none'; }
    }
    imageInput.addEventListener('input', function(){ updatePreview(imageInput.value.trim()); });

    uploadBtn.addEventListener('click', function(){ fileInput.click(); });
    fileInput.addEventListener('change', function(){
      var file = fileInput.files && fileInput.files[0];
      if(!file) return;
      setButtonLoading(uploadBtn, true);
      window.ImageUpload.upload(file).then(function(url){
        imageInput.value = url;
        updatePreview(url);
        showSuccess('تم رفع الصورة بنجاح');
      }).catch(function(err){
        showToast(err.message || 'تعذر الرفع المباشر حاليًا، الصق رابط الصورة يدويًا', 'error');
      }).finally(function(){
        setButtonLoading(uploadBtn, false);
        fileInput.value = '';
      });
    });

    return wrap;
  }

  function escapeAttr(val){ return escapeHtml(val || ''); }
  function escapeHtml(str){
    return String(str || '').replace(/[&<>"']/g, function(c){
      return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c];
    });
  }

  function validate(formEl){
    var ok = true;
    var nameAr = formEl.querySelector('#p-name-ar').value.trim();
    var price = formEl.querySelector('#p-price').value.trim();
    var catSelect = formEl.querySelector('#p-category');
    var catNew = formEl.querySelector('#p-category-new').value.trim();

    if(!nameAr){ setFieldError('p-name-ar', 'اسم المنتج مطلوب'); ok = false; }
    else setFieldError('p-name-ar', null);

    if(!price || isNaN(toNumberLoose(price))){ setFieldError('p-price', 'السعر مطلوب ويجب أن يكون رقمًا'); ok = false; }
    else setFieldError('p-price', null);

    if(catSelect.value === '__new__' && !catNew){ setFieldError('p-category', 'اكتب اسم التصنيف الجديد'); ok = false; }
    else setFieldError('p-category', null);

    return ok;
  }

  // opts: { item, categories, onSave(itemData, categoryKeyOrNewLabel) }
  function openProductForm(opts){
    var item = opts.item || { name:{ar:'',en:''}, price:'', image:'', video:'', desc:{ar:'',en:''}, active:true };
    var formEl = buildFormBody(item, opts.categories);

    var modalEl = window.openModal({
      title: opts.item ? 'تعديل المنتج' : 'إضافة منتج جديد',
      body: formEl,
      actions: [
        { label: 'إلغاء', className: 'btn-secondary', onClick: function(close){ close(); } },
        {
          label: opts.item ? 'حفظ التعديلات' : 'إضافة المنتج',
          className: 'btn-primary',
          onClick: function(close){
            if(!validate(formEl)) return;

            var catSelect = formEl.querySelector('#p-category');
            var catNew = formEl.querySelector('#p-category-new').value.trim();
            var categoryKey = catSelect.value === '__new__' ? { newLabel: catNew } : catSelect.value;

            var updatedItem = {
              name: {
                ar: formEl.querySelector('#p-name-ar').value.trim(),
                en: formEl.querySelector('#p-name-en').value.trim()
              },
              price: formEl.querySelector('#p-price').value.trim(),
              image: formEl.querySelector('#p-image').value.trim(),
              video: item.video || '',
              desc: { ar: formEl.querySelector('#p-desc-ar').value.trim(), en: (item.desc && item.desc.en) || '' },
              active: formEl.getActiveState()
            };

            close();
            opts.onSave(updatedItem, categoryKey);
          }
        }
      ]
    });

    return modalEl;
  }

  window.ProductForm = { open: openProductForm };
})();
