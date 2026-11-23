function renderExpensesView() {
    const tbody = document.getElementById('expenses-table-body');
    const totalValidEl = document.getElementById('exp-total-valid');
    const accSelect = document.getElementById('exp-account-id');
    const catSelect = document.getElementById('exp-category');
    if (!tbody) return;

    if (accSelect) {
        accSelect.innerHTML = accounts.map(a => `<option value="${escapeHtml(a.id)}">${escapeHtml(a.name)} (${formatRupiah(a.balance)})</option>`).join('');
    }
    if (catSelect && catSelect.options.length === 0) {
        catSelect.innerHTML = EXPENSE_CATEGORIES.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    }

    let totalValidExpense = 0;
    expenses.forEach(e => {
        if (e.status !== 'VOID') totalValidExpense += (e.amount || 0);
    });
    if (totalValidEl) totalValidEl.innerText = formatRupiah(totalValidExpense);

    tbody.innerHTML = '';
    const revExpenses = [...expenses].reverse();

    if (revExpenses.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-slate-400">Belum ada catatan biaya operasional</td></tr>`;
        return;
    }

    revExpenses.forEach(exp => {
        const isVoid = exp.status === 'VOID';
        const acc = accounts.find(a => a.id === exp.accountId);
        tbody.innerHTML += `
            <tr class="hover:bg-slate-50 transition ${isVoid ? 'opacity-60 bg-rose-50/30' : ''}">
                <td class="p-3 font-mono text-xs font-semibold text-slate-700">${escapeHtml(exp.id)}</td>
                <td class="p-3 text-xs text-slate-500">${new Date(exp.date).toLocaleDateString('id-ID')}</td>
                <td class="p-3"><span class="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">${escapeHtml(exp.category)}</span></td>
                <td class="p-3 text-xs text-slate-700">${escapeHtml(exp.description)}</td>
                <td class="p-3 text-xs text-indigo-600 font-medium">${escapeHtml(acc ? acc.name : exp.accountName || '-')}</td>
                <td class="p-3 text-right font-bold ${isVoid ? 'line-through text-slate-400' : 'text-rose-600'}">${formatRupiah(exp.amount)}</td>
                <td class="p-3 text-center whitespace-nowrap space-x-1">
                    ${!isVoid
                        ? `<button type="button" onclick="voidExpense('${escapeHtml(exp.id)}')" title="Batalkan Biaya (VOID)" class="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold transition">VOID</button>`
                        : '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">VOID</span>'
                    }
                    <button type="button" onclick="deleteExpense('${escapeHtml(exp.id)}')" title="Hapus Riwayat Biaya" class="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold transition">Hapus</button>
                </td>
            </tr>
        `;
    });
}

async function submitExpense(event) {
    event.preventDefault();
    const category = document.getElementById('exp-category').value;
    const description = document.getElementById('exp-description').value.trim();
    const amount = parseFloat(document.getElementById('exp-amount').value) || 0;
    const accountId = document.getElementById('exp-account-id').value;

    if (!description || amount <= 0 || !accountId) {
        showToast('Lengkapi keterangan, nominal, dan akun sumber dana!', true);
        return;
    }

    try {
        await mutateStoreDataAtomic((state) => {
            const acc = state.accounts.find(a => a.id === accountId);
            if (!acc) throw new Error('Akun Kas/Bank tidak ditemukan!');
            if ((acc.balance || 0) < amount) {
                throw new Error(`Saldo ${acc.name} tidak mencukupi untuk pengeluaran ini!`);
            }

            acc.balance -= amount;

            state.expenses.push({
                id: `EXP-${Math.floor(10000 + Math.random() * 90000)}`,
                date: new Date().toISOString(),
                category,
                description,
                amount,
                accountId,
                accountName: acc.name,
                status: 'PAID',
                createdBy: currentUser ? currentUser.name : 'Admin'
            });
        });

        event.target.reset();
        renderExpensesView();
        if (typeof renderCashBankView === 'function') renderCashBankView();
        showToast('Biaya operasional berhasil dicatat!');
    } catch (err) {
        showToast(err.message || 'Gagal mencatat biaya!', true);
    }
}

async function voidExpense(expenseId) {
    const target = expenses.find(e => e.id === expenseId);
    if (!target || target.status === 'VOID') return;

    const reason = prompt(`Alasan pembatalan (VOID) biaya ${expenseId}:`, 'Salah input nominal');
    if (reason === null) return;

    try {
        await mutateStoreDataAtomic((state) => {
            const exp = state.expenses.find(e => e.id === expenseId);
            if (!exp || exp.status === 'VOID') throw new Error('Biaya tidak ditemukan atau sudah VOID.');

            const acc = state.accounts.find(a => a.id === exp.accountId);
            if (acc) {
                acc.balance = (acc.balance || 0) + exp.amount;
            }

            exp.status = 'VOID';
            exp.voidReason = reason.trim() || 'Dibatalkan Admin';
            exp.voidedAt = new Date().toISOString();
        });

        renderExpensesView();
        if (typeof renderCashBankView === 'function') renderCashBankView();
        showToast(`Biaya ${expenseId} berhasil di-VOID dan saldo akun dikembalikan.`);
    } catch (err) {
        showToast(err.message || 'Gagal melakukan VOID biaya!', true);
    }
}

async function deleteExpense(expenseId) {
    const target = (Array.isArray(expenses) ? expenses : []).find(e => e && e.id === expenseId);
    if (!target) return;

    const isPaid = target.status !== 'VOID';
    const warnExtra = isPaid
        ? '\nCatatan: Karena biaya ini masih berstatus VALID/PAID, saldo akun sumber dana akan dikembalikan.'
        : '';

    if (!confirm(`Hapus permanen riwayat biaya ${expenseId} ("${target.description || '-'}")?${warnExtra}`)) return;

    try {
        await mutateStoreDataAtomic((state) => {
            const idx = state.expenses.findIndex(e => e && e.id === expenseId);
            if (idx === -1) throw new Error('Biaya tidak ditemukan.');

            const exp = state.expenses[idx];
            if (exp.status !== 'VOID') {
                const acc = state.accounts.find(a => a && a.id === exp.accountId);
                if (acc) {
                    acc.balance = (Number(acc.balance) || 0) + (Number(exp.amount) || 0);
                }
            }

            state.expenses.splice(idx, 1);
        });

        renderExpensesView();
        if (typeof renderCashBankView === 'function') renderCashBankView();
        if (typeof renderReportsView === 'function') renderReportsView();
        showToast(`Riwayat biaya ${expenseId} berhasil dihapus.`);
    } catch (err) {
        showToast(err.message || 'Gagal menghapus biaya operasional!', true);
    }
}
