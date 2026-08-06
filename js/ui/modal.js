/* ==========================================================================
   Modal helper — يبني Modal ديناميكيًا ويديره (فتح/إغلاق/تأكيد)
   ========================================================================== */
(function(){
  var overlayEl = null;

  function build(){
    if(overlayEl) return overlayEl;
    overlayEl = document.createElement('div');
    overlayEl.className = 'modal-overlay';
    overlayEl.innerHTML =
      '<div class="modal-box" role="dialog" aria-modal="true">' +
        '<div class="modal-head">' +
          '<h3 class="modal-title-el"></h3>' +
          '<button type="button" class="modal-close" aria-label="إغلاق">&times;</button>' +
        '</div>' +
        '<div class="modal-body"></div>' +
        '<div class="modal-foot"></div>' +
      '</div>';
    document.body.appendChild(overlayEl);
    overlayEl.addEventListener('click', function(e){
      if(e.target === overlayEl) closeModal();
    });
    overlayEl.querySelector('.modal-close').addEventListener('click', closeModal);
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && overlayEl.classList.contains('show')) closeModal();
    });
    return overlayEl;
  }

  function openModal(opts){
    var el = build();
    el.querySelector('.modal-title-el').textContent = opts.title || '';
    var body = el.querySelector('.modal-body');
    body.innerHTML = '';
    if(typeof opts.body === 'string'){ body.innerHTML = opts.body; }
    else if(opts.body instanceof Node){ body.appendChild(opts.body); }

    var foot = el.querySelector('.modal-foot');
    foot.innerHTML = '';
    (opts.actions || []).forEach(function(action){
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn ' + (action.className || 'btn-secondary');
      btn.textContent = action.label;
      btn.addEventListener('click', function(){
        if(action.onClick) action.onClick(closeModal);
      });
      foot.appendChild(btn);
    });

    el.classList.add('show');
    return el;
  }

  function closeModal(){
    if(overlayEl) overlayEl.classList.remove('show');
  }

  function confirmDialog(opts){
    return new Promise(function(resolve){
      openModal({
        title: opts.title || 'تأكيد',
        body: '<p style="color:var(--text-muted);font-size:14px;">' + (opts.message || '') + '</p>',
        actions: [
          { label: opts.cancelLabel || 'إلغاء', className: 'btn-secondary', onClick: function(close){ close(); resolve(false); } },
          { label: opts.confirmLabel || 'تأكيد', className: opts.danger ? 'btn-danger' : 'btn-primary', onClick: function(close){ close(); resolve(true); } }
        ]
      });
    });
  }

  window.openModal = openModal;
  window.closeModal = closeModal;
  window.confirmDialog = confirmDialog;
})();
