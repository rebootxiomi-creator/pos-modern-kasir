function renderPOSView() {
    renderCategoryFilters();
    filterPOSProducts();
    renderCart();
}

function switchPosMobileView(mode) {
    const catalogPanel = document.getElementById('pos-catalog-panel');
    const cartPanel = document.getElementById('pos-cart-panel');
    const btnCat = document.getElementById('btn-mob-catalog');
    const btnCart = document.getElementById('btn-mob-cart');

    if (mode === 'cart') {
        if (catalogPanel) catalogPanel.classList.add('hidden');
        if (cartPanel) {
            cartPanel.classList.remove('hidden');
            cartPanel.classList.add('flex');
        }
        if (btnCart) {
            btnCart.classList.add('bg-indigo-600', 'text-white', 'shadow-sm');
            btnCart.classList.remove('text-slate-600');
        }
        if (btnCat) {
            btnCat.classList.remove('bg-indigo-600', 'text-white', 'shadow-sm');
            btnCat.classList.add('text-slate-600');
        }
    } else {
        if (catalogPanel) catalogPanel.classList.remove('hidden');
        if (cartPanel) {
            cartPanel.classList.add('hidden');
            cartPanel.classList.remove('flex');
        }
        if (btnCat) {
            btnCat.classList.add('bg-indigo-600', 'text-white', 'shadow-sm');
            btnCat.classList.remove('text-slate-600');
        }
        if (btnCart) {
            btnCart.classList.remove('bg-indigo-600', 'text-white', 'shadow-sm');
            btnCart.classList.add('text-slate-600');
        }
    }
}

function renderCategoryFilters() {
    const container = document.getElementById('pos-category-filters');
    if (!container) return;

    const list = Array.isArray(products) ? products : [];
    const categories = ['Semua', ...new Set(list.map(p => p && p.category).filter(Boolean))];
    if (!categories.includes(activeCategory)) {
        activeCategory = 'Semua';
    }

    container.innerHTML = categories.map(cat => {
        const isActive = activeCategory === cat;
        return `
            <button type="button" onclick="selectCategory('${escapeHtml(cat)}')"
                class="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
                ${escapeHtml(cat)}
            </button>
        `;
    }).join('');
}

function selectCategory(cat) {
    activeCategory = cat || 'Semua';
    currentPOSPage = 1;
    renderCategoryFilters();
    filterPOSProducts();
}

function goToPOSPage(page) {
    currentPOSPage = Math.max(1, Number(page) || 1);
    filterPOSProducts();
}

