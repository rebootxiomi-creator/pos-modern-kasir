function renderCashBankView() {
    const grid = document.getElementById('cash-accounts-grid');
    const transferBody = document.getElementById('cash-transfer-table');
    const totalLiquidityEl = document.getElementById('cash-total-balance');
    if (!grid) return;

    const accList = Array.isArray(accounts) ? accounts : [];
    let totalBalance = 0;
    grid.innerHTML = '';

    accList.forEach(acc => {
        totalBalance += (Number(acc.balance) || 0);
        const badgeColor = acc.type === 'bank'
            ? 'bg-blue-50 text-blue-600 border-blue-200'
            : acc.type === 'ewallet'
                ? 'bg-purple-50 text-purple-600 border-purple-200'
                : 'bg-emerald-50 text-emerald-600 border-emerald-200';
        const icon = acc.type === 'bank'
            ? 'fa-building-columns'
            : acc.type === 'ewallet'
                ? 'fa-qrcode'
                : 'fa-wallet';
        const isSystemAcc = ['ACC-CASH', 'ACC-BANK', 'ACC-QRIS'].includes(acc.id);

        grid.innerHTML += `
            <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div class="flex items-start justify-between gap-2">
                    <div>
                        <span class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${badgeColor}">${escapeHtml(acc.type)}</span>
                        <h4 class="font-bold text-slate-800 text-sm mt-2">${escapeHtml(acc.name)}</h4>
                        <p class="text-[11px] text-slate-400 font-mono">${escapeHtml(acc.accountNumber || '-')}</p>
                    </div>
                    <div class="flex items-center space-x-1 shrink-0">
                        <button type="button" onclick="editAccount('${escapeHtml(acc.id)}')" class="px-2 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 text-xs font-semibold transition" title="Edit Akun">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        ${!isSystemAcc
                            ? `<button type="button" onclick="deleteAccount('${escapeHtml(acc.id)}')" class="px-2 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-semibold transition" title="Hapus Akun">
                                <i class="fa-solid fa-trash"></i>
                            </button>`
                            : ''
                        }
                        <div class="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                            <i class="fa-solid ${icon} text-xs"></i>
                        </div>
                    </div>
                </div>
                <div class="mt-4 pt-3 border-t border-slate-100">
                    <p class="text-[10px] text-slate-400 uppercase font-semibold">Saldo Saat Ini</p>
                    <p class="text-lg font-bold text-slate-900">${formatRupiah(acc.balance || 0)}</p>
                </div>
            </div>
        `;
    });

    if (totalLiquidityEl) totalLiquidityEl.innerText = formatRupiah(totalBalance);

    const fromSelect = document.getElementById('tf-from-account');
    const toSelect = document.getElementById('tf-to-account');
    if (fromSelect && toSelect) {
        const optionsHtml = accList.map(a => `<option value="${escapeHtml(a.id)}">${escapeHtml(a.name)} (${formatRupiah(a.balance)})</option>`).join('');
        fromSelect.innerHTML = optionsHtml;
        toSelect.innerHTML = optionsHtml;
        if (accList.length > 1) toSelect.selectedIndex = 1;
    }

    if (transferBody) {
        transferBody.innerHTML = '';
        const revTransfers = [...(Array.isArray(cashTransfers) ? cashTransfers : [])].reverse();
        if (revTransfers.length === 0) {
            transferBody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-slate-400">Belum ada riwayat transfer antar-akun</td></tr>`;
        } else {
            revTransfers.forEach(tf => {
                transferBody.innerHTML += `
                    <tr class="hover:bg-slate-50 transition">
                        <td class="p-3 font-mono text-xs font-semibold text-slate-700">${escapeHtml(tf.id)}</td>
                        <td class="p-3 text-xs text-slate-500">${new Date(tf.timestamp).toLocaleString('id-ID')}</td>
                        <td class="p-3 text-xs font-medium text-slate-700">${escapeHtml(tf.fromName)} → ${escapeHtml(tf.toName)}</td>
                        <td class="p-3 text-xs text-slate-500">${escapeHtml(tf.note || '-')}</td>
                        <td class="p-3 text-right font-bold text-indigo-600">${formatRupiah(tf.amount)}</td>
                    </tr>
                `;
            });
        }
    }
}

