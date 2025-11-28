// --- Konfigurasi Awal ---
const ADMIN_USER = 'admin';
const ADMIN_PASS = '12345';
const STORAGE_KEY = 'supercar_data';
let isEditMode = false;
let editingId = null;
let salesChartInstance = null; // Untuk menyimpan instance Chart.js

// --- Fungsi Helper Local Storage ---
const getCars = () => {
    const data = localStorage.getItem(STORAGE_KEY);
    // Mengubah string JSON menjadi array, jika null kembalikan array kosong
    return data ? JSON.parse(data) : [];
};

const saveCars = (cars) => {
    // Menyimpan array mobil ke Local Storage sebagai string JSON
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cars));
};

// --- Fungsi Autentikasi (Login dan Logout) ---

function checkLogin() {
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const isDashboard = window.location.pathname.includes('indexxx.html');
    const isLogin = window.location.pathname.includes('indexx.html');

    if (isDashboard && !loggedIn) {
        window.location.href = 'indexx.html'; // Redirect ke login jika belum login
    }
    if (isLogin && loggedIn) {
        window.location.href = 'indexxx.html'; // Redirect ke dashboard jika sudah login
    }
    // Hanya render data dan chart jika di dashboard dan sudah login
    if (isDashboard && loggedIn) {
        renderCarTable();
        updateChart();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Hanya jalankan logic form/login jika elemennya ada
    if (document.getElementById('loginForm')) {
        document.getElementById('loginForm').addEventListener('submit', handleLogin);
    }
    if (document.getElementById('carForm')) {
        document.getElementById('carForm').addEventListener('submit', handleCarFormSubmit);
    }
    
    // Panggil checkLogin di awal untuk semua halaman
    checkLogin();
});

function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const message = document.getElementById('loginMessage');

    if (username === ADMIN_USER && password === ADMIN_PASS) {
        localStorage.setItem('isLoggedIn', 'true');
        window.location.href = 'indexxx.html';
    } else {
        message.textContent = 'Username atau password salah.';
        message.classList.remove('d-none');
    }
}

function logout() {
    localStorage.removeItem('isLoggedIn');
    window.location.href = 'indexx.html';
}

// --- Fungsi CRUD (Create, Read, Update, Delete) ---

function handleCarFormSubmit(event) {
    event.preventDefault();
    
    const id = document.getElementById('carId').value;
    const name = document.getElementById('carName').value;
    const url = document.getElementById('carUrl').value;
    const status = document.getElementById('carStatus').value;
    
    const newCar = {
        id: isEditMode ? id : Date.now().toString(), // Gunakan ID lama saat edit
        name,
        url,
        status,
        // Tambahkan timestamp atau data lain jika diperlukan
    };

    let cars = getCars();
    
    if (isEditMode) {
        // Logika Edit (Update)
        const index = cars.findIndex(car => car.id === id);
        if (index !== -1) {
            cars[index] = newCar;
        }
    } else {
        // Logika Tambah (Create)
        cars.push(newCar);
    }

    saveCars(cars);
    resetForm();
    renderCarTable();
    updateChart(); // Update chart setelah data berubah
}

function renderCarTable() {
    const cars = getCars();
    const tableBody = document.getElementById('carTableBody');
    const emptyMessage = document.getElementById('emptyMessage');
    tableBody.innerHTML = ''; // Kosongkan tabel
    
    if (cars.length === 0) {
        emptyMessage.style.display = 'block';
        return;
    } else {
        emptyMessage.style.display = 'none';
    }

    cars.forEach((car, index) => {
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <img src="${car.url}" alt="${car.name}" class="car-thumbnail" onerror="this.onerror=null;this.src='https://via.placeholder.com/80x50?text=No+Image';">
            </td>
            <td>${car.name}</td>
            <td>
                <span class="badge bg-${car.status === 'sold' ? 'danger' : 'success'}">${car.status === 'sold' ? 'Terjual' : 'Tersedia'}</span>
            </td>
            <td class="text-center">
                <button class="btn btn-sm btn-outline-info rounded-pill me-2" onclick="editCar('${car.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-outline-danger rounded-pill" onclick="deleteCar('${car.id}')">
                    <i class="fas fa-trash-alt"></i> Hapus
                </button>
            </td>
        `;
    });
}

function editCar(id) {
    const cars = getCars();
    const carToEdit = cars.find(car => car.id === id);
    
    if (carToEdit) {
        // Isi form dengan data mobil
        document.getElementById('carId').value = carToEdit.id;
        document.getElementById('carName').value = carToEdit.name;
        document.getElementById('carUrl').value = carToEdit.url;
        document.getElementById('carStatus').value = carToEdit.status;
        
        // Ubah mode ke edit
        isEditMode = true;
        document.getElementById('saveBtn').innerHTML = '<i class="fas fa-sync-alt"></i> Update Data';
        document.getElementById('saveBtn').classList.remove('btn-primary');
        document.getElementById('saveBtn').classList.add('btn-info');
        document.getElementById('cancelBtn').style.display = 'inline-block';
        
        // Scroll ke form
        document.getElementById('carForm').scrollIntoView({ behavior: 'smooth' });
    }
}

function deleteCar(id) {
    if (confirm('Yakin ingin menghapus data mobil ini?')) {
        let cars = getCars();
        // Filter: Buat array baru tanpa mobil dengan ID yang dihapus
        cars = cars.filter(car => car.id !== id); 
        saveCars(cars);
        renderCarTable();
        updateChart(); // Update chart setelah data dihapus
    }
}

function resetForm() {
    document.getElementById('carForm').reset();
    isEditMode = false;
    document.getElementById('carId').value = '';
    document.getElementById('saveBtn').innerHTML = '<i class="fas fa-save"></i> Tambah Data';
    document.getElementById('saveBtn').classList.remove('btn-info');
    document.getElementById('saveBtn').classList.add('btn-primary');
    document.getElementById('cancelBtn').style.display = 'none';
}

// Tambahkan event listener untuk tombol batal edit
document.getElementById('cancelBtn')?.addEventListener('click', resetForm);


// --- Fungsi Chart ---

function updateChart() {
    const cars = getCars();
    
    // Hitung status mobil
    const soldCount = cars.filter(car => car.status === 'sold').length;
    const availableCount = cars.filter(car => car.status === 'available').length;
    
    const ctx = document.getElementById('salesChart');

    if (!ctx) return; // Keluar jika bukan di halaman dashboard

    const data = {
        labels: ['Tersedia', 'Terjual'],
        datasets: [{
            label: 'Jumlah Mobil',
            data: [availableCount, soldCount],
            backgroundColor: [
                'rgba(40, 167, 69, 0.7)', // Success/Tersedia (Hijau)
                'rgba(220, 53, 69, 0.7)'  // Danger/Terjual (Merah)
            ],
            borderColor: [
                'rgba(40, 167, 69, 1)',
                'rgba(220, 53, 69, 1)'
            ],
            borderWidth: 1
        }]
    };

    const config = {
        type: 'doughnut', // Chart Tipe Donut (minimalis & elegan)
        data: data,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Distribusi Status Mobil'
                }
            }
        }
    };
    
    // Hancurkan instance chart lama jika ada
    if (salesChartInstance) {
        salesChartInstance.destroy();
    }
    
    // Buat instance chart baru
    salesChartInstance = new Chart(ctx, config);
}