function filterPOSProducts() {
    const list = Array.isArray(products) ? products : [];
    const searchEl = document.getElementById('pos-search');
    const query = (searchEl && typeof searchEl.value === 'string' ? searchEl.value : '').trim().toLowerCase();

    const filtered = list.filter(p => {
        if (!p) return false;
        const matchCat = activeCategory === 'Semua' || p.category === activeCategory;
        const codeStr = formatProductCode(p.id).toLowerCase();
        const matchQuery = !query ||
            String(p.name || '').toLowerCase().includes(query) ||
            String(p.category || '').toLowerCase().includes(query) ||
            codeStr.includes(query);
        return matchCat && matchQuery;
    });

    const pageSize = (typeof itemsPerPage === 'number' && itemsPerPage > 0) ? itemsPerPage : 9;
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    if (currentPOSPage > totalPages) currentPOSPage = totalPages;
    if (currentPOSPage < 1) currentPOSPage = 1;

    const start = (currentPOSPage - 1) * pageSize;
    const paged = filtered.slice(start, start + pageSize);

    const grid = document.getElementById('pos-product-grid');
    if (grid) {
        if (paged.length === 0) {
            grid.innerHTML = `<div class="col-span-full text-center py-10 text-slate-400 text-xs md:text-sm">Produk tidak ditemukan</div>`;
        } else {
            grid.innerHTML = paged.map(p => {
                const stock = Number(p.stock) || 0;
                const outOfStock = stock <= 0;
                return `
                    <button type="button" onclick="addToCart('${escapeHtml(p.id)}')" ${outOfStock ? 'disabled' : ''}
                        class="text-left bg-slate-50 hover:bg-indigo-50/70 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 hover:border-indigo-300 rounded-2xl p-3 flex flex-col justify-between transition group">
                        <div>
                            <div class="flex items-center justify-between gap-1 mb-1.5">
                                <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-white text-indigo-600 border border-indigo-100">${escapeHtml(p.category || 'Umum')}</span>
                                <span class="text-[10px] font-mono text-slate-400">${escapeHtml(formatProductCode(p.id))}</span>
                            </div>
                            <h4 class="font-bold text-slate-800 text-xs md:text-sm line-clamp-2 group-hover:text-indigo-700">${escapeHtml(p.name)}</h4>
                        </div>
                        <div class="mt-3 pt-2 border-t border-slate-200/70 flex items-end justify-between">
                            <span class="font-bold text-indigo-600 text-xs md:text-sm">${formatRupiah(p.sellPrice)}</span>
                            <span class="text-[10px] font-semibold ${outOfStock ? 'text-rose-600' : 'text-slate-500'}">Stok: ${stock}</span>
                        </div>
                    </button>
                `;
            }).join('');
        }
    }

    const pagEl = document.getElementById('pos-pagination');
    if (pagEl) {
        pagEl.innerHTML = `
            <span class="text-xs text-slate-500">Halaman <b>${currentPOSPage}</b> dari <b>${totalPages}</b></span>
            <div class="flex items-center space-x-1.5">
                <button type="button" ${currentPOSPage <= 1 ? 'disabled' : ''} onclick="goToPOSPage(${currentPOSPage - 1})"
                    class="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40">Prev</button>
                <button type="button" ${currentPOSPage >= totalPages ? 'disabled' : ''} onclick="goToPOSPage(${currentPOSPage + 1})"
                    class="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40">Next</button>
            </div>
        `;
    }
}

function renderPagination(containerId, currentPage, totalPages, onPageChange) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = `
        <span class="text-xs text-slate-500">Halaman <b>${currentPage}</b> dari <b>${totalPages}</b></span>
        <div class="flex items-center space-x-1.5">
            <button type="button" ${currentPage <= 1 ? 'disabled' : ''} onclick="(${onPageChange.toString()})(${currentPage - 1})"
                class="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40">Prev</button>
            <button type="button" ${currentPage >= totalPages ? 'disabled' : ''} onclick="(${onPageChange.toString()})(${currentPage + 1})"
                class="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40">Next</button>
        </div>
    `;
}

function syncCartWithProducts() {
    if (!Array.isArray(cart)) cart = [];
    const list = Array.isArray(products) ? products : [];
    cart = cart.filter(item => {
        const prod = list.find(p => p && p.id === item.id);
        if (!prod || (Number(prod.stock) || 0) <= 0) return false;
        item.name = prod.name;
        item.price = Number(prod.sellPrice) || 0;
        item.buyPrice = Number(prod.buyPrice ?? prod.costPrice ?? prod.hpp ?? prod.modal ?? 0) || 0;
        if (item.qty > Number(prod.stock)) {
            item.qty = Number(prod.stock);
        }
        return item.qty > 0;
    });
    renderCart();
}

function addToCart(productId) {
    const list = Array.isArray(products) ? products : [];
    const prod = list.find(p => p && p.id === productId);
    if (!prod) return;
    const maxStock = Number(prod.stock) || 0;
    if (maxStock <= 0) {
        showToast('Stok produk habis!', true);
        return;
    }

    const unitCost = Number(prod.buyPrice ?? prod.costPrice ?? prod.hpp ?? prod.modal ?? 0) || 0;
    const existing = cart.find(i => i.id === productId);
    if (existing) {
        if (existing.qty + 1 > maxStock) {
            showToast(`Maksimal stok ${prod.name} hanya ${maxStock} unit!`, true);
            return;
        }
        existing.qty += 1;
        existing.buyPrice = unitCost;
    } else {
        cart.push({
            id: prod.id,
            name: prod.name,
            price: Number(prod.sellPrice) || 0,
            buyPrice: unitCost,
            qty: 1
        });
    }

    renderCart();
    showToast(`${prod.name} ditambahkan ke keranjang`);
}

