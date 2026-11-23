function applySettingsToUI() {
    document.getElementById('header-store-name').innerText = settings.storeName;
    document.getElementById('header-cashier-name').innerText = `${currentUser ? currentUser.name : settings.cashierName}`;
    
    document.getElementById('set-store-name').value = settings.storeName;
    document.getElementById('set-store-address').value = settings.storeAddress;
    document.getElementById('set-store-phone').value = settings.storePhone;
    document.getElementById('set-cashier-name').value = settings.cashierName;
    document.getElementById('set-store-logo').value = settings.storeLogo || '';
    document.getElementById('set-product-prefix').value = settings.productPrefix || 'PRD-';

    const previewContainer = document.getElementById('logo-preview-container');
    const previewImg = document.getElementById('logo-preview-img');
    if (settings.storeLogo && settings.storeLogo.trim() !== '') {
        previewImg.src = settings.storeLogo;
        previewContainer.classList.remove('hidden');
    } else {
        previewContainer.classList.add('hidden');
    }

    const logoContainer = document.getElementById('header-logo-container');
    if (settings.storeLogo && settings.storeLogo.trim() !== '') {
        logoContainer.innerHTML = `<img src="${escapeHtml(settings.storeLogo)}" alt="Logo" class="w-full h-full object-cover rounded-md">`;
    } else {
        logoContainer.innerHTML = `<i class="fa-solid fa-cash-register text-sm md:text-xl text-indigo-100" id="header-logo-icon"></i>`;
    }
}

// Compress logo to max 160x160 JPEG so Firestore 1MB doc limit is never exceeded
function handleLogoFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const maxDim = 160;
            let w = img.width;
            let h = img.height;
            if (w > maxDim || h > maxDim) {
                if (w > h) {
                    h = Math.round((h * maxDim) / w);
                    w = maxDim;
                } else {
                    w = Math.round((w * maxDim) / h);
                    h = maxDim;
                }
            }
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);

            document.getElementById('set-store-logo').value = compressedDataUrl;
            const previewContainer = document.getElementById('logo-preview-container');
            const previewImg = document.getElementById('logo-preview-img');
            previewImg.src = compressedDataUrl;
            previewContainer.classList.remove('hidden');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function clearStoreLogo() {
    document.getElementById('set-store-logo').value = '';
    document.getElementById('set-store-logo-file').value = '';
    document.getElementById('logo-preview-container').classList.add('hidden');
}

async function saveSettings(event) {
    event.preventDefault();
    const updatedSettings = {
        storeName: document.getElementById('set-store-name').value,
        storeAddress: document.getElementById('set-store-address').value,
        storePhone: document.getElementById('set-store-phone').value,
        cashierName: document.getElementById('set-cashier-name').value,
        storeLogo: document.getElementById('set-store-logo').value,
        productPrefix: document.getElementById('set-product-prefix').value
    };

    try {
        await mutateStoreDataAtomic((state) => {
            state.settings = { ...state.settings, ...updatedSettings };
        });
        applySettingsToUI();
        showToast('Pengaturan toko berhasil disimpan!');
    } catch (err) {
        showToast(err.message || 'Gagal menyimpan pengaturan!', true);
    }
}
