/* ==========================================================================
   Loading helpers — حالة تحميل على الأزرار + شاشة تحميل عامة
   ========================================================================== */
(function(){
  function setButtonLoading(btn, isLoading){
    if(!btn) return;
    if(isLoading){
      if(!btn.dataset.originalHtml) btn.dataset.originalHtml = btn.innerHTML;
      btn.classList.add('is-loading');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span><span class="btn-label">' + btn.dataset.originalHtml.replace(/<[^>]+>/g,'').trim() + '</span>';
    } else {
      btn.classList.remove('is-loading');
      btn.disabled = false;
      if(btn.dataset.originalHtml) btn.innerHTML = btn.dataset.originalHtml;
    }
  }

  function hidePageLoader(){
    var el = document.getElementById('pageLoader');
    if(el) el.classList.add('hide');
  }

  window.setButtonLoading = setButtonLoading;
  window.hidePageLoader = hidePageLoader;
})();