function updateCartQty(productId, delta) {
    const idx = cart.findIndex(i => i.id === productId);
    if (idx === -1) return;
    const list = Array.isArray(products) ? products : [];
    const prod = list.find(p => p && p.id === productId);
    const maxStock = prod ? (Number(prod.stock) || 0) : 0;
    const nextQty = cart[idx].qty + delta;

    if (nextQty <= 0) {
        cart.splice(idx, 1);
    } else if (nextQty > maxStock) {
        showToast(`Stok tersedia hanya ${maxStock} unit!`, true);
        return;
    } else {
        cart[idx].qty = nextQty;
    }
    renderCart();
}

function clearCart() {
    cart = [];
    const discInput = document.getElementById('cart-discount-input');
    if (discInput) discInput.value = '0';
    renderCart();
}

function getCartTotals() {
    const items = Array.isArray(cart) ? cart : [];
    const subtotal = items.reduce((sum, i) => sum + ((Number(i.price) || 0) * (Number(i.qty) || 0)), 0);
    const rawDisc = parseFloat(document.getElementById('cart-discount-input')?.value) || 0;
    const discType = document.getElementById('cart-discount-type')?.value || 'nominal';

    let discount = 0;
    if (discType === 'percent') {
        const clampedPct = Math.max(0, Math.min(100, rawDisc));
        discount = Math.round((subtotal * clampedPct) / 100);
    } else {
        discount = Math.max(0, Math.min(subtotal, rawDisc));
    }

    const total = Math.max(0, subtotal - discount);
    return { subtotal, discount, total };
}

function renderCart() {
    const items = Array.isArray(cart) ? cart : [];
    const listEl = document.getElementById('pos-cart-items');
    const mobCountEl = document.getElementById('mob-cart-count');
    const checkoutBtn = document.getElementById('btn-checkout');

    const totalQty = items.reduce((s, i) => s + (Number(i.qty) || 0), 0);
    if (mobCountEl) mobCountEl.innerText = String(totalQty);

    if (listEl) {
        if (items.length === 0) {
            listEl.innerHTML = `<div class="text-center py-10 text-slate-400 text-xs">Keranjang masih kosong</div>`;
        } else {
            listEl.innerHTML = items.map(item => `
                <div class="pt-3 first:pt-0 flex items-center justify-between gap-2">
                    <div class="min-w-0 flex-1">
                        <h5 class="font-bold text-slate-800 text-xs truncate">${escapeHtml(item.name)}</h5>
                        <p class="text-[11px] text-slate-500">${formatRupiah(item.price)} / unit</p>
                    </div>
                    <div class="flex items-center space-x-1.5 shrink-0">
                        <button type="button" onclick="updateCartQty('${escapeHtml(item.id)}', -1)" class="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">-</button>
                        <span class="w-6 text-center text-xs font-bold">${item.qty}</span>
                        <button type="button" onclick="updateCartQty('${escapeHtml(item.id)}', 1)" class="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">+</button>
                    </div>
                    <div class="text-right w-20 shrink-0">
                        <span class="font-bold text-xs text-slate-800">${formatRupiah((Number(item.price) || 0) * (Number(item.qty) || 0))}</span>
                    </div>
                </div>
            `).join('');
        }
    }

    const { subtotal, discount, total } = getCartTotals();
    const elSub = document.getElementById('cart-subtotal');
    const elDisc = document.getElementById('cart-discount-display');
    const elTot = document.getElementById('cart-total');

    if (elSub) elSub.innerText = formatRupiah(subtotal);
    if (elDisc) elDisc.innerText = formatRupiah(discount);
    if (elTot) elTot.innerText = formatRupiah(total);

    if (checkoutBtn) checkoutBtn.disabled = items.length === 0;
}

function buildQrisPayload(trxTotal, storeName) {
    const cleanStore = String(storeName || 'TOKO POS').replace(/[^A-Za-z0-9 ]/g, '').slice(0, 25);
    const amt = Math.max(0, Math.round(Number(trxTotal) || 0));
    return `QRIS|${cleanStore}|AMOUNT:${amt}|TS:${Date.now()}`;
}

