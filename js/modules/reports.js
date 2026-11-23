function getItemUnitCost(item) {
    if (!item || typeof item !== 'object') return 0;

    const directCost = Number(
        item.buyPrice ?? item.costPrice ?? item.hpp ?? item.modal ?? 0
    );
    if (directCost > 0) return directCost;

    if (item.id && Array.isArray(products)) {
        const matchedProd = products.find(p => p && p.id === item.id);
        if (matchedProd) {
            return Number(
                matchedProd.buyPrice ?? matchedProd.costPrice ?? matchedProd.hpp ?? matchedProd.modal ?? 0
            ) || 0;
        }
    }

    return 0;
}

function computeTransactionProfit(trx) {
    if (!trx || trx.status === 'VOID') return 0;

    const items = Array.isArray(trx.items) ? trx.items : [];
    const totalCost = items.reduce((sum, it) => {
        const qty = Number(it && it.qty) || 0;
        return sum + (getItemUnitCost(it) * qty);
    }, 0);

    const netSales = Number(trx.total) || 0;
    return netSales - totalCost;
}

function renderReportsView() {
    const prodList = Array.isArray(products) ? products : [];
    const trxList = Array.isArray(transactions) ? transactions : [];

    const totalModal = prodList.reduce((sum, p) => {
        const unitModal = Number(p.buyPrice ?? p.costPrice ?? p.hpp ?? p.modal ?? 0) || 0;
        return sum + (unitModal * (Number(p.stock) || 0));
    }, 0);
    const totalPotential = prodList.reduce((sum, p) => sum + ((Number(p.sellPrice) || 0) * (Number(p.stock) || 0)), 0);

    const validTrx = trxList.filter(t => t && t.status !== 'VOID');
    const totalOmzet = validTrx.reduce((sum, t) => sum + (Number(t.total) || 0), 0);
    const totalProfit = validTrx.reduce((sum, t) => sum + computeTransactionProfit(t), 0);

    const setTxt = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = formatRupiah(val);
    };

    setTxt('rep-total-modal', totalModal);
    setTxt('rep-total-potential', totalPotential);
    setTxt('rep-total-omzet', totalOmzet);
    setTxt('rep-total-profit', totalProfit);

    const revTrx = [...trxList].reverse();
    const totalPages = Math.max(1, Math.ceil(revTrx.length / itemsPerPage));
    if (currentReportPage > totalPages) currentReportPage = totalPages;

    const start = (currentReportPage - 1) * itemsPerPage;
    const paged = revTrx.slice(start, start + itemsPerPage);

    const tbody = document.getElementById('report-transaction-table');
    if (!tbody) return;

    if (paged.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-slate-400">Belum ada riwayat transaksi</td></tr>`;
    } else {
        tbody.innerHTML = paged.map(trx => {
            const isVoid = trx.status === 'VOID';
            const trxProfit = computeTransactionProfit(trx);
            return `
                <tr class="hover:bg-slate-50 transition ${isVoid ? 'opacity-60 bg-rose-50/30' : ''}">
                    <td class="p-2.5 md:p-3 font-mono text-xs font-semibold text-slate-700">${escapeHtml(trx.id)}</td>
                    <td class="p-2.5 md:p-3 text-xs text-slate-700">${escapeHtml(trx.customerName || 'Umum')}</td>
                    <td class="p-2.5 md:p-3 text-xs text-slate-500">${escapeHtml(trx.cashier || '-')}</td>
                    <td class="p-2.5 md:p-3 text-xs text-slate-500">${new Date(trx.timestamp).toLocaleString('id-ID')}</td>
                    <td class="p-2.5 md:p-3 text-center">
                        ${isVoid
                            ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">VOID</span>'
                            : '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">VALID</span>'
                        }
                    </td>
                    <td class="p-2.5 md:p-3 text-right font-bold ${isVoid ? 'line-through text-slate-400' : 'text-indigo-600'}">${formatRupiah(trx.total)}</td>
                    <td class="p-2.5 md:p-3 text-right font-bold ${isVoid ? 'line-through text-slate-400' : 'text-emerald-600'}">${formatRupiah(trxProfit)}</td>
                    <td class="p-2.5 md:p-3 text-center whitespace-nowrap space-x-1">
                        <button type="button" onclick="openReceiptById('${escapeHtml(trx.id)}')" class="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold">Struk</button>
                        ${!isVoid
                            ? `<button type="button" onclick="voidTransaction('${escapeHtml(trx.id)}')" class="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold">VOID</button>`
                            : ''
                        }
                        <button type="button" onclick="deleteTransaction('${escapeHtml(trx.id)}')" class="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold">Hapus</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    renderPagination('report-pagination', currentReportPage, totalPages, (page) => {
        currentReportPage = page;
        renderReportsView();
    });
}

async function voidTransaction(trxId) {
    const target = transactions.find(t => t.id === trxId);
    if (!target || target.status === 'VOID') return;

    const reason = prompt(`Alasan VOID transaksi ${trxId}:`, 'Salah input pesanan');
    if (reason === null) return;

    try {
        await mutateStoreDataAtomic((state) => {
            const trx = state.transactions.find(t => t.id === trxId);
            if (!trx || trx.status === 'VOID') throw new Error('Transaksi tidak ditemukan atau sudah VOID.');

            for (const item of (trx.items || [])) {
                const prod = state.products.find(p => p.id === item.id);
                if (prod) {
                    prod.stock = (Number(prod.stock) || 0) + (Number(item.qty) || 0);
                }
            }

            const acc = trx.paymentMethod === 'transfer'
                ? state.accounts.find(a => a && (a.id === 'ACC-BANK' || a.type === 'bank'))
                : trx.paymentMethod === 'qris'
                    ? state.accounts.find(a => a && a.id === 'ACC-QRIS')
                    : state.accounts.find(a => a && a.id === 'ACC-CASH');
            if (acc) {
                acc.balance = Math.max(0, (Number(acc.balance) || 0) - (Number(trx.total) || 0));
            }

            trx.status = 'VOID';
            trx.voidReason = reason.trim() || 'Dibatalkan Admin';
            trx.voidedAt = new Date().toISOString();
        });

        renderReportsView();
        if (typeof renderDashboard === 'function') renderDashboard();
        if (typeof renderProductTable === 'function') renderProductTable();
        if (typeof filterPOSProducts === 'function') filterPOSProducts();
        if (typeof renderCashBankView === 'function') renderCashBankView();
        showToast(`Transaksi ${trxId} di-VOID, stok & saldo dikembalikan.`);
    } catch (err) {
        showToast(err.message || 'Gagal melakukan VOID transaksi!', true);
    }
}

async function deleteTransaction(trxId) {
    const target = transactions.find(t => t && t.id === trxId);
    if (!target) return;

    const statusLabel = target.status === 'VOID' ? 'VOID' : 'VALID';
    const warnExtra = target.status !== 'VOID'
        ? '\nCatatan: Karena statusnya masih VALID, stok produk dan saldo akun terkait akan dikembalikan.'
        : '';

    if (!confirm(`Hapus permanen riwayat transaksi ${trxId} (${statusLabel})?${warnExtra}`)) return;

    try {
        await mutateStoreDataAtomic((state) => {
            const idx = state.transactions.findIndex(t => t && t.id === trxId);
            if (idx === -1) throw new Error('Transaksi tidak ditemukan.');

            const trx = state.transactions[idx];
            if (trx.status !== 'VOID') {
                for (const item of (trx.items || [])) {
                    const prod = state.products.find(p => p && p.id === item.id);
                    if (prod) {
                        prod.stock = (Number(prod.stock) || 0) + (Number(item.qty) || 0);
                    }
                }

                const acc = trx.paymentMethod === 'transfer'
                    ? state.accounts.find(a => a && (a.id === 'ACC-BANK' || a.type === 'bank'))
                    : trx.paymentMethod === 'qris'
                        ? state.accounts.find(a => a && a.id === 'ACC-QRIS')
                        : state.accounts.find(a => a && a.id === 'ACC-CASH');
                if (acc) {
                    acc.balance = Math.max(0, (Number(acc.balance) || 0) - (Number(trx.total) || 0));
                }
            }

            state.transactions.splice(idx, 1);
        });

        renderReportsView();
        if (typeof renderDashboard === 'function') renderDashboard();
        if (typeof renderProductTable === 'function') renderProductTable();
        if (typeof filterPOSProducts === 'function') filterPOSProducts();
        if (typeof renderCashBankView === 'function') renderCashBankView();
        showToast(`Riwayat transaksi ${trxId} berhasil dihapus.`);
    } catch (err) {
        showToast(err.message || 'Gagal menghapus transaksi!', true);
    }
}

function exportReportsCSV() {
    const headers = ['ID Transaksi', 'Waktu', 'Pelanggan', 'Operator', 'Status', 'Metode', 'Subtotal', 'Diskon', 'Omzet', 'Laba Bersih'];
    const rows = transactions.map(t => [
        t.id,
        new Date(t.timestamp).toLocaleString('id-ID'),
        t.customerName || 'Umum',
        t.cashier || '-',
        t.status || 'VALID',
        t.paymentMethod || 'cash',
        t.subtotal || 0,
        t.discount || 0,
        t.total || 0,
        computeTransactionProfit(t)
    ]);

    const csvContent = [headers, ...rows]
        .map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `laporan-pos-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Laporan CSV berhasil diunduh.');
}
