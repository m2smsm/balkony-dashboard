/* ==========================================================================
   Main — تهيئة اللوحة: التحقق من الجلسة، الشريط الجانبي، والتنقل بين الأقسام
   ========================================================================== */
(function(){
  if(!window.Auth.requireAuth()) return;

  var panelRoot = document.getElementById('panelRoot');
  var topbarTitle = document.getElementById('topbarTitle');
  var navLinks = document.querySelectorAll('.nav-link');

  var PANEL_TITLES = {
    overview: 'نظرة عامة',
    products: 'المنتجات',
    settings: 'الإعدادات',
    qrcode: 'QR المنيو'
  };

  // -------- بيانات المستخدم في الشريط الجانبي --------
  function renderUser(){
    var profile = window.Auth.getProfile();
    var avatar = document.getElementById('userAvatar');
    var name = document.getElementById('userName');
    var email = document.getElementById('userEmail');
    if(profile){
      avatar.src = profile.picture || '';
      name.textContent = profile.name || 'المستخدم';
      email.textContent = profile.email || '';
    }
  }

  document.getElementById('logoutBtn').addEventListener('click', function(){
    window.Auth.logout();
  });

  // -------- الشريط الجانبي على الجوال --------
  var sidebar = document.getElementById('sidebar');
  var backdrop = document.getElementById('sidebarBackdrop');
  document.getElementById('menuToggle').addEventListener('click', function(){
    sidebar.classList.add('open'); backdrop.classList.add('show');
  });
  backdrop.addEventListener('click', function(){
    sidebar.classList.remove('open'); backdrop.classList.remove('show');
  });

  // -------- عرض قسم "نظرة عامة" --------
  function renderOverview(){
    panelRoot.innerHTML =
      '<div class="stats-grid" id="statsGrid">' +
        statCardSkeleton('عدد المنتجات') +
        statCardSkeleton('التصنيفات') +
        statCardSkeleton('منتجات ظاهرة') +
        statCardSkeleton('منتجات مخفية') +
      '</div>' +
      '<div class="card" id="overviewMsg"></div>';

    window.MenuRepository.getMenuData().then(function(data){
      if(!data){
        document.getElementById('overviewMsg').innerHTML =
          '<div class="empty-state">' +
            '<i class="fa-solid fa-utensils icon"></i>' +
            '<p>لا توجد بيانات منيو محفوظة بعد. انتقل إلى قسم "المنتجات" لإضافة أول صنف — سيتم إنشاء مصدر البيانات تلقائيًا.</p>' +
          '</div>';
        setStatValues([0,0,0,0]);
        return;
      }
      var categories = (data.menus && data.menus.restaurant && data.menus.restaurant.categories) || [];
      var totalItems = 0, visible = 0, hidden = 0;
      categories.forEach(function(cat){
        (cat.items || []).forEach(function(item){
          totalItems++;
          if(item.active === false) hidden++; else visible++;
        });
      });
      setStatValues([totalItems, categories.length, visible, hidden]);
      document.getElementById('overviewMsg').innerHTML =
        '<p style="color:var(--text-muted);font-size:14px;">مرحبًا بك في لوحة تحكم منيو <strong style="color:var(--purple-2);">' +
        ((data.restaurantName && data.restaurantName.ar) || 'مطعمك') + '</strong>. استخدم القائمة الجانبية لإدارة المنتجات والإعدادات.</p>';
    }).catch(function(err){
      showError(err.message || 'تعذر تحميل بيانات المنيو');
    });
  }

  function statCardSkeleton(label){
    return '<div class="stat-card"><div class="label">' + label + '</div><div class="value">—</div></div>';
  }
  function setStatValues(values){
    var cards = document.querySelectorAll('#statsGrid .stat-card .value');
    cards.forEach(function(el, i){ el.textContent = values[i]; });
  }

  // -------- أقسام قيد الإنشاء (تُبنى في الخطوات القادمة) --------
  function renderComingSoon(title){
    panelRoot.innerHTML =
      '<div class="empty-state">' +
        '<i class="fa-solid fa-hammer icon"></i>' +
        '<p>قسم "' + title + '" سيُبنى في الخطوة التالية.</p>' +
      '</div>';
  }

  // -------- التوجيه (Router) --------
  function renderPanel(name){
    navLinks.forEach(function(link){
      link.classList.toggle('active', link.dataset.panel === name);
    });
    topbarTitle.textContent = PANEL_TITLES[name] || '';
    sidebar.classList.remove('open'); backdrop.classList.remove('show');

    if(name === 'overview') renderOverview();
    else if(name === 'products') window.ProductsModule.render(panelRoot);
    else if(name === 'settings') window.SettingsModule.render(panelRoot);
    else if(name === 'qrcode') window.QRModule.render(panelRoot);
    else renderComingSoon(PANEL_TITLES[name]);
  }

  function currentPanelFromHash(){
    var hash = (window.location.hash || '#overview').replace('#','');
    return PANEL_TITLES[hash] ? hash : 'overview';
  }

  window.addEventListener('hashchange', function(){
    renderPanel(currentPanelFromHash());
  });

  // ==========================================================================
  // استيراد تلقائي عند أول دخول فقط — بدون أي صفحة أو خطوة يدوية منفصلة
  // ==========================================================================
  // يتحقق ما إذا كانت بيانات الاستيراد القديمة (migrated-menu-data.js) تحتوي
  // فعليًا على منتجات (وليست فارغة أو غير محمَّلة لأي سبب)
  function hasMigrationContent(data){
    if(!data || !data.menus || !data.menus.restaurant) return false;
    var cats = data.menus.restaurant.categories || [];
    return cats.some(function(c){ return (c.items || []).length > 0; });
  }

  function startDashboard(){
    renderPanel(currentPanelFromHash());
    hidePageLoader();
  }

  // نافذة الاستيراد: تظهر مرة واحدة فقط بطبيعتها — بمجرد نجاح الاستيراد تصبح
  // بيانات جديدة موجودة على Blogger، وبالتالي لن يدخل الشرط الذي يعرضها مجددًا
  // بأي تسجيل دخول قادم (لا حاجة لعلم/Flag منفصل يُخزَّن في أي مكان).
  function offerMigration(){
    var totalCats = window.MIGRATION_DATA.menus.restaurant.categories.length;
    var totalItems = window.MIGRATION_DATA.menus.restaurant.categories.reduce(function(s, c){ return s + c.items.length; }, 0);

    openModal({
      title: 'تم العثور على بيانات المنيو القديمة',
      body:
        '<p style="font-size:14px;color:var(--text-muted);line-height:1.8;">' +
        'وُجدت بيانات منيو قديمة (' + totalItems + ' منتجًا ضمن ' + totalCats + ' تصنيفًا). ' +
        'هل تريد استيرادها إلى النظام الجديد؟</p>',
      actions: [
        {
          label: 'إلغاء', className: 'btn-secondary',
          onClick: function(close){ close(); startDashboard(); }
        },
        {
          label: 'استيراد', className: 'btn-primary',
          onClick: function(close){
            close();
            window.MenuRepository.saveMenuData(window.MIGRATION_DATA).then(function(){
              showSuccess('تم استيراد ' + totalItems + ' منتجًا بنجاح');
              startDashboard();
            }).catch(function(err){
              showError(err.message || 'تعذر استيراد البيانات القديمة، حاول تسجيل الدخول مرة أخرى');
              startDashboard();
            });
          }
        }
      ]
    });
  }

  renderUser();

  window.MenuRepository.getMenuData().then(function(existing){
    if(existing){
      // توجد بيانات جديدة مسبقًا (سواء أُدخلت يدويًا أو استُوردت سابقًا) — دخول مباشر دائمًا
      startDashboard();
      return;
    }
    hidePageLoader();
    if(window.MIGRATION_DATA && hasMigrationContent(window.MIGRATION_DATA)){
      offerMigration();
    } else {
      // لا بيانات جديدة ولا بيانات قديمة (مطعم جديد كليًا) — دخول مباشر بمنيو فارغ، طبيعي بهذه الحالة
      startDashboard();
    }
  }).catch(function(err){
    showError(err.message || 'تعذر تحميل بيانات المنيو');
    startDashboard();
  });
})();
