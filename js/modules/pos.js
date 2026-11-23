// Centralized, clamped cart totals calculator
function calculateCartTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.sellPrice * item.qty), 0);
    const rawDiscount = parseFloat(document.getElementById('cart-discount-input')?.value) || 0;
    const discountType = document.getElementById('cart-discount-type')?.value || 'nominal';

    let discountAmount = 0;
    if (discountType === 'percent') {
        const clampedPercent = Math.min(100, Math.max(0, rawDiscount));
        discountAmount = Math.round((subtotal * clampedPercent) / 100);
    } else {
        const clampedNominal = Math.max(0, rawDiscount);
        discountAmount = Math.min(subtotal, clampedNominal);
    }

    const total = Math.max(0, subtotal - discountAmount);
    return { subtotal, discountAmount, total };
}

// Reconcile cart items when products update (from cloud snapshot, edit, or delete)
function syncCartWithProducts() {
    let adjusted = false;
    cart = cart.reduce((acc, item) => {
        const prod = products.find(p => p.id === item.id);
        if (!prod || prod.stock <= 0) {
            adjusted = true;
            return acc;
        }
        const clampedQty = Math.min(item.qty, prod.stock);
        if (clampedQty !== item.qty || prod.sellPrice !== item.sellPrice || prod.buyPrice !== item.buyPrice) {
            adjusted = true;
        }
        acc.push({
            ...item,
            name: prod.name,
            buyPrice: prod.buyPrice,
            sellPrice: prod.sellPrice,
            qty: clampedQty
        });
        return acc;
    }, []);

    if (adjusted && document.getElementById('tab-pos') && !document.getElementById('tab-pos').classList.contains('hidden')) {
        renderCart();
    }
}

function switchPosMobileView(view) {
    const catalogPanel = document.getElementById('pos-catalog-panel');
    const cartPanel = document.getElementById('pos-cart-panel');
    const btnCatalog = document.getElementById('btn-mob-catalog');
    const btnCart = document.getElementById('btn-mob-cart');

    if (view === 'catalog') {
        catalogPanel.classList.remove('hidden');
        catalogPanel.classList.add('flex');
        cartPanel.classList.add('hidden');
        cartPanel.classList.remove('flex');
        cartPanel.classList.add('lg:flex');
        btnCatalog.className = "flex-1 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white shadow-sm transition";
        btnCart.className = "flex-1 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900 transition";
    } else {
        catalogPanel.classList.add('hidden');
        catalogPanel.classList.remove('flex');
        catalogPanel.classList.add('lg:flex');
        cartPanel.classList.remove('hidden');
        cartPanel.classList.add('flex');
        btnCart.className = "flex-1 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white shadow-sm transition";
        btnCatalog.className = "flex-1 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900 transition";
    }
}

