// =====================================================================
// API CONFIGURATION
// =====================================================================
const JSONBIN_API_KEY = "$2a$10$sZDo3Y8ECzT3IV9Wscd0y.Zay7lus4MQrvu30Fqw9lDKl3UCXZ5RS";
const JSONBIN_BIN_ID = "68d7f2a2d0ea881f408cfce9";
const JSONBIN_API_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;

// =====================================================================
// GLOBAL VARIABLES & ELEMENT FINDING
// =====================================================================
let truckingAppData = [];
let activeCompanyId = null;

// Variabel State
let sortColumn = 'tanggal';
let sortDirection = 'desc';
let currentRingkasanKategori = '';

// Halaman
const semuaHalaman = document.querySelectorAll('.page');
const halamanDaftarPerusahaan = document.getElementById('halaman-daftar-perusahaan');
const halamanMenu = document.getElementById('halaman-menu');
const halamanBongkaran = document.getElementById('halaman-bongkaran');
const halamanRingkasanStats = document.getElementById('halaman-ringkasan-stats');
const halamanStatistik = document.getElementById('halaman-statistik');


// Elemen Halaman Daftar Perusahaan
const containerDaftarPerusahaan = document.getElementById('container-daftar-perusahaan');
const tombolTambahPerusahaanBaru = document.getElementById('tombol-tambah-perusahaan-baru');

// Elemen Halaman Menu
const kembaliKeDaftarPerusahaan = document.getElementById('kembali-ke-daftar-perusahaan');
const displayNamaPerusahaanMenu = document.getElementById('display-nama-perusahaan-menu');
const menuCatatanBongkaran = document.getElementById('menu-catatan-bongkaran');
const menuStatistikSopir = document.getElementById('menu-statistik-sopir');
const menuStatistikLokasi = document.getElementById('menu-statistik-lokasi');
const menuStatistikKendaraan = document.getElementById('menu-statistik-kendaraan');

// Elemen Halaman Catatan Bongkaran
const kembaliKeMenuDariBongkaran = document.getElementById('kembali-ke-menu-dari-bongkaran');
const displayNamaPerusahaanBongkaran = document.getElementById('display-nama-perusahaan-bongkaran');
const tombolTambahBongkaranBaru = document.getElementById('tombol-tambah-bongkaran-baru');
const containerTabelBongkaran = document.getElementById('container-tabel-bongkaran');
const filterBulanBongkaran = document.getElementById('filter-bulan-bongkaran');

// Elemen Halaman Ringkasan Statistik
const kembaliKeMenuDariRingkasan = document.getElementById('kembali-ke-menu-dari-ringkasan');
const ringkasanStatsJudul = document.getElementById('ringkasan-stats-judul');
const containerRingkasanStats = document.getElementById('container-ringkasan-stats');
const filterBulanRingkasan = document.getElementById('filter-bulan-ringkasan');

// Elemen Halaman Detail Statistik
const kembaliDariStatistik = document.getElementById('kembali-dari-statistik');
const statistikJudul = document.getElementById('statistik-judul');
const statistikRingkasanContainer = document.getElementById('statistik-ringkasan-container');
const statistikTabelDetail = document.getElementById('statistik-tabel-detail');

// Elemen Modal
const modalBongkaran = document.getElementById('modal-bongkaran');
const formBongkaran = document.getElementById('form-bongkaran');
const modalJudul = document.getElementById('modal-judul');
const tombolBatalModal = document.getElementById('tombol-batal-modal');
const editIdBongkaran = document.getElementById('edit-id-bongkaran');

// =====================================================================
// FUNGSI API & MANAJEMEN DATA
// =====================================================================
async function saveData(data) {
    const headers = { 'Content-Type': 'application/json', 'X-Master-Key': JSONBIN_API_KEY };
    try {
        const response = await fetch(JSONBIN_API_URL, { method: 'PUT', headers: headers, body: JSON.stringify(data) });
        if (!response.ok) throw new Error(`Gagal menyimpan data: ${response.status}`);
    } catch (error) {
        console.error("Kesalahan Simpan:", error);
        alert("Error: Tidak dapat menyimpan data ke server.");
    }
}

