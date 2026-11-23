// Global Application State
let products = [...DEFAULT_PRODUCTS];
let transactions = [];
let settings = { ...DEFAULT_SETTINGS };
let cart = [];
let activeCategory = 'Semua';
let paymentMethod = 'cash';
let currentTransactionToPrint = null;
let currentUser = null;
let isCheckingOut = false;
let toastTimer = null;

// Pagination States
let currentProductPage = 1;
let currentPOSPage = 1;
let currentReportPage = 1;
const itemsPerPage = 9;

// Hardware & Cloud References
let bluetoothDevice = null;
let bluetoothCharacteristic = null;

let firebaseApp = null;
let auth = null;
let db = null;
let isFirebaseConnected = false;
let isAuthInitialized = false;
let firestoreUnsubscribe = null;
let accounts = JSON.parse(JSON.stringify(DEFAULT_ACCOUNTS));
let cashTransfers = [];
