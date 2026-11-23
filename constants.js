const DEFAULT_PRODUCTS = [
    { id: "4821", name: "Kopi Susu Gula Aren", category: "Minuman", buyPrice: 8000, sellPrice: 15000, stock: 45, createdAt: "2026-10-01T10:00:00.000Z" },
    { id: "9312", name: "Teh Tarik Madu", category: "Minuman", buyPrice: 5000, sellPrice: 10000, stock: 30, createdAt: "2026-10-01T10:00:00.000Z" },
    { id: "1054", name: "Roti Bakar Keju Special", category: "Makanan", buyPrice: 10000, sellPrice: 18000, stock: 20, createdAt: "2026-10-02T11:30:00.000Z" },
    { id: "7239", name: "Nasi Goreng Spesial", category: "Makanan", buyPrice: 12000, sellPrice: 22000, stock: 15, createdAt: "2026-10-03T09:15:00.000Z" },
    { id: "3381", name: "Dimsum Mentai (isi 4)", category: "Makanan", buyPrice: 14000, sellPrice: 25000, stock: 12, createdAt: "2026-10-04T14:20:00.000Z" },
    { id: "6502", name: "Lemon Tea Segar", category: "Minuman", buyPrice: 4000, sellPrice: 8000, stock: 50, createdAt: "2026-10-05T08:00:00.000Z" }
];

const DEFAULT_SETTINGS = {
    storeName: "Toko Berkah Jaya",
    storeAddress: "Jl. Jenderal Sudirman No. 45, Jakarta",
    storePhone: "0812-3456-7890",
    cashierName: "Admin Utama",
    storeLogo: "",
    productPrefix: "PRD-"
};

const ACCOUNT_ROLES = {
    "admin@abs.com": { role: "admin", name: "Admin Utama" },
    "kasir1@abs.com": { role: "cashier1", name: "Kasir 1" },
    "kasir2@abs.com": { role: "cashier2", name: "Kasir 2" }
};

const DEFAULT_ACCOUNTS = [
    { id: "ACC-CASH", name: "Kas Tunai Kasir", type: "cash", accountNumber: "-", balance: 0 },
    { id: "ACC-BANK", name: "Rekening Bank Utama", type: "bank", accountNumber: "", balance: 0 },
    { id: "ACC-QRIS", name: "Saldo QRIS / E-Wallet", type: "ewallet", accountNumber: "-", balance: 0 }
];

const EXPENSE_CATEGORIES = [
    "Ongkir / Ekspedisi",
    "Bensin & Operasional Kurir",
    "Bongkar Muat / Gudang",
    "Gaji & Upah Karyawan",
    "Listrik, Air & Internet",
    "Kemasan & Lakban",
    "Sewa Tempat",
    "Lain-lain"
];