async function loadData() {
    const headers = { 'X-Master-Key': JSONBIN_API_KEY };
    try {
        const response = await fetch(`${JSONBIN_API_URL}/latest`, { headers: headers, cache: 'no-store' });
        if (!response.ok) {
            if (response.status === 404) {
                await saveData({ companies: [] });
                return { companies: [] };
            }
            throw new Error(`Gagal memuat data: ${response.status}`);
        }
        const data = await response.json();
        return data.record;
    } catch (error) {
        console.error("Kesalahan Muat:", error);
        alert("Error: Tidak dapat memuat data dari server. Silakan periksa koneksi Anda dan segarkan halaman.");
        return { companies: [] };
    }
}

async function saveState() {
    await saveData({ companies: truckingAppData });
}

async function initializeApp() {
    try {
        const data = await loadData();
        truckingAppData = data.companies || [];
        renderCompanyList();
        tampilkanHalaman('halaman-daftar-perusahaan');
        setupEventListeners();
    } catch (error) {
        console.error("Error saat inisialisasi aplikasi:", error);
    }
}

// =====================================================================
// FUNGSI UI & PEMBANTU
// =====================================================================
function tampilkanHalaman(idHalaman) {
    semuaHalaman.forEach(h => h.classList.add('hidden'));
    document.getElementById(idHalaman).classList.remove('hidden');
}

function getActiveCompany() {
    return truckingAppData.find(c => c.id === activeCompanyId);
}

// Diperbarui: untuk menangani data lama yang format hurufnya berbeda
function getUniqueValues(fieldName) {
    const company = getActiveCompany();
    if (!company) return [];
    // Ubah semua jadi huruf kecil dulu, baru cari yang unik
    const values = company.unloadingJobs.map(job => (job[fieldName] || '').toLowerCase());
    return [...new Set(values)].filter(Boolean);
}

function populateMonthFilter(selectElement, jobs, callback) {
    const currentVal = selectElement.value;
    const months = [...new Set(jobs.map(job => job.tanggal.substring(0, 7)))]; // "YYYY-MM"
    months.sort().reverse();
    
    selectElement.innerHTML = '<option value="semua">Semua Bulan</option>';
    months.forEach(month => {
        const date = new Date(month + "-02"); // Pakai tanggal 2 untuk hindari bug timezone
        const monthName = date.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
        const option = document.createElement('option');
        option.value = month;
        option.textContent = monthName;
        selectElement.appendChild(option);
    });
    
    selectElement.value = currentVal;
    selectElement.onchange = callback;
}