function renderPOSCategories() {
    const categoriesContainer = document.getElementById('pos-category-filters');
    if (!categoriesContainer) return;
    
    const cats = ['Semua', ...new Set(products.map(p => p.category))];
    categoriesContainer.innerHTML = '';
    cats.forEach(c => {
        const isActive = activeCategory === c;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${isActive ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`;
        btn.textContent = c;
        btn.onclick = () => filterCategory(c);
        categoriesContainer.appendChild(btn);
    });
}

function renderPOSCatalog() {
    const grid = document.getElementById('pos-product-grid');
    renderPOSCategories();

    const searchQuery = document.getElementById('pos-search').value.toLowerCase().trim();
    const filtered = products.filter(p => {
        const matchCat = activeCategory === 'Semua' || p.category === activeCategory;
        const matchSearch = p.name.toLowerCase().includes(searchQuery) || 
                            p.category.toLowerCase().includes(searchQuery) || 
                            p.id.toLowerCase().includes(searchQuery);

        if (searchQuery !== '') {
            return matchSearch;
        }
        return matchCat;
    });

    grid.innerHTML = '';
    const paginationEl = document.getElementById('pos-pagination');

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-16 text-slate-400"><i class="fa-solid fa-box-open text-3xl mb-2"></i><p class="text-sm">Produk tidak ditemukan</p></div>`;
        if (paginationEl) paginationEl.innerHTML = '';
        renderCart();
        return;
    }

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    if (currentPOSPage > totalPages) currentPOSPage = totalPages || 1;
    const start = (currentPOSPage - 1) * itemsPerPage;
    const paginatedItems = filtered.slice(start, start + itemsPerPage);

    paginatedItems.forEach(p => {
        const isOut = p.stock <= 0;
        const prefix = settings.productPrefix || 'PRD-';
        grid.innerHTML += `
            <div onclick="${isOut ? '' : `addToCart('${escapeHtml(p.id)}')`}" class="bg-white border border-slate-200 rounded-2xl p-2.5 md:p-3 flex flex-col justify-between shadow-sm hover:shadow-md transition cursor-pointer relative group ${isOut ? 'opacity-60 cursor-not-allowed bg-slate-50' : 'hover:border-indigo-300'}">
                ${isOut ? '<span class="absolute top-2 right-2 bg-rose-100 text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded-full">Habis</span>' : ''}
                <div>
                    <div class="flex justify-between items-center">
                        <span class="text-[9px] md:text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">${escapeHtml(p.category)}</span>
                        <span class="text-[9px] md:text-[10px] text-slate-400 font-mono">${escapeHtml(prefix)}${escapeHtml(p.id)}</span>
                    </div>
                    <h4 class="font-bold text-slate-800 text-xs md:text-sm mt-1 line-clamp-2">${escapeHtml(p.name)}</h4>
                </div>
                <div class="mt-2.5 md:mt-3 flex items-end justify-between">
                    <div>
                        <p class="text-[10px] md:text-[11px] text-slate-400">Stok: ${p.stock}</p>
                        <p class="font-bold text-slate-900 text-xs md:text-sm mt-0.5">${formatRupiah(p.sellPrice)}</p>
                    </div>
                    <div class="w-7 h-7 md:w-8 md:h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition">
                        <i class="fa-solid fa-plus text-[10px] md:text-xs"></i>
                    </div>
                </div>
            </div>
        `;
    });

    renderPOSPagination(totalPages);
    renderCart();
}

function filterPOSProducts() {
    currentPOSPage = 1;
    renderPOSCatalog();
}

function renderPOSPagination(totalPages) {
    const paginationEl = document.getElementById('pos-pagination');
    if (!paginationEl) return;
    if (totalPages <= 1) { paginationEl.innerHTML = ''; return; }
    paginationEl.innerHTML = `
        <span class="text-xs text-slate-500 font-medium">Hal ${currentPOSPage} dari ${totalPages}</span>
        <div class="flex space-x-1">
            <button type="button" onclick="changePOSPage(-1)" ${currentPOSPage === 1 ? 'disabled' : ''} class="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-lg text-xs font-semibold transition">Prev</button>
            <button type="button" onclick="changePOSPage(1)" ${currentPOSPage === totalPages ? 'disabled' : ''} class="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition">Next</button>
        </div>
    `;
}

function changePOSPage(dir) {
    currentPOSPage += dir;
    renderPOSCatalog();
}

function filterCategory(cat) {
    activeCategory = cat;
    currentPOSPage = 1;
    renderPOSCatalog();
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product || product.stock <= 0) return;

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        if (existingItem.qty < product.stock) {
            existingItem.qty++;
        } else {
            showToast('Stok produk tidak mencukupi!', true);
        }
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            buyPrice: product.buyPrice,
            sellPrice: product.sellPrice,
            qty: 1
        });
    }
    renderCart();
}

function updateCartQty(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;

    const product = products.find(p => p.id === productId);
    if (!product) {
        cart = cart.filter(i => i.id !== productId);
        renderCart();
        return;
    }
    const newQty = item.qty + delta;

    if (newQty > product.stock) {
        showToast('Stok maksimal tercapai!', true);
        return;
    }

    if (newQty <= 0) {
        cart = cart.filter(i => i.id !== productId);
    } else {
        item.qty = newQty;
    }
    renderCart();
}

