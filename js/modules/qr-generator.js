/* ==========================================================================
   QR Module — توليد QR لرابط المنيو (رابط المدونة نفسه، لأن القالب هو الصفحة
   الرئيسية للمدونة مباشرة) + تحميل الصورة
   ========================================================================== */
(function(){
  var rootEl = null;

  function render(container){
    rootEl = container;
    rootEl.innerHTML =
      '<div class="card" style="max-width:420px;text-align:center;">' +
        '<div id="qrStatus" style="padding:40px 0;color:var(--text-muted);font-size:13px;">' +
          '<span class="spinner" style="width:22px;height:22px;color:var(--purple-2);"></span>' +
          '<p style="margin-top:10px;">جارٍ جلب رابط المنيو...</p>' +
        '</div>' +
        '<div id="qrResult" style="display:none;">' +
          '<canvas id="qrCanvas" style="margin:0 auto 16px;border-radius:var(--radius-md);"></canvas>' +
          '<p id="qrUrlText" style="font-size:12px;color:var(--text-dim);word-break:break-all;margin-bottom:16px;"></p>' +
          '<div style="display:flex;gap:10px;justify-content:center;">' +
            '<button type="button" class="btn btn-primary" id="qrDownloadBtn"><i class="fa-solid fa-download"></i><span>تحميل QR</span></button>' +
            '<button type="button" class="btn btn-secondary" id="qrRefreshBtn"><i class="fa-solid fa-rotate"></i><span>تحديث</span></button>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.getElementById('qrRefreshBtn') && document.getElementById('qrRefreshBtn').addEventListener('click', loadAndGenerate);
    loadAndGenerate();
  }

  // يجلب رابط المدونة (وهو رابط المنيو نفسه) في كل مرة يُفتح فيها القسم —
  // حتى ينعكس أي تغيير مستقبلي بالرابط (نطاق مخصص مثلاً) فورًا بدون تدخّل يدوي
  function loadAndGenerate(){
    var statusEl = document.getElementById('qrStatus');
    var resultEl = document.getElementById('qrResult');
    statusEl.style.display = ''; resultEl.style.display = 'none';

    window.BloggerAPI.getBlog(window.APP_CONFIG.BLOG_ID).then(function(blog){
      var url = blog.url;
      if(!url) throw new Error('تعذر تحديد رابط المدونة');
      return generateQr(url);
    }).catch(function(err){
      statusEl.innerHTML = '<p style="color:var(--danger);">' + (err.message || 'تعذر توليد رمز QR') + '</p>';
    });
  }

  function generateQr(url){
    return ensureQrLibLoaded().then(function(){
      var canvas = document.getElementById('qrCanvas');
      return window.QRCode.toCanvas(canvas, url, { width: 240, margin: 1, color: { dark: '#1a1204', light: '#ffffff' } }).then(function(){
        document.getElementById('qrStatus').style.display = 'none';
        document.getElementById('qrResult').style.display = '';
        document.getElementById('qrUrlText').textContent = url;
        document.getElementById('qrDownloadBtn').onclick = function(){
          var link = document.createElement('a');
          link.download = 'balkony-menu-qr.png';
          link.href = canvas.toDataURL('image/png');
          link.click();
        };
      });
    });
  }

  // يحمّل مكتبة QRCode من CDN مرة واحدة فقط عند الحاجة الفعلية (تحميل كسول)
  var qrLibPromise = null;
  function ensureQrLibLoaded(){
    if(window.QRCode) return Promise.resolve();
    if(qrLibPromise) return qrLibPromise;
    qrLibPromise = new Promise(function(resolve, reject){
      var script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
      script.onload = function(){ resolve(); };
      script.onerror = function(){ reject(new Error('تعذر تحميل مكتبة QR')); };
      document.head.appendChild(script);
    });
    return qrLibPromise;
  }

  window.QRModule = { render: render };
})();