function formatTampilan(str) {
    if (!str) return '';
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

// =====================================================================
// EVENT LISTENERS UTAMA
// =====================================================================
function setupEventListeners() {
    // Navigasi
    kembaliKeDaftarPerusahaan.addEventListener('click', () => tampilkanHalaman('halaman-daftar-perusahaan'));
    kembaliKeMenuDariBongkaran.addEventListener('click', () => tampilkanHalaman('halaman-menu'));
    kembaliKeMenuDariRingkasan.addEventListener('click', () => tampilkanHalaman('halaman-menu'));

    // Menu Utama
    menuCatatanBongkaran.addEventListener('click', () => {
        const company = getActiveCompany();
        displayNamaPerusahaanBongkaran.textContent = company.name;
        renderUnloadingTable();
        tampilkanHalaman('halaman-bongkaran');
    });
    menuStatistikSopir.addEventListener('click', () => tampilkanRingkasanStats('sopir'));
    menuStatistikLokasi.addEventListener('click', () => tampilkanRingkasanStats('lokasi'));
    menuStatistikKendaraan.addEventListener('click', () => tampilkanRingkasanStats('plat'));
}


// =====================================================================
// MANAJEMEN PERUSAHAAN
// =====================================================================
function renderCompanyList() {
    containerDaftarPerusahaan.innerHTML = '';
    if (truckingAppData && truckingAppData.length > 0) {
        truckingAppData.forEach(company => {
            const itemContainer = document.createElement('div');
            itemContainer.className = 'perusahaan-item-container';
            itemContainer.onclick = (event) => {
                if (!event.target.closest('.tombol-pengaturan-perusahaan, .menu-aksi-perusahaan')) {
                    muatPerusahaan(company.id);
                }
            };

            const namaSpan = document.createElement('span');
            namaSpan.className = 'nama-perusahaan-item';
            namaSpan.textContent = company.name;

            const tombolPengaturan = document.createElement('button');
            tombolPengaturan.className = 'tombol-pengaturan-perusahaan';
            tombolPengaturan.innerHTML = '&#9881;';
            tombolPengaturan.onclick = (event) => toggleMenuAksi(event, company.id);
            
            const menuAksi = document.createElement('div');
            menuAksi.className = 'menu-aksi-perusahaan';
            menuAksi.id = `menu-aksi-${company.id}`;
            menuAksi.innerHTML = `
                <a href="#" onclick="renamePerusahaan(${company.id}, event)">Ganti Nama</a>
                <a href="#" onclick="hapusPerusahaan(${company.id}, event)" class="menu-aksi-hapus">Hapus</a>
            `;
            menuAksi.addEventListener('click', (event) => event.stopPropagation());

            itemContainer.appendChild(namaSpan);
            itemContainer.appendChild(tombolPengaturan);
            itemContainer.appendChild(menuAksi);
            containerDaftarPerusahaan.appendChild(itemContainer);
        });
    } else {
        containerDaftarPerusahaan.innerHTML = '<p>Tidak ada perusahaan ditemukan. Buat satu untuk memulai.</p>';
    }
}

function toggleMenuAksi(event, companyId) {
    event.stopPropagation();
    const currentMenu = document.getElementById(`menu-aksi-${companyId}`);
    document.querySelectorAll('.menu-aksi-perusahaan').forEach(menu => {
        if (menu.id !== `menu-aksi-${companyId}`) menu.style.display = 'none';
    });
    currentMenu.style.display = (currentMenu.style.display === 'block') ? 'none' : 'block';
}

tombolTambahPerusahaanBaru.addEventListener('click', async () => {
    const companyName = prompt("Masukkan nama perusahaan baru:");
    if (!companyName || companyName.trim() === '') return;
    const password = prompt(`Masukkan kata sandi untuk "${companyName.trim()}":`);
    if (password === null) return;
    truckingAppData.push({
        id: Date.now(),
        name: companyName.trim(),
        password: password,
        unloadingJobs: []
    });
    renderCompanyList();
    await saveState();
});

function renamePerusahaan(companyId, event) {
    if (event) event.stopPropagation();
    const company = truckingAppData.find(c => c.id === companyId);
    if (!company) return;
    const password = prompt(`Untuk mengganti nama "${company.name}", silakan masukkan kata sandinya:`);
    if (password === company.password) {
        const newName = prompt("Masukkan nama perusahaan baru:", company.name);
        if (newName && newName.trim() !== '') {
            company.name = newName.trim();
            renderCompanyList();
            saveState();
        }
    } else if (password !== null) {
        alert('Kata sandi salah!');
    }
}

function hapusPerusahaan(companyId, event) {
    if (event) event.stopPropagation();
    const company = truckingAppData.find(c => c.id === companyId);
    if (!company) return;
    const password = prompt(`Untuk menghapus "${company.name}", silakan masukkan kata sandinya:`);
    if (password === company.password) {
        if (confirm('Apakah Anda yakin ingin menghapus perusahaan ini dan semua catatannya secara permanen?')) {
            truckingAppData = truckingAppData.filter(c => c.id !== companyId);
            renderCompanyList();
            saveState();
        }
    } else if (password !== null) {
        alert('Kata sandi salah!');
    }
}

function muatPerusahaan(companyId) {
    const company = truckingAppData.find(c => c.id === companyId);
    if (!company) return;
    const password = prompt(`Masukkan kata sandi untuk membuka "${company.name}":`);
    if (password === company.password) {
        activeCompanyId = companyId;
        displayNamaPerusahaanMenu.textContent = company.name;
        tampilkanHalaman('halaman-menu');
    } else if (password !== null) {
        alert('Kata sandi salah!');
    }
}


// =====================================================================
// MANAJEMEN CATATAN BONGKARAN & SORTING
// =====================================================================
function sortTableBy(column) {
    if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = column;
        sortDirection = (column === 'tanggal') ? 'desc' : 'asc';
    }
    renderUnloadingTable();
}

