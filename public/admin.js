let token = localStorage.getItem('yh_admin_token');
  let products = [];
  let editingId = null;
  let customFieldCount = 0;
  let sizeExtraCount = 0;

  if (token) { showMain(); loadProducts(); }
  else { document.getElementById('login-screen').style.display = 'block'; }

  function login() {
    token = document.getElementById('login-token').value.trim();
    if (!token) return t('请输入管理令牌', 'error');
    fetch('/api/products', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.ok ? (localStorage.setItem('yh_admin_token', token), showMain(), loadProducts()) : t('令牌无效', 'error'))
      .catch(() => t('连接失败，请刷新重试', 'error'));
  }

  function logout() {
    localStorage.removeItem('yh_admin_token'); token = null;
    document.getElementById('login-screen').style.display = 'block';
    document.getElementById('main-screen').style.display = 'none';
  }

  function showMain() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-screen').style.display = 'block';
  }

  async function loadProducts() {
    try {
      const r = await fetch('/api/products');
      products = Array.isArray(r) ? r : (await r.json());
      if (!Array.isArray(products)) products = [];
      updateCategories();
      renderTable();
    } catch {
      document.getElementById('product-list').innerHTML = '<tr><td colspan="7" style="text-align:center;color:#a44;padding:40px">加载失败，请刷新重试</td></tr>';
    }
  }

  function updateCategories() {
    const cats = [...new Set(products.map(p => p.category))].sort();
    document.getElementById('category-list').innerHTML = cats.map(c => `<option value="${s(c)}">`).join('');
  }

  function getFiltered() {
    const q = document.getElementById('search-box').value.toLowerCase().trim();
    if (!q) return products;
    return products.filter(p => {
      const d = p.details || {};
      const allText = [p.title, p.category, p.compatible, p.id, ...(d.oem||[]), ...(d.size||[]), ...(d.used||[])].join(' ').toLowerCase();
      return allText.includes(q);
    });
  }

  function renderTable() {
    const filtered = getFiltered();
    document.getElementById('product-count').textContent = filtered.length;
    const tbody = document.getElementById('product-list');
    if (!products.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#555;padding:40px">暂无产品，点击「＋ 添加产品」开始</td></tr>';
      return;
    }
    if (!filtered.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#555;padding:40px">没有匹配的产品</td></tr>';
      return;
    }
    tbody.innerHTML = filtered.map(p => {
      const d = p.details || {};
      const imgs = (p.image||'').split(',').filter(Boolean);
      return `<tr>
        <td><input type="checkbox" class="row-check" data-id="${p.id}" onchange="updateBulkBar()" /></td>
        <td class="img-td">${imgs[0] ? `<img src="${imgs[0]}" alt="" onerror="this.parentElement.innerHTML='<div class=no-img>!</div>'" />` : '<div class="no-img">无图</div>'}</td>
        <td class="title-cell"><strong style="color:#e0e0e8;font-size:0.95rem">${s(p.title).replace(/\n/g,'<br>')}</strong></td>
        <td><span class="tag gold">${s(p.category)}</span></td>
        <td style="font-size:0.85rem;color:#888">${(d.oem||[]).length} 个</td>
        <td style="font-size:0.8rem;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${s(p.compatible)}</td>
        <td><button class="btn btn-sm" onclick="editProduct('${p.id}')">编辑</button></td>
      </tr>`;
    }).join('');
    updateBulkBar();
  }

  function toggleSelectAll() {
    const c = document.getElementById('select-all').checked;
    document.querySelectorAll('.row-check').forEach(cb => cb.checked = c);
    updateBulkBar();
  }

  function updateBulkBar() {
    const sel = [...document.querySelectorAll('.row-check:checked')].map(cb => cb.dataset.id);
    const bar = document.getElementById('bulk-bar');
    bar.style.display = sel.length ? 'flex' : 'none';
    document.getElementById('bulk-count').textContent = '已选 ' + sel.length + ' 件';
  }

  async function bulkDelete() {
    const ids = [...document.querySelectorAll('.row-check:checked')].map(cb => cb.dataset.id);
    if (!ids.length || !confirm(`确认永久删除 ${ids.length} 件产品？`)) return;
    let n = 0;
    for (const id of ids) { try { await fetch(`/api/products?id=${id}`, { method:'DELETE', headers:{Authorization:'Bearer '+token} }); n++; } catch {} }
    t(`已删除 ${n} 件产品`, 'success'); loadProducts();
  }

  // ========== 弹窗 ==========
  let tempImages = [];

  function openModal(id) {
    document.body.style.overflow = 'hidden';
    editingId = id || null;
    tempImages = [];
    customFieldCount = 0;
    document.getElementById('modal-title').textContent = id ? '编辑产品' : '添加产品';
    document.getElementById('btn-delete').style.display = id ? 'inline-block' : 'none';
    document.getElementById('custom-fields').innerHTML = '';
    ['f-title','f-category','f-oem','f-used','f-markets','f-image-urls'].forEach(fid => document.getElementById(fid).value = '');
    document.getElementById('f-size-piston').value = '';
    document.getElementById('f-size-pin').value = '';
    document.getElementById('f-size-ring').value = '';
    document.getElementById('size-extra').innerHTML = '';
    sizeExtraCount = 0;
    resetImageRows();

    if (id) {
      const p = products.find(x => x.id === id);
      if (p) {
        document.getElementById('f-title').value = p.title || '';
        document.getElementById('f-category').value = p.category || '';
        document.getElementById('f-markets').value = (p.market_focus||[]).join(', ');
        const d = p.details || {};
        document.getElementById('f-oem').value = (d.oem||[]).join('\n');
        // Parse size lines
        const sizeLines = d.size || [];
        sizeLines.forEach(line => {
          const m = line.match(/^(.+?):\s*(.*)$/) || line.match(/^(.+?)\s+(.+)$/);
          if (m) {
            const key = m[1].trim();
            const val = m[2].trim();
            if (/piston$/i.test(key.replace(/\s+/g,''))) { document.getElementById('f-size-piston').value = val; }
            else if (/pin$/i.test(key.replace(/\s+/g,''))) { document.getElementById('f-size-pin').value = val; }
            else if (/ring$/i.test(key.replace(/\s+/g,''))) { document.getElementById('f-size-ring').value = val; }
            else { addSizeRow(key, val); }
          } else if (line.trim()) {
            addSizeRow('', line.trim());
          }
        });
        document.getElementById('f-used').value = (d.used||[]).join('\n');
        // Load images
        const imgs = (p.image||'').split(',').filter(Boolean);
        imgs.forEach(img => addImageBox(img));
        // Custom fields
        const extra = d.extra || {};
        Object.entries(extra).forEach(([k,v]) => addCustomField(k, v));
      }
    }
    document.getElementById('modal').classList.add('active');
  }

  function closeModal() { document.getElementById('modal').classList.remove('active'); editingId = null; document.body.style.overflow = ''; }

  // Image handling
  function resetImageRows() {
    const rows = document.getElementById('img-rows');
    rows.innerHTML = `<div class="img-upload-box" onclick="this.querySelector('input').click()">
      <span style="font-size:1.6rem;color:#555">+</span>
      <input type="file" accept="image/*" onchange="addImage(this)" />
    </div>`;
    tempImages = [];
  }

  function addImage(input) {
    const file = input.files[0];
    if (!file) return;
    if (file.size > 500 * 1024) { t('图片过大（最大500KB）', 'error'); return; }
    const reader = new FileReader();
    reader.onload = function(ev) {
      tempImages.push(ev.target.result);
      addImageBox(ev.target.result);
    };
    reader.readAsDataURL(file);
  }

  function addImageBox(src) {
    const rows = document.getElementById('img-rows');
    const box = document.createElement('div');
    box.className = 'img-upload-box has-img';
    box.innerHTML = `<img src="${src}" /><div class="del-img" onclick="event.stopPropagation();removeImage(this,'${src}')">✕</div>`;
    rows.insertBefore(box, rows.lastElementChild);
  }

  function removeImage(el, src) {
    el.closest('.img-upload-box').remove();
    tempImages = tempImages.filter(s => s !== src);
  }

  function previewUrlImages() {
    // Handled via f-image-urls text input
  }

  // Custom fields
  function addCustomField(key, val) {
    const id = 'cf' + (customFieldCount++);
    const container = document.getElementById('custom-fields');
    const row = document.createElement('div');
    row.className = 'dynamic-row';
    row.innerHTML = `
      <div class="field"><input type="text" placeholder="参数名" value="${s(key||'')}" data-cf-key="${id}" /></div>
      <div class="field"><input type="text" placeholder="参数值" value="${s(val||'')}" data-cf-val="${id}" /></div>
      <button type="button" class="btn-remove" onclick="this.parentElement.remove()">✕</button>
    `;
    container.appendChild(row);
  }

  function addSizeRow(label, val) {
    const id = 'sz' + (sizeExtraCount++);
    const container = document.getElementById('size-extra');
    const row = document.createElement('div');
    row.className = 'dynamic-row';
    row.innerHTML = `
      <div class="field"><input type="text" placeholder="参数名" value="${s(label||'')}" data-sz-label="${id}" style="max-width:150px" /></div>
      <div class="field"><input type="text" placeholder="参数值" value="${s(val||'')}" data-sz-val="${id}" /></div>
      <button type="button" class="btn-remove" onclick="this.parentElement.remove()">✕</button>
    `;
    container.appendChild(row);
  }

  async function saveProduct() {
    function collectSizeLines() {
      const lines = [];
      const pv = document.getElementById('f-size-piston').value.trim();
      const inv = document.getElementById('f-size-pin').value.trim();
      const rv = document.getElementById('f-size-ring').value.trim();
      if (pv) lines.push('Piston: ' + pv);
      if (inv) lines.push('Piston pin: ' + inv);
      if (rv) lines.push('Piston ring: ' + rv);
      document.querySelectorAll('[data-sz-val]').forEach(el => {
        const lbl = el.parentElement.parentElement.querySelector('[data-sz-label]')?.value?.trim();
        const val = el.value.trim();
        if (lbl && val) lines.push(lbl + ': ' + val);
      });
      return lines;
    }
    // Collect images
    const urlImgs = document.getElementById('f-image-urls').value.split(',').map(s => s.trim()).filter(Boolean);
    const allImgs = [...tempImages, ...urlImgs];
    // Collect custom fields
    const extra = {};
    document.querySelectorAll('[data-cf-key]').forEach(el => {
      const k = el.value.trim();
      const v = el.parentElement.parentElement.querySelector('[data-cf-val]')?.value?.trim();
      if (k) extra[k] = v || '';
    });
    const data = {
      title: document.getElementById('f-title').value.trim(),
      category: document.getElementById('f-category').value.trim(),
      compatible: document.getElementById('f-title').value.replace(/\n/g, ' ').trim(),
      features: [],
      image: allImgs.join(','),
      marketFocus: document.getElementById('f-markets').value.split(',').map(s => s.trim()).filter(Boolean),
      details: {
        oem: document.getElementById('f-oem').value.split('\n').map(s => s.trim()).filter(Boolean),
        size: collectSizeLines(),
        used: document.getElementById('f-used').value.split('\n').map(s => s.trim()).filter(Boolean),
        extra: Object.keys(extra).length ? extra : undefined,
      },
    };
    if (editingId) data.id = editingId;
    const url = editingId ? `/api/products?id=${editingId}` : '/api/products';
    try {
      const r = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type':'application/json', Authorization:'Bearer '+token },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error((await r.json()).error || '保存失败');
      t(editingId ? '产品已更新' : '产品已添加', 'success');
      closeModal(); loadProducts();
    } catch(err) { t(err.message, 'error'); }
  }

  function editProduct(id) { openModal(id); }

  async function deleteProduct() {
    if (!confirm('确认永久删除这件产品？')) return;
    try {
      const r = await fetch(`/api/products?id=${editingId}`, { method:'DELETE', headers:{Authorization:'Bearer '+token} });
      if (!r.ok) throw new Error('删除失败');
      t('产品已删除', 'success'); closeModal(); loadProducts();
    } catch(err) { t(err.message, 'error'); }
  }

  function t(msg, type) {
    const el = document.getElementById('toast');
    el.textContent = msg; el.className = 'toast ' + type + ' show';
    setTimeout(() => el.classList.remove('show'), 2500);
  }

  function s(str) { const d = document.createElement('div'); d.textContent = str||''; return d.innerHTML; }

  // Modal can only be closed via Cancel or ✕ button
  document.getElementById('select-all').addEventListener('change', function() {
    document.querySelectorAll('.row-check').forEach(cb => { cb.checked = this.checked; });
    updateBulkBar();
  });