function removeFromCart(productId) {
    cart = cart.filter(i => i.id !== productId);
    renderCart();
}

function clearCart() {
    cart = [];
    document.getElementById('cart-discount-input').value = 0;
    document.getElementById('pos-customer-name').value = '';
    renderCart();
}

function renderCart() {
    const container = document.getElementById('pos-cart-items');
    const subtotalEl = document.getElementById('cart-subtotal');
    const discountDisplayEl = document.getElementById('cart-discount-display');
    const totalEl = document.getElementById('cart-total');
    const btnCheckout = document.getElementById('btn-checkout');
    const mobCartCount = document.getElementById('mob-cart-count');

    const totalItemsCount = cart.reduce((sum, item) => sum + item.qty, 0);
    if (mobCartCount) mobCartCount.innerText = totalItemsCount;

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="text-center py-10 text-slate-400">
                <i class="fa-solid fa-basket-shopping text-3xl mb-2 text-slate-300"></i>
                <p class="text-xs md:text-sm">Keranjang masih kosong</p>
            </div>
        `;
        subtotalEl.innerText = formatRupiah(0);
        discountDisplayEl.innerText = formatRupiah(0);
        totalEl.innerText = formatRupiah(0);
        btnCheckout.disabled = true;
        return;
    }

    container.innerHTML = '';

    cart.forEach(item => {
        container.innerHTML += `
            <div class="flex items-center justify-between py-2">
                <div class="flex-1 pr-2">
                    <h5 class="font-semibold text-xs text-slate-800">${escapeHtml(item.name)}</h5>
                    <p class="text-[11px] text-slate-400 mt-0.5">${formatRupiah(item.sellPrice)} x ${item.qty}</p>
                </div>
                <div class="flex items-center space-x-2">
                    <div class="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                        <button onclick="updateCartQty('${escapeHtml(item.id)}', -1)" class="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center text-slate-600 hover:bg-white rounded-md transition"><i class="fa-solid fa-minus text-[9px] md:text-[10px]"></i></button>
                        <span class="w-5 md:w-6 text-center text-xs font-bold text-slate-700">${item.qty}</span>
                        <button onclick="updateCartQty('${escapeHtml(item.id)}', 1)" class="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center text-slate-600 hover:bg-white rounded-md transition"><i class="fa-solid fa-plus text-[9px] md:text-[10px]"></i></button>
                    </div>
                    <button onclick="removeFromCart('${escapeHtml(item.id)}')" class="text-slate-400 hover:text-rose-500 transition p-1"><i class="fa-solid fa-trash text-xs"></i></button>
                </div>
            </div>
        `;
    });

    const { subtotal, discountAmount, total } = calculateCartTotals();

    subtotalEl.innerText = formatRupiah(subtotal);
    discountDisplayEl.innerText = `- ${formatRupiah(discountAmount)}`;
    totalEl.innerText = formatRupiah(total);
    btnCheckout.disabled = false;
}

function openPaymentModal() {
    if (cart.length === 0) return;
    const { total } = calculateCartTotals();

    document.getElementById('modal-pay-total').innerText = formatRupiah(total);
    document.getElementById('pay-cash-input').value = total;
    selectPaymentMethod('cash');
    calculateChange();
    document.getElementById('payment-modal').classList.remove('hidden');
}

function closePaymentModal() {
    document.getElementById('payment-modal').classList.add('hidden');
}

function selectPaymentMethod(method) {
    paymentMethod = method;
    const cashBtn = document.getElementById('pm-cash-btn');
    const qrisBtn = document.getElementById('pm-qris-btn');
    const cashSec = document.getElementById('cash-payment-section');
    const qrisSec = document.getElementById('qris-payment-section');
    const confirmBtn = document.getElementById('btn-confirm-pay');

    if (method === 'cash') {
        cashBtn.className = "py-2.5 px-3 rounded-xl border-2 border-indigo-600 bg-indigo-50 text-indigo-700 text-xs md:text-sm font-semibold flex items-center justify-center space-x-2 transition";
        qrisBtn.className = "py-2.5 px-3 rounded-xl border-2 border-slate-200 bg-white text-slate-600 text-xs md:text-sm font-semibold flex items-center justify-center space-x-2 transition";
        cashSec.classList.remove('hidden');
        qrisSec.classList.add('hidden');
        calculateChange();
    } else {
        qrisBtn.className = "py-2.5 px-3 rounded-xl border-2 border-indigo-600 bg-indigo-50 text-indigo-700 text-xs md:text-sm font-semibold flex items-center justify-center space-x-2 transition";
        cashBtn.className = "py-2.5 px-3 rounded-xl border-2 border-slate-200 bg-white text-slate-600 text-xs md:text-sm font-semibold flex items-center justify-center space-x-2 transition";
        qrisSec.classList.remove('hidden');
        cashSec.classList.add('hidden');
        confirmBtn.disabled = false;
        document.getElementById('pay-change-display').innerText = formatRupiah(0);
    }
}

function setQuickCash(amount) {
    document.getElementById('pay-cash-input').value = amount;
    calculateChange();
}

function setExactCash() {
    const { total } = calculateCartTotals();
    document.getElementById('pay-cash-input').value = total;
    calculateChange();
}

function calculateChange() {
    if (paymentMethod !== 'cash') return;
    const { total } = calculateCartTotals();

    const cashGiven = parseFloat(document.getElementById('pay-cash-input').value) || 0;
    const change = cashGiven - total;

    const changeDisplay = document.getElementById('pay-change-display');
    const confirmBtn = document.getElementById('btn-confirm-pay');

    changeDisplay.innerText = formatRupiah(change >= 0 ? change : 0);
    if (change >= 0 && !isCheckingOut) {
        confirmBtn.disabled = false;
        changeDisplay.className = "text-sm md:text-base font-bold text-emerald-600";
    } else {
        confirmBtn.disabled = true;
        changeDisplay.className = "text-sm md:text-base font-bold text-rose-600";
    }
}

async function processCheckoutFinal() {
    if (isCheckingOut || cart.length === 0) return;

    const { subtotal, discountAmount, total } = calculateCartTotals();
    const cashGiven = paymentMethod === 'cash' ? (parseFloat(document.getElementById('pay-cash-input').value) || 0) : total;
    const change = cashGiven - total;

    if (paymentMethod === 'cash' && change < 0) {
        showToast('Uang tunai kurang!', true);
        return;
    }

    const customerNameInput = document.getElementById('pos-customer-name').value.trim();
    const customerName = customerNameInput !== '' ? customerNameInput : 'Umum';
    const trxId = generateUniqueTransactionId();
    const currentOperatorName = currentUser ? currentUser.name : settings.cashierName;

    const confirmBtn = document.getElementById('btn-confirm-pay');
    isCheckingOut = true;
    confirmBtn.disabled = true;
    confirmBtn.innerText = 'Menyimpan...';

    try {
        await mutateStoreDataAtomic((state) => {
            let totalModal = 0;
            let totalItemProfit = 0;

            const trxItems = cart.map(item => {
                const prod = state.products.find(p => p.id === item.id);
                if (!prod) {
                    throw new Error(`Produk "${item.name}" sudah dihapus dari katalog!`);
                }
                if (prod.stock < item.qty) {
                    throw new Error(`Stok "${prod.name}" tidak cukup (sisa: ${prod.stock})!`);
                }
                prod.stock -= item.qty;

                const itemModal = prod.buyPrice * item.qty;
                const itemOmzet = item.sellPrice * item.qty;
                totalModal += itemModal;
                totalItemProfit += (itemOmzet - itemModal);

                return {
                    ...item,
                    buyPrice: prod.buyPrice
                };
            });

            const totalProfit = totalItemProfit - discountAmount;

            const newTransaction = {
                id: trxId,
                status: 'COMPLETED',
                customerName: customerName,
                cashierName: currentOperatorName,
                timestamp: new Date().toISOString(),
                items: trxItems,
                subtotal: subtotal,
                discount: discountAmount,
                total: total,
                method: paymentMethod.toUpperCase(),
                cashGiven: cashGiven,
                change: change,
                totalModal: totalModal,
                totalProfit: totalProfit
            };

            state.transactions.push(newTransaction);
        });

        cart = [];
        document.getElementById('cart-discount-input').value = 0;
        document.getElementById('pos-customer-name').value = '';
        closePaymentModal();
        renderPOSCatalog();
        if (currentUser && currentUser.role === 'admin') {
            loadDashboardData();
        }

        showToast(`Transaksi ${trxId} berhasil diselesaikan!`);
        viewReceipt(trxId);
    } catch (err) {
        console.error(err);
        showToast(err.message || 'Gagal memproses transaksi!', true);
        syncCartWithProducts();
        renderPOSCatalog();
    } finally {
        isCheckingOut = false;
        confirmBtn.innerText = 'Selesaikan Transaksi';
        calculateChange();
    }
}

function viewReceipt(trxId) {
    const trx = transactions.find(t => t.id === trxId);
    if (!trx) return;

    currentTransactionToPrint = trx;

    document.getElementById('receipt-store-name').innerText = settings.storeName;
    document.getElementById('receipt-store-address').innerText = settings.storeAddress;
    document.getElementById('receipt-store-phone').innerText = `Telp: ${settings.storePhone}`;
    document.getElementById('receipt-id').innerText = trx.id;
    document.getElementById('receipt-customer').innerText = trx.customerName || 'Umum';
    document.getElementById('receipt-time').innerText = new Date(trx.timestamp).toLocaleString('id-ID');
    document.getElementById('receipt-cashier').innerText = trx.cashierName || currentUser?.name || 'Admin Utama';

    const voidBanner = document.getElementById('receipt-void-banner');
    if (trx.status === 'VOID') {
        voidBanner.classList.remove('hidden');
    } else {
        voidBanner.classList.add('hidden');
    }

    const receiptLogoDiv = document.getElementById('receipt-logo-print');
    if (settings.storeLogo && settings.storeLogo.trim() !== '') {
        receiptLogoDiv.innerHTML = `<img src="${escapeHtml(settings.storeLogo)}" alt="Logo" class="w-12 h-12 object-contain mx-auto rounded-md">`;
    } else {
        receiptLogoDiv.innerHTML = '';
    }

    const itemsContainer = document.getElementById('receipt-items-list');
    itemsContainer.innerHTML = '';
    trx.items.forEach(item => {
        itemsContainer.innerHTML += `
            <div class="flex justify-between">
                <div>
                    <p class="font-medium">${escapeHtml(item.name)}</p>
                    <p class="text-[10px] text-slate-500">${item.qty} x ${formatRupiah(item.sellPrice)}</p>
                </div>
                <span class="font-semibold">${formatRupiah(item.qty * item.sellPrice)}</span>
            </div>
        `;
    });

    document.getElementById('receipt-subtotal').innerText = formatRupiah(trx.subtotal || trx.total);
    document.getElementById('receipt-discount').innerText = formatRupiah(trx.discount || 0);
    document.getElementById('receipt-total').innerText = formatRupiah(trx.total);
    document.getElementById('receipt-method').innerText = trx.method;
    document.getElementById('receipt-cash-given').innerText = formatRupiah(trx.cashGiven);
    document.getElementById('receipt-cash-change').innerText = formatRupiah(trx.change);

    document.getElementById('receipt-modal').classList.remove('hidden');
}

function closeReceiptModal() {
    document.getElementById('receipt-modal').classList.add('hidden');
}
