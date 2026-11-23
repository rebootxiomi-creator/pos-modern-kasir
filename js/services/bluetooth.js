async function connectBluetoothPrinter() {
    if (!navigator.bluetooth) {
        showToast('Browser Anda tidak mendukung Web Bluetooth API!', true);
        return;
    }

    try {
        showToast('Mencari perangkat printer bluetooth...');
        bluetoothDevice = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: [
                '000018f0-0000-1000-8000-00805f9b34fb',
                '49535343-fe7d-4ae5-8fa9-9fafd205e455',
                '0000ff00-0000-1000-8000-00805f9b34fb'
            ]
        });

        const server = await bluetoothDevice.gatt.connect();
        let service = null;
        const serviceUuids = [
            '000018f0-0000-1000-8000-00805f9b34fb',
            '49535343-fe7d-4ae5-8fa9-9fafd205e455',
            '0000ff00-0000-1000-8000-00805f9b34fb'
        ];
        
        for (const uuid of serviceUuids) {
            try {
                service = await server.getPrimaryService(uuid);
                if (service) break;
            } catch (e) {}
        }

        if (!service) {
            const services = await server.getPrimaryServices();
            service = services[0];
        }

        const characteristics = await service.getCharacteristics();
        bluetoothCharacteristic = characteristics.find(c => c.properties.write || c.properties.writeWithoutResponse);

        if (!bluetoothCharacteristic) {
            throw new Error('Karakteristik write printer tidak ditemukan');
        }

        updateBluetoothStatusUI(true, bluetoothDevice.name);
        showToast(`Printer terhubung: ${bluetoothDevice.name}`);
    } catch (error) {
        console.error(error);
        showToast('Gagal menghubungkan printer Bluetooth!', true);
        updateBluetoothStatusUI(false);
    }
}

function updateBluetoothStatusUI(isConnected, deviceName = '') {
    const label = document.getElementById('bt-status-label');
    const desc = document.getElementById('settings-bt-desc');
    if (isConnected) {
        label.innerText = `Printer BT: ${deviceName || 'Terhubung'}`;
        if (desc) desc.innerText = `Status: Terhubung ke ${deviceName || 'Printer Thermal'}`;
    } else {
        label.innerText = 'Printer BT: Terputus';
        if (desc) desc.innerText = 'Status: Terputus (Belum terhubung ke printer POS)';
    }
}

async function printViaBluetooth() {
    if (!bluetoothCharacteristic || !currentTransactionToPrint) {
        showToast('Printer Bluetooth belum terhubung!', true);
        connectBluetoothPrinter();
        return;
    }

    try {
        const trx = currentTransactionToPrint;
        let escPosData = '';

        const ESC = '\x1B';
        const GS = '\x1D';
        const ALIGN_CENTER = ESC + 'a\x01';
        const ALIGN_LEFT = ESC + 'a\x00';
        const BOLD_ON = ESC + 'E\x01';
        const BOLD_OFF = ESC + 'E\x00';
        const CUT_PAPER = GS + 'V\x41\x00';

        escPosData += ALIGN_CENTER + BOLD_ON + `${settings.storeName.toUpperCase()}\n` + BOLD_OFF;
        escPosData += `${settings.storeAddress}\nTelp: ${settings.storePhone}\n`;
        if (trx.status === 'VOID') {
            escPosData += BOLD_ON + `*** TRANSAKSI VOID ***\n` + BOLD_OFF;
        }
        escPosData += '--------------------------------\n';
        escPosData += ALIGN_LEFT;
        escPosData += `ID Transaksi : ${trx.id}\n`;
        escPosData += `Pelanggan    : ${trx.customerName || 'Umum'}\n`;
        escPosData += `Waktu        : ${new Date(trx.timestamp).toLocaleString('id-ID')}\n`;
        escPosData += `Operator     : ${trx.cashierName || 'Admin Utama'}\n`;
        escPosData += '--------------------------------\n';

        trx.items.forEach(item => {
            escPosData += `${item.name}\n`;
            escPosData += `  ${item.qty} x ${formatRupiah(item.sellPrice)} = ${formatRupiah(item.qty * item.sellPrice)}\n`;
        });

        escPosData += '--------------------------------\n';
        escPosData += `Subtotal  : ${formatRupiah(trx.subtotal || trx.total)}\n`;
        escPosData += `Diskon    : ${formatRupiah(trx.discount || 0)}\n`;
        escPosData += BOLD_ON + `TOTAL     : ${formatRupiah(trx.total)}\n` + BOLD_OFF;
        escPosData += `Metode    : ${trx.method}\n`;
        escPosData += `Bayar     : ${formatRupiah(trx.cashGiven)}\n`;
        escPosData += `Kembali   : ${formatRupiah(trx.change)}\n`;
        escPosData += '--------------------------------\n';
        escPosData += ALIGN_CENTER + 'Terima kasih atas kunjungan Anda!\n\n\n' + CUT_PAPER;

        const encoder = new TextEncoder();
        const bytes = encoder.encode(escPosData);

        const chunkSize = 512;
        for (let i = 0; i < bytes.length; i += chunkSize) {
            const chunk = bytes.slice(i, i + chunkSize);
            await bluetoothCharacteristic.writeValue(chunk);
        }

        showToast('Struk berhasil dicetak melalui printer Bluetooth!');
    } catch (err) {
        console.error(err);
        showToast('Gagal mengirim data cetak ke printer!', true);
    }
}