function renderQrisBox(total) {
    const box = document.getElementById('qris-dynamic-render');
    const info = document.getElementById('qris-payment-info');
    const checkbox = document.getElementById('qris-paid-confirm');
    if (checkbox) checkbox.checked = false;

    const payload = buildQrisPayload(total, typeof settings !== 'undefined' ? settings.storeName : 'POS');
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(payload)}`;

    if (box) {
        box.innerHTML = `
            <img src="${qrUrl}" alt="QRIS Pembayaran" class="w-36 h-36 mx-auto rounded-lg"
                onerror="this.style.display='none'; document.getElementById('qris-fallback-code').classList.remove('hidden');">
            <div id="qris-fallback-code" class="hidden w-36 h-36 bg-slate-900 text-white rounded-xl flex flex-col items-center justify-center p-2 mx-auto">
                <i class="fa-solid fa-qrcode text-4xl mb-1"></i>
                <span class="text-[10px] font-mono break-all text-center">${escapeHtml(payload)}</span>
            </div>
        `;
    }
    if (info) {
        info.innerText = `Scan QR untuk membayar ${formatRupiah(total)}`;
    }
}

function openPaymentModal() {
    if (!Array.isArray(cart) || cart.length === 0) return;
    isCheckingOut = false;
    const { total } = getCartTotals();
    const modal = document.getElementById('payment-modal');
    const totalEl = document.getElementById('modal-pay-total');
    const cashInput = document.getElementById('pay-cash-input');

    if (totalEl) totalEl.innerText = formatRupiah(total);
    if (cashInput) cashInput.value = '';
    selectPaymentMethod('cash');
    calculateChange();

    if (modal) modal.classList.remove('hidden');
}

function closePaymentModal() {
    isCheckingOut = false;
    const modal = document.getElementById('payment-modal');
    if (modal) modal.classList.add('hidden');
}

function selectPaymentMethod(method) {
    paymentMethod = method || 'cash';

    const cashBtn = document.getElementById('pm-cash-btn');
    const qrisBtn = document.getElementById('pm-qris-btn');
    const tfBtn = document.getElementById('pm-transfer-btn');

    const cashSec = document.getElementById('cash-payment-section');
    const qrisSec = document.getElementById('qris-payment-section');
    const tfSec = document.getElementById('transfer-payment-section');

    const activeCls = "py-2.5 px-2 rounded-xl border-2 border-indigo-600 bg-indigo-50 text-indigo-700 text-xs font-semibold flex items-center justify-center space-x-1.5 transition";
    const idleCls = "py-2.5 px-2 rounded-xl border-2 border-slate-200 bg-white text-slate-600 text-xs font-semibold flex items-center justify-center space-x-1.5 transition";

    if (cashBtn) cashBtn.className = paymentMethod === 'cash' ? activeCls : idleCls;
    if (qrisBtn) qrisBtn.className = paymentMethod === 'qris' ? activeCls : idleCls;
    if (tfBtn) tfBtn.className = paymentMethod === 'transfer' ? activeCls : idleCls;

    if (cashSec) cashSec.classList.toggle('hidden', paymentMethod !== 'cash');
    if (qrisSec) qrisSec.classList.toggle('hidden', paymentMethod !== 'qris');
    if (tfSec) tfSec.classList.toggle('hidden', paymentMethod !== 'transfer');

    const { total } = getCartTotals();
    if (paymentMethod === 'qris') {
        renderQrisBox(total);
    } else if (paymentMethod === 'transfer') {
        const bankAcc = Array.isArray(accounts)
            ? accounts.find(a => a && (a.id === 'ACC-BANK' || a.type === 'bank'))
            : null;
        const targetEl = document.getElementById('transfer-bank-target');
        const amtEl = document.getElementById('transfer-exact-amount');
        if (targetEl) {
            targetEl.innerText = bankAcc
                ? `Rekening tujuan: ${bankAcc.name} (${bankAcc.accountNumber || '-'})`
                : 'Rekening tujuan: Rekening Bank Utama';
        }
        if (amtEl) amtEl.innerText = `Nominal: ${formatRupiah(total)}`;
    }

    calculateChange();
}

function setQuickCash(amount) {
    const input = document.getElementById('pay-cash-input');
    if (input) input.value = String(amount);
    calculateChange();
}

function setExactCash() {
    const { total } = getCartTotals();
    const input = document.getElementById('pay-cash-input');
    if (input) input.value = String(total);
    calculateChange();
}

function calculateChange() {
    const { total } = getCartTotals();
    const confirmBtn = document.getElementById('btn-confirm-pay');
    const changeEl = document.getElementById('pay-change-display');

    if (!Array.isArray(cart) || cart.length === 0) {
        if (changeEl) changeEl.innerText = formatRupiah(0);
        if (confirmBtn) confirmBtn.disabled = true;
        return;
    }

    if (paymentMethod === 'qris') {
        if (changeEl) changeEl.innerText = formatRupiah(0);
        const isPaid = Boolean(document.getElementById('qris-paid-confirm')?.checked);
        if (confirmBtn) confirmBtn.disabled = total > 0 && !isPaid;
        return;
    }

    if (paymentMethod === 'transfer') {
        if (changeEl) changeEl.innerText = formatRupiah(0);
        if (confirmBtn) confirmBtn.disabled = false;
        return;
    }

    const rawCash = document.getElementById('pay-cash-input')?.value;
    const cashGiven = rawCash === '' || rawCash === undefined || rawCash === null
        ? (total === 0 ? 0 : -1)
        : (parseFloat(rawCash) || 0);

    const isEnough = cashGiven >= total;
    const change = isEnough ? Math.max(0, cashGiven - total) : 0;
    if (changeEl) changeEl.innerText = formatRupiah(change);
    if (confirmBtn) confirmBtn.disabled = !isEnough;
}

async function processCheckoutFinal() {
    if (isCheckingOut || !Array.isArray(cart) || cart.length === 0) return;

    const { subtotal, discount, total } = getCartTotals();
    const rawCash = document.getElementById('pay-cash-input')?.value;
    const cashGiven = paymentMethod === 'cash'
        ? (rawCash === '' || rawCash === undefined || rawCash === null ? (total === 0 ? 0 : -1) : (parseFloat(rawCash) || 0))
        : total;

    if (paymentMethod === 'cash' && cashGiven < total) {
        showToast('Nominal tunai kurang dari total tagihan!', true);
        calculateChange();
        return;
    }

    if (paymentMethod === 'qris' && total > 0 && !document.getElementById('qris-paid-confirm')?.checked) {
        showToast('Centang konfirmasi pembayaran QRIS terlebih dahulu!', true);
        return;
    }

    isCheckingOut = true;
    const confirmBtn = document.getElementById('btn-confirm-pay');
    if (confirmBtn) confirmBtn.disabled = true;

    const change = paymentMethod === 'cash' ? Math.max(0, cashGiven - total) : 0;
    const customerName = (document.getElementById('pos-customer-name')?.value || '').trim() || 'Umum';
    const cartSnapshot = JSON.parse(JSON.stringify(cart));
    const trxId = `TRX-${Math.floor(100000 + Math.random() * 900000)}`;
    const nowIso = new Date().toISOString();
    const operatorName = (typeof currentUser !== 'undefined' && currentUser && currentUser.name)
        ? currentUser.name
        : ((typeof settings !== 'undefined' && settings && settings.cashierName) ? settings.cashierName : 'Admin');

    try {
        let createdTrx = null;

        await mutateStoreDataAtomic((state) => {
            if (!Array.isArray(state.products)) state.products = [];
            if (!Array.isArray(state.transactions)) state.transactions = [];
            if (!Array.isArray(state.accounts)) state.accounts = [];

            let totalCost = 0;

            for (const item of cartSnapshot) {
                const prod = state.products.find(p => p && p.id === item.id);
                if (!prod) {
                    throw new Error(`Produk "${item.name}" tidak ditemukan.`);
                }
                const currentStock = Number(prod.stock) || 0;
                const qty = Number(item.qty) || 0;
                if (currentStock < qty) {
                    throw new Error(`Stok "${prod.name}" tidak mencukupi (tersisa ${currentStock}).`);
                }
                prod.stock = currentStock - qty;
                const unitCost = Number(
                    item.buyPrice ?? item.costPrice ?? item.hpp ?? item.modal ??
                    prod.buyPrice ?? prod.costPrice ?? prod.hpp ?? prod.modal ?? 0
                ) || 0;
                item.buyPrice = unitCost;
                totalCost += unitCost * qty;
            }

            const profit = total - totalCost;
            createdTrx = {
                id: trxId,
                timestamp: nowIso,
                customerName,
                cashier: operatorName,
                items: cartSnapshot,
                subtotal,
                discount,
                total,
                totalCost,
                profit,
                paymentMethod,
                cashGiven: Math.max(0, cashGiven),
                change,
                status: 'VALID'
            };

            state.transactions.push(createdTrx);

            const targetAcc = paymentMethod === 'transfer'
                ? state.accounts.find(a => a && (a.id === 'ACC-BANK' || a.type === 'bank'))
                : paymentMethod === 'qris'
                    ? state.accounts.find(a => a && a.id === 'ACC-QRIS')
                    : state.accounts.find(a => a && a.id === 'ACC-CASH');
            if (targetAcc) {
                targetAcc.balance = (Number(targetAcc.balance) || 0) + total;
            }
        });

        clearCart();
        const custInput = document.getElementById('pos-customer-name');
        if (custInput) custInput.value = '';
        closePaymentModal();
        filterPOSProducts();
        if (typeof renderDashboard === 'function') renderDashboard();
        showToast(`Transaksi ${trxId} berhasil!`);

        if (createdTrx) {
            openReceiptModal(createdTrx);
        }
    } catch (err) {
        console.error('Checkout error:', err);
        showToast(err && err.message ? err.message : 'Gagal memproses transaksi!', true);
    } finally {
        isCheckingOut = false;
        calculateChange();
    }
}

function openReceiptById(trxId) {
    const list = Array.isArray(transactions) ? transactions : [];
    const trx = list.find(t => t && t.id === trxId);
    if (trx) openReceiptModal(trx);
}

function openReceiptModal(trx) {
    currentTransactionToPrint = trx;
    const modal = document.getElementById('receipt-modal');
    if (!modal) return;

    const logoPrint = document.getElementById('receipt-logo-print');
    if (logoPrint) {
        logoPrint.innerHTML = settings.storeLogo
            ? `<img src="${settings.storeLogo}" alt="Logo" class="w-10 h-10 object-cover rounded-lg">`
            : '';
    }

    const setTxt = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    };

    setTxt('receipt-store-name', settings.storeName || 'Toko Berkah Jaya');
    setTxt('receipt-store-address', settings.storeAddress || '');
    setTxt('receipt-store-phone', settings.storePhone ? `Telp: ${settings.storePhone}` : '');

    const voidBanner = document.getElementById('receipt-void-banner');
    if (voidBanner) voidBanner.classList.toggle('hidden', trx.status !== 'VOID');

    setTxt('receipt-id', trx.id);
    setTxt('receipt-customer', trx.customerName || 'Umum');
    setTxt('receipt-time', new Date(trx.timestamp).toLocaleString('id-ID'));
    setTxt('receipt-cashier', trx.cashier || 'Admin');

    const itemsList = document.getElementById('receipt-items-list');
    if (itemsList) {
        itemsList.innerHTML = (trx.items || []).map(item => `
            <div class="flex justify-between">
                <div>
                    <div class="font-bold">${escapeHtml(item.name)}</div>
                    <div class="text-[10px] text-slate-500">${item.qty} x ${formatRupiah(item.price)}</div>
                </div>
                <div class="font-bold">${formatRupiah(item.qty * item.price)}</div>
            </div>
        `).join('');
    }

    setTxt('receipt-subtotal', formatRupiah(trx.subtotal));
    setTxt('receipt-discount', formatRupiah(trx.discount));
    setTxt('receipt-total', formatRupiah(trx.total));
    setTxt('receipt-method', (trx.paymentMethod || 'cash').toUpperCase());
    setTxt('receipt-cash-given', formatRupiah(trx.cashGiven || trx.total));
    setTxt('receipt-cash-change', formatRupiah(trx.change || 0));

    modal.classList.remove('hidden');
}

function closeReceiptModal() {
    const modal = document.getElementById('receipt-modal');
    if (modal) modal.classList.add('hidden');
}