async function editAccount(accountId) {
    const acc = accounts.find(a => a && a.id === accountId);
    if (!acc) return;

    const nextName = prompt('Nama Akun:', acc.name);
    if (nextName === null) return;
    const cleanName = nextName.trim();
    if (!cleanName) {
        showToast('Nama akun tidak boleh kosong!', true);
        return;
    }

    const nextNumber = prompt('No. Rekening / Info:', acc.accountNumber || '-');
    if (nextNumber === null) return;

    const nextBalanceRaw = prompt('Saldo Akun (Rp):', String(Number(acc.balance) || 0));
    if (nextBalanceRaw === null) return;
    const nextBalance = parseFloat(nextBalanceRaw);
    if (Number.isNaN(nextBalance) || nextBalance < 0) {
        showToast('Saldo harus berupa angka valid (>= 0)!', true);
        return;
    }

    try {
        await mutateStoreDataAtomic((state) => {
            const target = state.accounts.find(a => a && a.id === accountId);
            if (!target) throw new Error('Akun tidak ditemukan.');
            target.name = cleanName;
            target.accountNumber = nextNumber.trim() || '-';
            target.balance = nextBalance;
        });
        renderCashBankView();
        showToast('Akun kas/bank berhasil diperbarui!');
    } catch (err) {
        showToast(err.message || 'Gagal mengedit akun!', true);
    }
}

async function deleteAccount(accountId) {
    const acc = accounts.find(a => a && a.id === accountId);
    if (!acc) return;
    if (['ACC-CASH', 'ACC-BANK', 'ACC-QRIS'].includes(accountId)) {
        showToast('Akun utama sistem tidak dapat dihapus.', true);
        return;
    }
    if (!confirm(`Hapus akun "${acc.name}"?`)) return;

    try {
        await mutateStoreDataAtomic((state) => {
            state.accounts = state.accounts.filter(a => a && a.id !== accountId);
        });
        renderCashBankView();
        showToast(`Akun "${acc.name}" berhasil dihapus.`);
    } catch (err) {
        showToast(err.message || 'Gagal menghapus akun!', true);
    }
}

async function addNewAccount(event) {
    event.preventDefault();
    const name = document.getElementById('acc-name').value.trim();
    const type = document.getElementById('acc-type').value;
    const accountNumber = document.getElementById('acc-number').value.trim();
    const initialBalance = parseFloat(document.getElementById('acc-initial-balance').value) || 0;

    if (!name) return;

    try {
        await mutateStoreDataAtomic((state) => {
            state.accounts.push({
                id: `ACC-${Date.now().toString().slice(-5)}`,
                name,
                type,
                accountNumber: accountNumber || '-',
                balance: initialBalance
            });
        });
        event.target.reset();
        renderCashBankView();
        showToast(`Akun "${name}" berhasil ditambahkan!`);
    } catch (err) {
        showToast(err.message || 'Gagal menambah akun!', true);
    }
}

async function submitAccountTransfer(event) {
    event.preventDefault();
    const fromId = document.getElementById('tf-from-account').value;
    const toId = document.getElementById('tf-to-account').value;
    const amount = parseFloat(document.getElementById('tf-amount').value) || 0;
    const note = document.getElementById('tf-note').value.trim();

    if (fromId === toId) {
        showToast('Akun asal dan tujuan tidak boleh sama!', true);
        return;
    }
    if (amount <= 0) {
        showToast('Nominal transfer harus lebih dari 0!', true);
        return;
    }

    try {
        await mutateStoreDataAtomic((state) => {
            const fromAcc = state.accounts.find(a => a.id === fromId);
            const toAcc = state.accounts.find(a => a.id === toId);
            if (!fromAcc || !toAcc) throw new Error('Akun tidak ditemukan!');
            if ((fromAcc.balance || 0) < amount) {
                throw new Error(`Saldo ${fromAcc.name} tidak mencukupi!`);
            }

            fromAcc.balance -= amount;
            toAcc.balance = (toAcc.balance || 0) + amount;

            state.cashTransfers.push({
                id: `TRF-${Math.floor(10000 + Math.random() * 90000)}`,
                fromId,
                fromName: fromAcc.name,
                toId,
                toName: toAcc.name,
                amount,
                note,
                timestamp: new Date().toISOString(),
                operator: currentUser ? currentUser.name : 'Admin'
            });
        });

        event.target.reset();
        renderCashBankView();
        showToast('Transfer antar-akun berhasil dicatat!');
    } catch (err) {
        showToast(err.message || 'Gagal melakukan transfer!', true);
    }
}
