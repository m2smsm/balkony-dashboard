/* ==========================================================================
   Toast Notifications
   ========================================================================== */
(function(){
  function ensureStack(){
    var stack = document.querySelector('.toast-stack');
    if(!stack){
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      document.body.appendChild(stack);
    }
    return stack;
  }

  function showToast(message, type){
    type = type || 'success';
    var stack = ensureStack();
    var el = document.createElement('div');
    el.className = 'toast toast-' + type;
    el.innerHTML = '<span class="toast-dot"></span><span>' + message + '</span>';
    stack.appendChild(el);
    setTimeout(function(){
      el.style.opacity = '0';
      el.style.transform = 'translateY(10px)';
      el.style.transition = 'all .2s ease';
      setTimeout(function(){ el.remove(); }, 200);
    }, 3200);
  }

  window.showToast = showToast;
  window.showSuccess = function(msg){ showToast(msg, 'success'); };
  window.showError = function(msg){ showToast(msg, 'error'); };
})();
