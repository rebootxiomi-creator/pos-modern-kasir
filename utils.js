// XSS-safe HTML escaping helper
function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatRupiah(num) {
    const safeNum = Number.isFinite(num) ? num : 0;
    const formatted = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(safeNum);
    return `Rp ${formatted}`;
}

function generateUniqueProductId() {
    let newId;
    let isDuplicate = true;
    let safetyLimit = 0;

    while (isDuplicate && safetyLimit < 100000) {
        newId = Math.floor(10000 + Math.random() * 90000).toString();
        isDuplicate = products.some(p => p.id === newId);
        safetyLimit++;
    }

    if (isDuplicate) {
        newId = Date.now().toString().slice(-5);
    }
    return newId;
}

function generateUniqueTransactionId() {
    let trxId;
    let isDuplicate = true;
    let counter = 0;

    while (isDuplicate && counter < 100000) {
        const randomCode = Math.floor(10000 + Math.random() * 90000).toString();
        trxId = `TRX-${randomCode}`;
        isDuplicate = transactions.some(t => t.id === trxId);
        counter++;
    }

    if (isDuplicate) {
        trxId = `TRX-${Date.now().toString().slice(-5)}`;
    }
    return trxId;
}
