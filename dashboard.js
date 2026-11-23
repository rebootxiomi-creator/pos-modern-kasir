function loadDashboardData() {
    const todayStr = new Date().toLocaleDateString('id-ID');
    let todaySales = 0;
    let todayTrxCount = 0;

    transactions.forEach(trx => {
        if (trx.status === 'VOID') return; // Exclude voided transactions
        const trxDate = new Date(trx.timestamp).toLocaleDateString('id-ID');
        if (trxDate === todayStr) {
            todaySales += trx.total;
            todayTrxCount++;
        }
    });

    const lowStockCount = products.filter(p => p.stock <= 5).length;

    document.getElementById('dash-today-sales').innerText = formatRupiah(todaySales);
    document.getElementById('dash-today-trx').innerText = todayTrxCount;
    document.getElementById('dash-total-products').innerText = products.length;
    document.getElementById('dash-lowstock-count').innerText = lowStockCount;

    const recentBody = document.getElementById('dash-recent-trx-list');
    recentBody.innerHTML = '';
    const recentTrx = [...transactions].reverse().slice(0, 5);

    if (recentTrx.length === 0) {
        recentBody.innerHTML = `<tr><td colspan="7" class="text-center py-6 text-slate-400">Belum ada transaksi tercatat</td></tr>`;
    } else {
        recentTrx.forEach(trx => {
            const isVoid = trx.status === 'VOID';
            recentBody.innerHTML += `
                <tr class="hover:bg-slate-50 transition ${isVoid ? 'opacity-60 bg-rose-50/30' : ''}">
                    <td class="p-2.5 md:p-3 font-semibold text-slate-700">${escapeHtml(trx.id)}</td>
                    <td class="p-2.5 md:p-3 text-slate-600">${escapeHtml(trx.customerName || 'Umum')}</td>
                    <td class="p-2.5 md:p-3 text-indigo-600 font-medium text-xs">${escapeHtml(trx.cashierName || 'Admin Utama')}</td>
                    <td class="p-2.5 md:p-3 text-xs text-slate-500">${new Date(trx.timestamp).toLocaleTimeString('id-ID')}</td>
                    <td class="p-2.5 md:p-3 text-center">
                        ${isVoid
                            ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">VOID</span>'
                            : '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">VALID</span>'
                        }
                    </td>
                    <td class="p-2.5 md:p-3 text-right font-bold ${isVoid ? 'line-through text-slate-400' : 'text-slate-800'}">${formatRupiah(trx.total)}</td>
                    <td class="p-2.5 md:p-3 text-center">
                        <button onclick="viewReceipt('${escapeHtml(trx.id)}')" class="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition"><i class="fa-solid fa-receipt text-xs"></i></button>
                    </td>
                </tr>
            `;
        });
    }
}
