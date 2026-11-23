function renderCategoryQuickSelect() {
    const container = document.getElementById('category-quick-select');
    if (!container) return;

    const categories = [...new Set(products.map(p => p.category))].filter(Boolean);
    container.innerHTML = '';

    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs rounded-lg border border-indigo-200/80 transition font-medium';
        btn.textContent = `+ ${cat}`;
        btn.onclick = () => selectQuickCategory(cat);
        container.appendChild(btn);
    });
}

function selectQuickCategory(categoryName) {
    document.getElementById('prod-category').value = categoryName;
}

function renderProductTable() {
    const tbody = document.getElementById('product-table-body');
    const search = document.getElementById('product-search').value.toLowerCase();
    const filtered = products.filter(p => p.name.toLowerCase().includes(search) || p.category.toLowerCase().includes(search) || p.id.toLowerCase().includes(search));

    document.getElementById('product-count-badge').innerText = products.length;
    tbody.innerHTML = '';
    const paginationEl = document.getElementById('product-pagination');

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-slate-400">Tidak ada produk ditemukan</td></tr>`;
        if (paginationEl) paginationEl.innerHTML = '';
        return;
    }

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    if (currentProductPage > totalPages) currentProductPage = totalPages || 1;
    const start = (currentProductPage - 1) * itemsPerPage;
    const paginatedItems = filtered.slice(start, start + itemsPerPage);

    const prefix = settings.productPrefix || 'PRD-';
    paginatedItems.forEach(p => {
        const margin = p.sellPrice - p.buyPrice;
        const marginPercent = p.buyPrice > 0 ? ((margin / p.buyPrice) * 100).toFixed(0) : 0;
        tbody.innerHTML += `
            <tr class="hover:bg-slate-50 transition">
                <td class="p-3.5 md:p-4">
                    <div class="flex flex-col space-y-1">
                        <span class="text-[10px] md:text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono w-fit">${escapeHtml(prefix)}${escapeHtml(p.id)}</span>
                        <span onclick="showProductDetail('${escapeHtml(p.id)}')" class="font-bold text-slate-800 cursor-pointer hover:text-indigo-600 hover:underline">
                            ${escapeHtml(p.name)}
                        </span>
                    </div>
                </td>
                <td class="p-3.5 md:p-4"><span class="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">${escapeHtml(p.category)}</span></td>
                <td class="p-3.5 md:p-4 text-slate-600">${formatRupiah(p.buyPrice)}</td>
                <td class="p-3.5 md:p-4 font-semibold text-slate-800">${formatRupiah(p.sellPrice)} <span class="text-[10px] ${margin >= 0 ? 'text-emerald-600' : 'text-rose-600'} font-normal block">${margin >= 0 ? '+' : ''}${marginPercent}% margin</span></td>
                <td class="p-3.5 md:p-4 text-center">
                    <span class="px-2.5 py-1 rounded-full text-xs font-bold ${p.stock <= 5 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-700'}">${p.stock}</span>
                </td>
            </tr>
        `;
    });

    renderProductPagination(totalPages);
}

function renderProductPagination(totalPages) {
    const paginationEl = document.getElementById('product-pagination');
    if (!paginationEl) return;
    if (totalPages <= 1) { paginationEl.innerHTML = ''; return; }
    paginationEl.innerHTML = `
        <span class="text-xs text-slate-500 font-medium">Hal ${currentProductPage} dari ${totalPages}</span>
        <div class="flex space-x-1">
            <button type="button" onclick="changeProductPage(-1)" ${currentProductPage === 1 ? 'disabled' : ''} class="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-lg text-xs font-semibold transition">Prev</button>
            <button type="button" onclick="changeProductPage(1)" ${currentProductPage === totalPages ? 'disabled' : ''} class="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition">Next</button>
        </div>
    `;
}

function changeProductPage(dir) {
    currentProductPage += dir;
    renderProductTable();
}

