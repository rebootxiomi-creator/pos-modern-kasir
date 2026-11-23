function renderReportsView() {
    let totalModalInv = 0;
    let totalPotentialVal = 0;
    let totalOmzet = 0;
    let totalNetProfit = 0;

    products.forEach(p => {
        totalModalInv += (p.buyPrice * p.stock);
        totalPotentialVal += (p.sellPrice * p.stock);
    });

    transactions.forEach(t => {
        if (t.status === 'VOID') return; // Exclude voided transactions from financial totals
        totalOmzet += t.total;
        totalNetProfit += (t.totalProfit || 0);
    });

    document.getElementById('rep-total-modal').innerText = formatRupiah(totalModalInv);
    document.getElementById('rep-total-potential').innerText = formatRupiah(totalPotentialVal);
    document.getElementById('rep-total-omzet').innerText = formatRupiah(totalOmzet);
    document.getElementById('rep-total-profit').innerText = formatRupiah(totalNetProfit);

    const tableBody = document.getElementById('report-transaction-table');
    tableBody.innerHTML = '';
    const revTrx = [...transactions].reverse();
    const paginationEl = document.getElementById('report-pagination');

    if (revTrx.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-slate-400">Belum ada riwayat transaksi penjualan</td></tr>`;
        if (paginationEl) paginationEl.innerHTML = '';
        return;
    }

    const totalPages = Math.ceil(revTrx.length / itemsPerPage);
    if (currentReportPage > totalPages) currentReportPage = totalPages || 1;
    const start = (currentReportPage - 1) * itemsPerPage;
    const paginatedTrx = revTrx.slice(start, start + itemsPerPage);

    paginatedTrx.forEach(t => {
        const isVoid = t.status === 'VOID';
        tableBody.innerHTML += `
            <tr class="hover:bg-slate-50 transition ${isVoid ? 'opacity-65 bg-rose-50/30' : ''}">
                <td class="p-2.5 md:p-3 font-semibold text-slate-800">${escapeHtml(t.id)}</td>
                <td class="p-2.5 md:p-3 text-slate-700">${escapeHtml(t.customerName || 'Umum')}</td>
                <td class="p-2.5 md:p-3 text-indigo-600 font-medium">${escapeHtml(t.cashierName || 'Admin Utama')}</td>
                <td class="p-2.5 md:p-3 text-xs text-slate-500">${new Date(t.timestamp).toLocaleString('id-ID')}</td>
                <td class="p-2.5 md:p-3 text-center">
                    ${isVoid
                        ? `<span title="${escapeHtml(t.voidReason || 'Dibatalkan')}" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">VOID</span>`
                        : '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">VALID</span>'
                    }
                </td>
                <td class="p-2.5 md:p-3 text-right font-semibold ${isVoid ? 'line-through text-slate-400' : 'text-indigo-600'}">${formatRupiah(t.total)}</td>
                <td class="p-2.5 md:p-3 text-right font-bold ${isVoid ? 'line-through text-slate-400' : 'text-emerald-600'}">+${formatRupiah(t.totalProfit || 0)}</td>
                <td class="p-2.5 md:p-3 text-center space-x-1">
                    <button onclick="viewReceipt('${escapeHtml(t.id)}')" title="Lihat Struk" class="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition"><i class="fa-solid fa-receipt text-xs"></i></button>
                    ${!isVoid
                        ? `<button onclick="voidTransaction('${escapeHtml(t.id)}')" title="Batalkan / Void Transaksi (Jejak Audit Terjaga)" class="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition"><i class="fa-solid fa-ban text-xs"></i></button>`
                        : ''
                    }
                </td>
            </tr>
        `;
    });

    renderReportPagination(totalPages);
}

function renderReportPagination(totalPages) {
    const paginationEl = document.getElementById('report-pagination');
    if (!paginationEl) return;
    if (totalPages <= 1) { paginationEl.innerHTML = ''; return; }
    paginationEl.innerHTML = `
        <span class="text-xs text-slate-500 font-medium">Hal ${currentReportPage} dari ${totalPages}</span>
        <div class="flex space-x-1">
            <button type="button" onclick="changeReportPage(-1)" ${currentReportPage === 1 ? 'disabled' : ''} class="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-lg text-xs font-semibold transition">Prev</button>
            <button type="button" onclick="changeReportPage(1)" ${currentReportPage === totalPages ? 'disabled' : ''} class="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition">Next</button>
        </div>
    `;
}

function changeReportPage(dir) {
    currentReportPage += dir;
    renderReportsView();
}

// Audit-safe VOID transaction (preserves transaction record for audit trail & restores stock atomically)
async function voidTransaction(trxId) {
    const target = transactions.find(t => t.id === trxId);
    if (!target || target.status === 'VOID') return;

    const reason = prompt(`Masukkan alasan pembatalan (VOID) untuk transaksi ${trxId}:`, 'Salah input kasir');
    if (reason === null) return;

    try {
        await mutateStoreDataAtomic((state) => {
            const trx = state.transactions.find(t => t.id === trxId);
            if (!trx || trx.status === 'VOID') {
                throw new Error('Transaksi sudah berstatus VOID atau tidak ditemukan.');
            }
            trx.items.forEach(item => {
                const prod = state.products.find(p => p.id === item.id);
                if (prod) {
                    prod.stock += item.qty;
                }
            });
            trx.status = 'VOID';
            trx.voidReason = reason.trim() || 'Dibatalkan Admin';
            trx.voidedAt = new Date().toISOString();
            trx.voidedBy = currentUser ? currentUser.name : 'Admin';
        });

        renderReportsView();
        if (currentUser && currentUser.role === 'admin') loadDashboardData();
        showToast(`Transaksi ${trxId} berhasil di-VOID & stok dikembalikan.`);
    } catch (err) {
        showToast(err.message || 'Gagal melakukan VOID transaksi!', true);
    }
}

// Export CSV with UTF-8 BOM + proper CSV quoting
function exportReportsCSV() {
    if (transactions.length === 0) {
        showToast('Tidak ada data transaksi untuk diexport', true);
        return;
    }

    const escapeCsvCell = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const headers = ['ID Transaksi', 'Status', 'Pelanggan', 'Operator', 'Waktu', 'Metode', 'Total Omzet', 'Modal HPP', 'Laba Bersih'];
    const rows = transactions.map(t => [
        t.id,
        t.status || 'VALID',
        t.customerName || 'Umum',
        t.cashierName || 'Admin Utama',
        t.timestamp,
        t.method,
        t.total,
        t.totalModal,
        t.totalProfit
    ].map(escapeCsvCell).join(','));

    const csvString = '\uFEFF' + [headers.map(escapeCsvCell).join(','), ...rows].join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `laporan_pos_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Laporan berhasil diexport ke CSV');
}
