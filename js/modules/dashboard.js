function parseTrxDate(rawTs) {
    if (!rawTs) return null;
    if (rawTs instanceof Date) return Number.isNaN(rawTs.getTime()) ? null : rawTs;
    if (typeof rawTs === 'object' && typeof rawTs.seconds === 'number') {
        const d = new Date(rawTs.seconds * 1000);
        return Number.isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(rawTs);
    return Number.isNaN(d.getTime()) ? null : d;
}

function renderDashboard() {
    const today = new Date();
    const trxList = Array.isArray(transactions) ? transactions : [];
    const prodList = Array.isArray(products) ? products : [];

    const validTrx = trxList.filter(t => t && t.status !== 'VOID');
    const todayValidTrx = validTrx.filter(t => {
        const dt = parseTrxDate(t.timestamp);
        return dt && isSameDay(dt, today);
    });

    const todaySales = todayValidTrx.reduce((sum, t) => sum + (Number(t.total) || 0), 0);
    const lowStockCount = prodList.filter(p => p && (Number(p.stock) || 0) <= 5).length;

    const elSales = document.getElementById('dash-today-sales');
    const elTrx = document.getElementById('dash-today-trx');
    const elProds = document.getElementById('dash-total-products');
    const elLow = document.getElementById('dash-lowstock-count');
    const tbody = document.getElementById('dash-recent-trx-list');

    if (elSales) elSales.innerText = formatRupiah(todaySales);
    if (elTrx) elTrx.innerText = String(todayValidTrx.length);
    if (elProds) elProds.innerText = String(prodList.length);
    if (elLow) elLow.innerText = String(lowStockCount);

    if (!tbody) return;
    tbody.innerHTML = '';

    const recent = [...trxList].reverse().slice(0, 10);
    if (recent.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-slate-400">Belum ada transaksi tercatat</td></tr>`;
        return;
    }

    recent.forEach(trx => {
        const isVoid = trx.status === 'VOID';
        const dt = parseTrxDate(trx.timestamp);
        const timeText = dt ? dt.toLocaleString('id-ID') : '-';

        tbody.innerHTML += `
            <tr class="hover:bg-slate-50 transition ${isVoid ? 'opacity-60 bg-rose-50/30' : ''}">
                <td class="p-2.5 md:p-3 font-mono text-xs font-semibold text-slate-700">${escapeHtml(trx.id)}</td>
                <td class="p-2.5 md:p-3 text-xs text-slate-700">${escapeHtml(trx.customerName || 'Umum')}</td>
                <td class="p-2.5 md:p-3 text-xs text-slate-500">${escapeHtml(trx.cashier || '-')}</td>
                <td class="p-2.5 md:p-3 text-xs text-slate-500">${escapeHtml(timeText)}</td>
                <td class="p-2.5 md:p-3 text-center">
                    ${isVoid
                        ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">VOID</span>'
                        : '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">VALID</span>'
                    }
                </td>
                <td class="p-2.5 md:p-3 text-right font-bold ${isVoid ? 'line-through text-slate-400' : 'text-indigo-600'}">${formatRupiah(trx.total)}</td>
                <td class="p-2.5 md:p-3 text-center">
                    <button type="button" onclick="openReceiptById('${escapeHtml(trx.id)}')" class="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition">
                        Struk
                    </button>
                </td>
            </tr>
        `;
    });
}