function showProductDetail(productId) {
    const p = products.find(item => item.id === productId);
    if (!p) return;

    const prefix = settings.productPrefix || 'PRD-';
    const dateFormatted = p.createdAt 
        ? new Date(p.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
        : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    document.getElementById('dt-name').innerText = p.name;
    document.getElementById('dt-date').innerText = dateFormatted;
    document.getElementById('dt-id').innerText = `${prefix}${p.id}`;
    document.getElementById('dt-category').innerText = p.category;
    document.getElementById('dt-buy').innerText = formatRupiah(p.buyPrice);
    document.getElementById('dt-sell').innerText = formatRupiah(p.sellPrice);
    
    const stockEl = document.getElementById('dt-stock');
    stockEl.innerText = `${p.stock} Unit`;
    stockEl.className = `font-bold text-xs ${p.stock <= 5 ? 'text-rose-600' : 'text-slate-800'}`;

    document.getElementById('btn-detail-edit').onclick = function() {
        closeDetailModal();
        openProductModal(productId);
    };

    document.getElementById('btn-detail-delete').onclick = function() {
        closeDetailModal();
        deleteProduct(productId);
    };

    document.getElementById('detail-modal').classList.remove('hidden');
}

function closeDetailModal() {
    document.getElementById('detail-modal').classList.add('hidden');
}

function openRestockModal() {
    document.getElementById('restock-search-input').value = '';
    document.getElementById('restock-qty').value = 10;
    document.getElementById('restock-selected-id').value = '';
    
    renderRestockProductList(products);
    updateRestockStockPreview();
    document.getElementById('restock-modal').classList.remove('hidden');
}

function renderRestockProductList(list) {
    const container = document.getElementById('restock-product-list-container');
    const countBadge = document.getElementById('restock-list-count');
    const selectedId = document.getElementById('restock-selected-id').value;
    
    countBadge.innerText = `${list.length} Produk`;
    container.innerHTML = '';

    if (list.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <i class="fa-solid fa-magnifying-glass text-2xl mb-1"></i>
                <p class="text-xs">Produk tidak ditemukan</p>
            </div>
        `;
        return;
    }

    const prefix = settings.productPrefix || 'PRD-';

    list.forEach(p => {
        const isSelected = p.id === selectedId;
        const isLowStock = p.stock <= 5;

        container.innerHTML += `
            <div onclick="selectRestockProduct('${escapeHtml(p.id)}')" class="p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${isSelected ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-600' : 'border-slate-200 hover:border-slate-300 bg-white'}">
                <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 rounded-xl ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'} flex items-center justify-center text-xs font-bold transition shrink-0">
                        ${isSelected ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-solid fa-box"></i>'}
                    </div>
                    <div>
                        <div class="flex items-center space-x-2">
                            <h5 class="font-bold text-xs text-slate-800">${escapeHtml(p.name)}</h5>
                            <span class="text-[10px] font-mono text-slate-400">${escapeHtml(prefix)}${escapeHtml(p.id)}</span>
                        </div>
                        <p class="text-[11px] text-slate-500">${escapeHtml(p.category)} • Harga Modal: ${formatRupiah(p.buyPrice)}</p>
                    </div>
                </div>

                <div class="text-right shrink-0">
                    <span class="inline-block text-[11px] font-bold px-2.5 py-1 rounded-full ${isLowStock ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-700'}">
                        Stok: ${p.stock}
                    </span>
                    ${isLowStock ? '<span class="block text-[9px] font-semibold text-rose-500 mt-0.5">Perlu Restok</span>' : ''}
                </div>
            </div>
        `;
    });
}

function filterRestockList() {
    const keyword = document.getElementById('restock-search-input').value.toLowerCase();
    const matched = products.filter(p => 
        p.name.toLowerCase().includes(keyword) || 
        p.category.toLowerCase().includes(keyword) || 
        p.id.toLowerCase().includes(keyword)
    );
    renderRestockProductList(matched);
}

function selectRestockProduct(productId) {
    document.getElementById('restock-selected-id').value = productId;
    filterRestockList();
    updateRestockStockPreview();
}

function setRestockQtyQuick(amount) {
    const currentQty = parseInt(document.getElementById('restock-qty').value) || 0;
    document.getElementById('restock-qty').value = currentQty + amount;
    updateRestockStockPreview();
}

function updateRestockStockPreview() {
    const selectedId = document.getElementById('restock-selected-id').value;
    const restockQty = parseInt(document.getElementById('restock-qty').value) || 0;
    const btnSubmit = document.getElementById('btn-submit-restock');
    const previewText = document.getElementById('restock-calc-text');

    const product = products.find(p => p.id === selectedId);

    if (product && restockQty > 0) {
        const newTotal = product.stock + restockQty;
        previewText.innerHTML = `${product.stock} <i class="fa-solid fa-arrow-right text-[10px] mx-1 text-slate-400"></i> <span class="text-emerald-600 font-bold">${newTotal} Unit</span>`;
        btnSubmit.disabled = false;
    } else {
        previewText.innerText = '-- Pilih Produk Terlebih Dahulu --';
        btnSubmit.disabled = true;
    }
}

function closeRestockModal() {
    document.getElementById('restock-modal').classList.add('hidden');
}

async function submitRestock(event) {
    event.preventDefault();
    const id = document.getElementById('restock-selected-id').value;
    const qty = parseInt(document.getElementById('restock-qty').value) || 0;

    if (!id || qty <= 0) {
        showToast('Pilih produk dan pastikan jumlah restok valid!', true);
        return;
    }

    try {
        let prodName = '';
        await mutateStoreDataAtomic((state) => {
            const product = state.products.find(p => p.id === id);
            if (!product) throw new Error('Produk tidak ditemukan!');
            product.stock += qty;
            prodName = product.name;
        });
        renderProductTable();
        closeRestockModal();
        showToast(`Berhasil menambah stok ${prodName} sebanyak ${qty} unit`);
    } catch (err) {
        showToast(err.message || 'Gagal menambah stok!', true);
    }
}

function openProductModal(productId = null) {
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('product-modal-title');
    document.getElementById('product-form').reset();
    document.getElementById('prod-edit-id').value = '';

    if (productId) {
        title.innerText = 'Edit Data Produk';
        const p = products.find(item => item.id === productId);
        if (p) {
            document.getElementById('prod-edit-id').value = p.id;
            document.getElementById('prod-name').value = p.name;
            document.getElementById('prod-category').value = p.category;
            document.getElementById('prod-buy-price').value = p.buyPrice;
            document.getElementById('prod-sell-price').value = p.sellPrice;
            document.getElementById('prod-stock').value = p.stock;
        }
    } else {
        title.innerText = 'Tambah Produk Baru';
    }

    renderCategoryQuickSelect();
    modal.classList.remove('hidden');
}

function closeProductModal() {
    document.getElementById('product-modal').classList.add('hidden');
}

async function saveProduct(event) {
    event.preventDefault();
    const editId = document.getElementById('prod-edit-id').value;
    const name = document.getElementById('prod-name').value.trim();
    const category = document.getElementById('prod-category').value.trim();
    const buyPrice = parseFloat(document.getElementById('prod-buy-price').value);
    const sellPrice = parseFloat(document.getElementById('prod-sell-price').value);
    const stock = parseInt(document.getElementById('prod-stock').value);

    if (!name || !category || Number.isNaN(buyPrice) || Number.isNaN(sellPrice) || Number.isNaN(stock) || buyPrice < 0 || sellPrice < 0 || stock < 0) {
        showToast('Pastikan semua data produk valid dan tidak bernilai negatif!', true);
        return;
    }

    if (sellPrice < buyPrice) {
        if (!confirm('Harga jual lebih rendah dari harga modal (HPP) dan berpotensi rugi. Tetap simpan produk ini?')) {
            return;
        }
    }

    try {
        const newId = editId || generateUniqueProductId();
        await mutateStoreDataAtomic((state) => {
            if (editId) {
                const p = state.products.find(item => item.id == editId);
                if (p) {
                    p.name = name;
                    p.category = category;
                    p.buyPrice = buyPrice;
                    p.sellPrice = sellPrice;
                    p.stock = stock;
                }
            } else {
                state.products.push({ id: newId, name, category, buyPrice, sellPrice, stock, createdAt: new Date().toISOString() });
            }
        });

        syncCartWithProducts();
        closeProductModal();
        renderProductTable();
        showToast(editId ? 'Produk berhasil diperbarui!' : `Produk baru berhasil ditambahkan dengan kode ${newId}!`);
    } catch (err) {
        showToast(err.message || 'Gagal menyimpan produk!', true);
    }
}

async function deleteProduct(id) {
    if (confirm('Apakah Anda yakin ingin menghapus produk ini dari katalog?')) {
        try {
            await mutateStoreDataAtomic((state) => {
                state.products = state.products.filter(p => p.id !== id);
            });
            syncCartWithProducts();
            renderProductTable();
            showToast('Produk berhasil dihapus');
        } catch (err) {
            showToast(err.message || 'Gagal menghapus produk!', true);
        }
    }
}