function renderUnloadingTable() {
    const company = getActiveCompany();
    if (!company) return;

    populateMonthFilter(filterBulanBongkaran, company.unloadingJobs, renderUnloadingTable);
    
    const selectedMonth = filterBulanBongkaran.value;
    const filteredJobs = selectedMonth === 'semua'
        ? company.unloadingJobs
        : company.unloadingJobs.filter(job => job.tanggal.startsWith(selectedMonth));

    if (filteredJobs.length === 0) {
        containerTabelBongkaran.innerHTML = '<p>Tidak ada catatan pada bulan yang dipilih.</p>';
        return;
    }

    const sortedJobs = [...filteredJobs].sort((a, b) => {
        let valA, valB;
        if (sortColumn === 'penghasilan') {
            valA = (a.harga * a.volume) - a.perongkosan - a.gaji - (a.bonus || 0);
            valB = (b.harga * b.volume) - b.perongkosan - b.gaji - (b.bonus || 0);
        } else {
            valA = a[sortColumn];
            valB = b[sortColumn];
        }
        let comparison = 0;
        if (typeof valA === 'string' && sortColumn !== 'tanggal') {
            comparison = valA.localeCompare(valB);
        } else if (sortColumn === 'tanggal') {
            comparison = new Date(valA) - new Date(valB);
        } else {
            comparison = valA - valB;
        }
        return sortDirection === 'asc' ? comparison : -comparison;
    });

    const headers = [
        { key: 'tanggal', label: 'Tanggal' }, { key: 'plat', label: 'Plat Mobil' },
        { key: 'nota', label: 'No. Nota' }, { key: 'sopir', label: 'Sopir' },
        { key: 'material', label: 'Material' }, { key: 'volume', label: 'Volume' },
        { key: 'harga', label: 'Harga' }, { key: 'omzet', label: 'Omzet' },
        { key: 'lokasi', label: 'Lokasi' }, // << DIKEMBALIKAN
        { key: 'perongkosan', label: 'Perongkosan' }, { key: 'gaji', label: 'Gaji' },
        { key: 'bonus', label: 'Bonus' }, { key: 'penghasilan', label: 'Penghasilan' },
        { key: null, label: 'Aksi' }
    ];

    let headerHTML = '<tr>';
    headers.forEach(header => {
        if (header.key) {
            const sortIndicator = sortColumn === header.key ? (sortDirection === 'asc' ? ' &#9650;' : ' &#9660;') : '';
            headerHTML += `<th onclick="sortTableBy('${header.key}')" style="cursor: pointer;">${header.label}${sortIndicator}</th>`;
        } else {
            headerHTML += `<th>${header.label}</th>`;
        }
    });
    headerHTML += '</tr>';

    let bodyHTML = '';
    sortedJobs.forEach(job => {
        const omzet = job.harga * job.volume;
        const income = omzet - job.perongkosan - job.gaji - (job.bonus || 0);
        const displayDate = new Date(job.tanggal).toLocaleDateString('id-ID', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
        bodyHTML += `
            <tr id="job-${job.id}">
                <td>${displayDate}</td>
                <td class="clickable" onclick="tampilkanStatistik('plat', '${job.plat}', 'halaman-bongkaran')">${job.plat.toUpperCase()}</td>
                <td>${job.nota}</td>
                <td class="clickable" onclick="tampilkanStatistik('sopir', '${job.sopir}', 'halaman-bongkaran')">${formatTampilan(job.sopir)}</td>
                <td>${formatTampilan(job.material)}</td>
                <td>${job.volume.toLocaleString('id-ID')}</td>
                <td>${job.harga.toLocaleString('id-ID')}</td>
                <td>${omzet.toLocaleString('id-ID')}</td>
                <td class="clickable" onclick="tampilkanStatistik('lokasi', '${job.lokasi}', 'halaman-bongkaran')">${formatTampilan(job.lokasi)}</td>
                <td>${job.perongkosan.toLocaleString('id-ID')}</td>
                <td>${job.gaji.toLocaleString('id-ID')}</td>
                <td>${(job.bonus || 0).toLocaleString('id-ID')}</td>
                <td><strong>${income.toLocaleString('id-ID')}</strong></td>
                <td class="col-actions">
                    <button onclick="editBongkaran(${job.id})">&#9998;</button>
                    <button class="tombol-hapus-bongkaran" onclick="hapusBongkaran(${job.id})">&times;</button>
                </td>
            </tr>
        `;
    });

    const totals = sortedJobs.reduce((acc, job) => {
        const omzet = job.harga * job.volume;
        acc.omzet += omzet;
        acc.perongkosan += job.perongkosan;
        acc.gaji += job.gaji;
        acc.bonus += (job.bonus || 0);
        acc.penghasilan += omzet - job.perongkosan - job.gaji - (job.bonus || 0);
        return acc;
    }, { omzet: 0, perongkosan: 0, gaji: 0, bonus: 0, penghasilan: 0 });

    const footerHTML = `
        <tr>
            <td colspan="7"><strong>TOTAL</strong></td>
            <td><strong>${totals.omzet.toLocaleString('id-ID')}</strong></td>
            <td></td>
            <td><strong>${totals.perongkosan.toLocaleString('id-ID')}</strong></td>
            <td><strong>${totals.gaji.toLocaleString('id-ID')}</strong></td>
            <td><strong>${totals.bonus.toLocaleString('id-ID')}</strong></td>
            <td><strong>${totals.penghasilan.toLocaleString('id-ID')}</strong></td>
            <td></td>
        </tr>
    `;

    containerTabelBongkaran.innerHTML = `<table><thead>${headerHTML}</thead><tbody>${bodyHTML}</tbody><tfoot>${footerHTML}</tfoot></table>`;
}

// =====================================================================
// FUNGSI MODAL & AUTOCOMPLETE
// =====================================================================
function setupAutocomplete(inputId, suggestionsId, fieldName) {
    const input = document.getElementById(inputId);
    const suggestionsContainer = document.getElementById(suggestionsId);
    
    input.addEventListener('focus', () => {
        const allSuggestions = getUniqueValues(fieldName);
        showSuggestions(allSuggestions, '');
    });
    
    input.addEventListener('input', () => {
        const allSuggestions = getUniqueValues(fieldName);
        const query = input.value.toLowerCase();
        const filtered = allSuggestions.filter(item => String(item).toLowerCase().includes(query));
        showSuggestions(filtered, query);
    });

    const showSuggestions = (suggestions, query) => {
        suggestionsContainer.innerHTML = '';
        if (suggestions.length > 0) {
            suggestions.forEach(suggestion => {
                const div = document.createElement('div');
                const formattedSuggestion = fieldName === 'plat' ? suggestion.toUpperCase() : formatTampilan(suggestion);
                div.textContent = formattedSuggestion;
                div.onclick = () => {
                    input.value = formattedSuggestion;
                    suggestionsContainer.style.display = 'none';
                };
                suggestionsContainer.appendChild(div);
            });
            suggestionsContainer.style.display = 'block';
        } else {
            suggestionsContainer.style.display = 'none';
        }
    };

    document.addEventListener('click', (e) => {
        if (e.target.id !== inputId) {
            suggestionsContainer.style.display = 'none';
        }
    });
}


function showBongkaranModal(job = null) {
    formBongkaran.reset();
    if (job) {
        modalJudul.textContent = 'Ubah Catatan';
        editIdBongkaran.value = job.id;
        document.getElementById('input-tanggal').value = job.tanggal;
        document.getElementById('input-plat').value = job.plat.toUpperCase();
        document.getElementById('input-nota').value = job.nota;
        document.getElementById('input-lokasi').value = formatTampilan(job.lokasi);
        document.getElementById('input-sopir').value = formatTampilan(job.sopir);
        document.getElementById('input-material').value = formatTampilan(job.material);
        
        const formatForEdit = (num) => String(num || '').replace('.', ',');

        document.getElementById('input-volume').value = formatForEdit(job.volume);
        document.getElementById('input-harga').value = formatForEdit(job.harga);
        document.getElementById('input-perongkosan').value = formatForEdit(job.perongkosan);
        document.getElementById('input-gaji').value = formatForEdit(job.gaji);
        document.getElementById('input-bonus').value = formatForEdit(job.bonus);

    } else {
        modalJudul.textContent = 'Tambah Catatan Baru';
        editIdBongkaran.value = '';
    }
    
    setupAutocomplete('input-sopir', 'suggestions-sopir', 'sopir');
    setupAutocomplete('input-plat', 'suggestions-plat', 'plat');
    setupAutocomplete('input-lokasi', 'suggestions-lokasi', 'lokasi');
    setupAutocomplete('input-material', 'suggestions-material', 'material');
    setupAutocomplete('input-nota', 'suggestions-nota', 'nota');

    modalBongkaran.classList.remove('hidden');
}

function hideBongkaranModal() {
    modalBongkaran.classList.add('hidden');
}

tombolTambahBongkaranBaru.addEventListener('click', () => showBongkaranModal());
tombolBatalModal.addEventListener('click', hideBongkaranModal);

formBongkaran.addEventListener('submit', (event) => {
    event.preventDefault();
    const company = getActiveCompany();
    if (!company) return;

    const getCleanNumberValue = (id) => {
        const value = document.getElementById(id).value;
        return value.replace(/\./g, '').replace(',', '.');
    };

    const jobData = {
        id: editIdBongkaran.value ? Number(editIdBongkaran.value) : Date.now(),
        tanggal: document.getElementById('input-tanggal').value,
        plat: document.getElementById('input-plat').value.trim().toLowerCase(),
        nota: document.getElementById('input-nota').value.trim(),
        lokasi: document.getElementById('input-lokasi').value.trim().toLowerCase(),
        sopir: document.getElementById('input-sopir').value.trim().toLowerCase(),
        material: document.getElementById('input-material').value.trim().toLowerCase(),
        volume: parseFloat(getCleanNumberValue('input-volume')) || 0,
        harga: parseFloat(getCleanNumberValue('input-harga')) || 0,
        perongkosan: parseFloat(getCleanNumberValue('input-perongkosan')) || 0,
        gaji: parseFloat(getCleanNumberValue('input-gaji')) || 0,
        bonus: parseFloat(getCleanNumberValue('input-bonus')) || 0
    };

    if (editIdBongkaran.value) {
        const index = company.unloadingJobs.findIndex(j => j.id === jobData.id);
        if (index > -1) company.unloadingJobs[index] = jobData;
    } else {
        company.unloadingJobs.push(jobData);
    }
    
    saveState();
    renderUnloadingTable();
    hideBongkaranModal();
});

function editBongkaran(jobId) {
    const company = getActiveCompany();
    const job = company.unloadingJobs.find(j => j.id === jobId);
    if (job) showBongkaranModal(job);
}

function hapusBongkaran(jobId) {
    if (!confirm('Apakah Anda yakin ingin menghapus catatan ini?')) return;
    const company = getActiveCompany();
    company.unloadingJobs = company.unloadingJobs.filter(j => j.id !== jobId);
    saveState();
    renderUnloadingTable();
}

// =====================================================================
// FUNGSI STATISTIK (RINGKASAN & DETAIL)
// =====================================================================
function tampilkanRingkasanStats(kategori) {
    currentRingkasanKategori = kategori;
    const company = getActiveCompany();
    
    populateMonthFilter(filterBulanRingkasan, company.unloadingJobs, () => tampilkanRingkasanStats(kategori));
    
    const selectedMonth = filterBulanRingkasan.value;
    const filteredJobs = selectedMonth === 'semua'
        ? company.unloadingJobs
        : company.unloadingJobs.filter(job => job.tanggal.startsWith(selectedMonth));

    const kategoriMap = {
        'sopir': { judul: 'Sopir', kolom: 'Nama Sopir' },
        'lokasi': { judul: 'Lokasi', kolom: 'Nama Lokasi' },
        'plat': { judul: 'Kendaraan', kolom: 'Plat Mobil' }
    };
    ringkasanStatsJudul.textContent = `Ringkasan Statistik ${kategoriMap[kategori].judul}`;

    if (filteredJobs.length === 0) {
        containerRingkasanStats.innerHTML = "<p>Tidak ada data untuk ditampilkan pada bulan yang dipilih.</p>";
        tampilkanHalaman('halaman-ringkasan-stats');
        return;
    }

    const summary = {};
    filteredJobs.forEach(job => {
        const key = (job[kategori] || '').toLowerCase(); // << DIUBAH: Gunakan lowercase key untuk grouping
        if (!key) return;
        if (!summary[key]) {
            summary[key] = { totalRit: 0, totalVolume: 0, totalPenghasilan: 0 };
        }
        summary[key].totalRit++;
        summary[key].totalVolume += job.volume;
        summary[key].totalPenghasilan += (job.harga * job.volume) - job.perongkosan - job.gaji - (job.bonus || 0);
    });
    
    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>${kategoriMap[kategori].kolom}</th>
                    <th>Total Rit</th>
                    <th>Total Volume</th>
                    <th>Total Penghasilan</th>
                </tr>
            </thead>
            <tbody>
    `;
    const sortedSummary = Object.entries(summary).sort((a, b) => b[1].totalPenghasilan - a[1].totalPenghasilan);

    for (const [key, data] of sortedSummary) {
        const formattedKey = kategori === 'plat' ? key.toUpperCase() : formatTampilan(key);
        tableHTML += `
            <tr class="clickable" onclick="tampilkanStatistik('${kategori}', '${key}', 'halaman-ringkasan-stats')">
                <td>${formattedKey}</td>
                <td>${data.totalRit}</td>
                <td>${data.totalVolume.toLocaleString('id-ID')}</td>
                <td><strong>${data.totalPenghasilan.toLocaleString('id-ID')}</strong></td>
            </tr>
        `;
    }
    tableHTML += `</tbody></table>`;
    containerRingkasanStats.innerHTML = tableHTML;
    tampilkanHalaman('halaman-ringkasan-stats');
}


function tampilkanStatistik(kategori, nilai, halamanKembali) {
    const company = getActiveCompany();
    // DIUBAH: Filter berdasarkan lowercase
    const filteredJobs = company.unloadingJobs.filter(job => (job[kategori] || '').toLowerCase() === nilai);
    filteredJobs.sort((a,b) => new Date(b.tanggal) - new Date(a.tanggal));

    const totalRit = filteredJobs.length;
    const totalVolume = filteredJobs.reduce((sum, job) => sum + job.volume, 0);
    const totalPenghasilan = filteredJobs.reduce((sum, job) => {
        return sum + (job.harga * job.volume) - job.perongkosan - job.gaji - (job.bonus || 0);
    }, 0);
    
    const judulMap = { 'sopir': 'Sopir', 'plat': 'Kendaraan', 'lokasi': 'Lokasi' };
    const formattedNilai = kategori === 'plat' ? nilai.toUpperCase() : formatTampilan(nilai);
    statistikJudul.textContent = `Detail Statistik ${judulMap[kategori]}: ${formattedNilai}`;

    statistikRingkasanContainer.innerHTML = `
        <div class="stat-card">
            <p class="stat-label">Total Rit</p>
            <p class="stat-value">${totalRit}</p>
        </div>
        <div class="stat-card">
            <p class="stat-label">Total Volume</p>
            <p class="stat-value">${totalVolume.toLocaleString('id-ID')}</p>
        </div>
        <div class="stat-card">
            <p class="stat-label">Total Penghasilan</p>
            <p class="stat-value">${totalPenghasilan.toLocaleString('id-ID')}</p>
        </div>
    `;

    let detailHTML = `
        <table>
            <thead>
                <tr>
                    <th>Tanggal</th>
                    ${kategori !== 'plat' ? '<th>Plat Mobil</th>' : ''}
                    ${kategori !== 'sopir' ? '<th>Sopir</th>' : ''}
                    ${kategori !== 'lokasi' ? '<th>Lokasi</th>' : ''}
                    <th>Material</th>
                    <th>Volume</th>
                    <th>Penghasilan</th>
                </tr>
            </thead>
            <tbody>
    `;
    filteredJobs.forEach(job => {
        const income = (job.harga * job.volume) - job.perongkosan - job.gaji - (job.bonus || 0);
        const displayDate = new Date(job.tanggal).toLocaleDateString('id-ID', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
        detailHTML += `
            <tr>
                <td>${displayDate}</td>
                ${kategori !== 'plat' ? `<td>${job.plat.toUpperCase()}</td>` : ''}
                ${kategori !== 'sopir' ? `<td>${formatTampilan(job.sopir)}</td>` : ''}
                ${kategori !== 'lokasi' ? `<td>${formatTampilan(job.lokasi)}</td>` : ''}
                <td>${formatTampilan(job.material)}</td>
                <td>${job.volume.toLocaleString('id-ID')}</td>
                <td><strong>${income.toLocaleString('id-ID')}</strong></td>
            </tr>
        `;
    });
    detailHTML += `</tbody></table>`;
    statistikTabelDetail.innerHTML = detailHTML;

    kembaliDariStatistik.onclick = () => tampilkanHalaman(halamanKembali);
    tampilkanHalaman('halaman-statistik');
}

// =====================================================================
// MEMULAI APLIKASI
// =====================================================================
initializeApp();