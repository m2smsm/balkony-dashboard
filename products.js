/* ==========================================================================
   Products Module — القسم الرئيسي لإدارة المنتجات
   ========================================================================== */
(function(){
  var state = {
    data: null,        // بنية menu data كاملة (نفس MENU_CONFIG_ALT)
    search: '',
    categoryFilter: '' // '' = كل التصنيفات
  };

  function emptyMenuData(){
    return {
      restaurantName: { ar: '', en: '' },
      logo: '', heroImg: '', heroVideo: '', whatsappNumber: '', phones: [],
      social: {},
      menus: { restaurant: { label: { ar: 'المنيو', en: 'Menu' }, categories: [] } }
    };
  }

  function getCategories(){
    return (state.data.menus.restaurant.categories) || [];
  }

  function flattenItems(){
    var out = [];
    getCategories().forEach(function(cat, catIndex){
      (cat.items || []).forEach(function(item, itemIndex){
        out.push({ item: item, categoryKey: cat.key, categoryLabel: (cat.label && cat.label.ar) || cat.key, catIndex: catIndex, itemIndex: itemIndex });
      });
    });
    return out;
  }

  // يعيد ترقيم sortOrder لكل منتج حسب موضعه الفعلي داخل تصنيفه — يُستدعى بعد أي
  // إضافة/حذف/سحب-وإفلات حتى يبقى الحقل مطابقًا لترتيب العرض دائمًا
  function renumberSortOrders(){
    getCategories().forEach(function(cat){
      (cat.items || []).forEach(function(item, idx){ item.sortOrder = idx; });
    });
  }

  function persist(successMsg){
    return window.MenuRepository.saveMenuData(state.data).then(function(){
      if(successMsg) showSuccess(successMsg);
    }).catch(function(err){
      showError(err.message || 'تعذر الحفظ، حاول مرة أخرى');
      throw err;
    });
  }

  // -------- عمليات CRUD على البيانات المحلية ثم الحفظ --------
  function addItem(newItem, categoryKeyOrNew){
    var categories = getCategories();
    var targetKey = categoryKeyOrNew;

    if(typeof categoryKeyOrNew === 'object' && categoryKeyOrNew.newLabel){
      var slug = categoryKeyOrNew.newLabel.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\u0600-\u06FF-]/g, '') || ('cat-' + Date.now());
      categories.push({ key: slug, label: { ar: categoryKeyOrNew.newLabel, en: categoryKeyOrNew.newLabel }, icon: '', iconImg: '', coverImg: '', items: [] });
      targetKey = slug;
    }

    var cat = categories.find(function(c){ return c.key === targetKey; });
    if(!cat){ showError('لم يتم العثور على التصنيف'); return; }
    cat.items.push(newItem);

    renumberSortOrders();
    persist('تمت إضافة المنتج بنجاح').then(renderList).catch(function(){});
  }

  function updateItem(catIndex, itemIndex, updatedItem, categoryKeyOrNew){
    var categories = getCategories();
    var sourceCat = categories[catIndex];
    var targetKey = categoryKeyOrNew;

    if(typeof categoryKeyOrNew === 'object' && categoryKeyOrNew.newLabel){
      var slug = categoryKeyOrNew.newLabel.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\u0600-\u06FF-]/g, '') || ('cat-' + Date.now());
      categories.push({ key: slug, label: { ar: categoryKeyOrNew.newLabel, en: categoryKeyOrNew.newLabel }, icon: '', iconImg: '', coverImg: '', items: [] });
      targetKey = slug;
    }

    if(sourceCat.key === targetKey){
      sourceCat.items[itemIndex] = updatedItem;
    } else {
      sourceCat.items.splice(itemIndex, 1);
      var destCat = categories.find(function(c){ return c.key === targetKey; });
      destCat.items.push(updatedItem);
    }

    renumberSortOrders();
    persist('تم حفظ التعديلات').then(renderList).catch(function(){});
  }

  function deleteItem(catIndex, itemIndex){
    getCategories()[catIndex].items.splice(itemIndex, 1);
    renumberSortOrders();
    persist('تم حذف المنتج').then(renderList).catch(function(){});
  }

  function toggleActive(catIndex, itemIndex){
    var item = getCategories()[catIndex].items[itemIndex];
    item.active = item.active === false ? true : false;
    persist().then(renderList).catch(function(){});
  }

  // -------- السحب والإفلات لإعادة الترتيب (داخل نفس التصنيف فقط) --------
  var draggedRow = null;

  function reorderItem(catIndex, fromIndex, toIndex, insertAfter){
    if(fromIndex === toIndex) return;
    var items = getCategories()[catIndex].items;
    var moved = items.splice(fromIndex, 1)[0];
    var insertAt = toIndex;
    if(fromIndex < toIndex) insertAt -= 1;
    if(insertAfter) insertAt += 1;
    insertAt = Math.max(0, Math.min(items.length, insertAt));
    items.splice(insertAt, 0, moved);

    renumberSortOrders();
    persist('تم تحديث الترتيب').then(renderList).catch(function(){});
  }

  function clearDragIndicators(){
    document.querySelectorAll('.product-row').forEach(function(el){
      el.classList.remove('drop-before', 'drop-after', 'row-dragging');
    });
  }

  // -------- الواجهة --------
  var rootEl = null;

  function render(container){
    rootEl = container;
    rootEl.innerHTML = '<div class="empty-state"><span class="spinner" style="width:24px;height:24px;color:var(--purple-2);"></span></div>';

    window.MenuRepository.getMenuData().then(function(data){
      state.data = data || emptyMenuData();
      renderShell();
    }).catch(function(err){
      showError(err.message || 'تعذر تحميل بيانات المنيو');
    });
  }

  function renderShell(){
    rootEl.innerHTML =
      '<div class="toolbar">' +
        '<div class="grow"><input class="input" id="prodSearch" type="text" placeholder="ابحث باسم المنتج..." value="' + state.search + '"/></div>' +
        '<select class="input" id="prodCatFilter"></select>' +
        '<button type="button" class="btn btn-primary" id="addProductBtn"><i class="fa-solid fa-plus"></i><span>إضافة منتج</span></button>' +
      '</div>' +
      '<div class="product-list" id="productListWrap"></div>';

    var catFilter = document.getElementById('prodCatFilter');
    catFilter.innerHTML = '<option value="">كل التصنيفات</option>' + getCategories().map(function(c){
      return '<option value="' + c.key + '">' + ((c.label && c.label.ar) || c.key) + '</option>';
    }).join('');
    catFilter.value = state.categoryFilter;

    document.getElementById('prodSearch').addEventListener('input', function(e){
      state.search = e.target.value.trim();
      renderList();
    });
    catFilter.addEventListener('change', function(e){
      state.categoryFilter = e.target.value;
      renderList();
    });
    document.getElementById('addProductBtn').addEventListener('click', function(){
      window.ProductForm.open({
        categories: getCategories(),
        onSave: function(newItem, categoryKey){ addItem(newItem, categoryKey); }
      });
    });

    renderList();
  }

  function renderList(){
    var wrap = document.getElementById('productListWrap');
    if(!wrap) return;

    var flat = flattenItems().filter(function(row){
      var matchesSearch = !state.search ||
        (row.item.name && row.item.name.ar && row.item.name.ar.indexOf(state.search) !== -1) ||
        (row.item.name && row.item.name.en && row.item.name.en.toLowerCase().indexOf(state.search.toLowerCase()) !== -1);
      var matchesCat = !state.categoryFilter || row.categoryKey === state.categoryFilter;
      return matchesSearch && matchesCat;
    });

    if(!flat.length){
      wrap.innerHTML =
        '<div class="empty-state">' +
          '<i class="fa-solid fa-box-open icon"></i>' +
          '<p>' + (getCategories().length ? 'لا توجد نتائج مطابقة' : 'لا توجد منتجات بعد — ابدأ بإضافة أول منتج') + '</p>' +
        '</div>';
      return;
    }

    wrap.innerHTML = flat.map(function(row){
      var item = row.item;
      var nameAr = (item.name && item.name.ar) || '—';
      var isActive = item.active !== false;
      var thumb = item.image
        ? '<img class="row-thumb" src="' + item.image + '" alt=""/>'
        : '<div class="row-thumb" style="display:flex;align-items:center;justify-content:center;"><i class="fa-solid fa-image" style="color:var(--text-dim);"></i></div>';

      var handleHtml = '<div class="drag-handle"' + (state.search ? ' style="visibility:hidden;"' : '') + ' title="اسحب لإعادة الترتيب"><i class="fa-solid fa-grip-vertical"></i></div>';

      return (
        '<div class="product-row" data-cat="' + row.catIndex + '" data-item="' + row.itemIndex + '">' +
          handleHtml +
          thumb +
          '<div class="info">' +
            '<div class="p-name">' + nameAr + '</div>' +
            '<div class="p-meta"><span>' + row.categoryLabel + '</span>' +
              '<span class="badge ' + (isActive ? 'badge-on' : 'badge-off') + '">' + (isActive ? 'ظاهر' : 'مخفي') + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="p-price">' + (item.price || '') + '</div>' +
          '<div class="reorder-btns">' +
            '<button type="button" class="reorder-btn" data-action="move-up" title="تحريك لأعلى" ' + (row.itemIndex === 0 ? 'disabled' : '') + '><i class="fa-solid fa-chevron-up"></i></button>' +
            '<button type="button" class="reorder-btn" data-action="move-down" title="تحريك لأسفل" ' + (row.itemIndex === catItemCount(row.catIndex) - 1 ? 'disabled' : '') + '><i class="fa-solid fa-chevron-down"></i></button>' +
          '</div>' +
          '<div class="actions">' +
            '<div class="switch ' + (isActive ? 'on' : '') + '" data-action="toggle" title="إظهار/إخفاء"></div>' +
            '<button type="button" class="btn btn-icon btn-ghost" data-action="edit" title="تعديل"><i class="fa-solid fa-pen"></i></button>' +
            '<button type="button" class="btn btn-icon btn-ghost" data-action="delete" title="حذف" style="color:var(--danger);"><i class="fa-solid fa-trash"></i></button>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    wrap.querySelectorAll('.product-row').forEach(function(rowEl){
      var catIndex = Number(rowEl.dataset.cat);
      var itemIndex = Number(rowEl.dataset.item);

      // -------- سحب وإفلات (معطّل أثناء البحث لتفادي ترتيب غامض على نتائج مُصفّاة) --------
      if(!state.search){
        // ملاحظة: Drag&Drop عبر HTML5 لا يعمل باللمس على معظم متصفحات الجوال —
        // لذلك هو مخصص لأجهزة الكمبيوتر فقط (يُخفى تلقائيًا على الشاشات الصغيرة
        // عبر CSS)، وأزرار "تحريك لأعلى/أسفل" هي البديل الموثوق على الهاتف.
        var handle = rowEl.querySelector('.drag-handle');
        handle.addEventListener('mousedown', function(){ rowEl.setAttribute('draggable', 'true'); });

        rowEl.addEventListener('dragstart', function(e){
          draggedRow = { catIndex: catIndex, itemIndex: itemIndex };
          e.dataTransfer.effectAllowed = 'move';
          rowEl.classList.add('row-dragging');
        });
        rowEl.addEventListener('dragend', function(){
          rowEl.removeAttribute('draggable');
          draggedRow = null;
          clearDragIndicators();
        });
        rowEl.addEventListener('dragover', function(e){
          if(!draggedRow || draggedRow.catIndex !== catIndex) return;
          e.preventDefault();
          var rect = rowEl.getBoundingClientRect();
          var isAfter = (e.clientY - rect.top) > rect.height / 2;
          rowEl.classList.toggle('drop-before', !isAfter);
          rowEl.classList.toggle('drop-after', isAfter);
        });
        rowEl.addEventListener('dragleave', function(){
          rowEl.classList.remove('drop-before', 'drop-after');
        });
        rowEl.addEventListener('drop', function(e){
          e.preventDefault();
          if(!draggedRow || draggedRow.catIndex !== catIndex){ clearDragIndicators(); return; }
          var rect = rowEl.getBoundingClientRect();
          var isAfter = (e.clientY - rect.top) > rect.height / 2;
          reorderItem(draggedRow.catIndex, draggedRow.itemIndex, itemIndex, isAfter);
          draggedRow = null;
          clearDragIndicators();
        });
      }

      // -------- تحريك لأعلى/لأسفل — بديل يعمل على الهاتف بدون سحب (Drag&Drop باللمس غير مدعوم بمعظم متصفحات الجوال) --------
      var upBtn = rowEl.querySelector('[data-action="move-up"]');
      var downBtn = rowEl.querySelector('[data-action="move-down"]');
      if(upBtn) upBtn.addEventListener('click', function(){ reorderItem(catIndex, itemIndex, itemIndex - 1, false); });
      if(downBtn) downBtn.addEventListener('click', function(){ reorderItem(catIndex, itemIndex, itemIndex + 1, true); });

      rowEl.querySelector('[data-action="toggle"]').addEventListener('click', function(){
        toggleActive(catIndex, itemIndex);
      });
      rowEl.querySelector('[data-action="edit"]').addEventListener('click', function(){
        var cat = getCategories()[catIndex];
        var item = cat.items[itemIndex];
        window.ProductForm.open({
          item: Object.assign({}, item, { __categoryKey: cat.key }),
          categories: getCategories(),
          onSave: function(updatedItem, categoryKey){ updateItem(catIndex, itemIndex, updatedItem, categoryKey); }
        });
      });
      rowEl.querySelector('[data-action="delete"]').addEventListener('click', function(){
        var name = itemName(catIndex, itemIndex);
        window.confirmDialog({
          title: 'حذف المنتج',
          message: 'هل أنت متأكد من حذف "' + name + '"؟ لا يمكن التراجع عن هذه العملية.',
          confirmLabel: 'حذف', danger: true
        }).then(function(confirmed){
          if(confirmed) deleteItem(catIndex, itemIndex);
        });
      });
    });
  }

  function catItemCount(catIndex){
    return (getCategories()[catIndex].items || []).length;
  }

  function itemName(catIndex, itemIndex){
    var item = getCategories()[catIndex].items[itemIndex];
    return (item.name && item.name.ar) || '';
  }

  window.ProductsModule = { render: render };
})();
