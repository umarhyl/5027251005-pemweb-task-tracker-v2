// Selektor DOM Utama
const taskForm = document.getElementById('task-form');
const taskTitleInput = document.getElementById('task-title');
const taskCourseSelect = document.getElementById('task-course');
const taskDeadlineInput = document.getElementById('task-deadline');
const submitBtn = document.getElementById('submit-btn');

const taskList = document.getElementById('task-list');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const retryBtn = document.getElementById('retry-btn');
const emptyState = document.getElementById('empty-state');
const activeCountSpan = document.getElementById('active-count');
const filterButtons = document.querySelectorAll('.filter-btn');
const searchInput = document.getElementById('search-input');

// State Aplikasi
let tasks = [];
let courses = [];
let currentFilter = 'all';
let searchQuery = '';
let searchTimeout = null;

// Inisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    fetchAllData();
});

// Helper API fetch() dengan penanganan error & response.ok
async function api(url, options = {}) {
    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    // Jika respons kosong (misal 204 No Content), kembalikan null
    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

// 14. Gunakan Promise.all() untuk mengambil data tugas & mata kuliah bersamaan
async function fetchAllData() {
    loadingState.classList.remove('hidden');
    errorState.classList.add('hidden');
    emptyState.classList.add('hidden');
    taskList.innerHTML = '';

    try {
        const [tasksData, coursesData] = await Promise.all([
            api('/api/tugas'),
            api('/api/matkul') // Asumsi endpoint daftar mata kuliah tersedia
        ]);

        tasks = tasksData || [];
        courses = coursesData || [];

        populateCourseSelect();
        render();
    } catch (error) {
        console.error(error);
        errorMessage.textContent = 'Gagal memuat data dari server. Periksa koneksi Anda.';
        errorState.classList.remove('hidden');
    } finally {
        loadingState.classList.add('hidden');
    }
}

// Mengisi opsi select mata kuliah dari API
function populateCourseSelect() {
    // Pertahankan opsi default pertama
    taskCourseSelect.innerHTML = '<option value="" disabled selected>Pilih Mata Kuliah</option>';
    courses.forEach(course => {
        const option = document.createElement('option');
        option.value = course.nama || course;
        option.textContent = course.nama || course;
        taskCourseSelect.appendChild(option);
    });
}

// Tombol Coba Lagi pada Error State
retryBtn.addEventListener('click', () => {
    fetchAllData();
});

// 5 & 6. Submit Form Tambah Tugas
taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const judul = taskTitleInput.value.trim();
    const matkul = taskCourseSelect.value;
    const deadline = taskDeadlineInput.value;

    if (judul.length < 3) {
        alert('Judul tugas minimal harus 3 karakter.');
        return;
    }

    const newTaskPayload = { judul, matkul, deadline, selesai: false };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Menyimpan...';

    try {
        const createdTask = await api('/api/tugas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newTaskPayload)
        });

        // Jika server mengembalikan objek baru, tambahkan ke state
        if (createdTask) {
            tasks.push(createdTask);
        } else {
            // Fallback jika API tidak mengembalikan return object lengkap
            fetchAllData();
        }

        render();
        taskForm.reset();
    } catch (error) {
        console.error(error);
        alert('Gagal menambahkan tugas. Silakan coba lagi.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Tambah Tugas';
    }
});

// 7 & 8. Event Delegation untuk Checkbox Selesai & Tombol Hapus
taskList.addEventListener('click', async (e) => {
    const taskItem = e.target.closest('.task-item');
    if (!taskItem) return;

    const taskId = taskItem.dataset.id;

    // 7. Checkbox Selesai (PATCH /api/tugas/:id)
    if (e.target.classList.contains('task-checkbox')) {
        const isChecked = e.target.checked;
        e.target.disabled = true; // Cegah klik berlebih saat proses

        try {
            const updatedTask = await api(`/api/tugas/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ selesai: isChecked })
            });

            // Perbarui state lokal berdasarkan response server
            const task = tasks.find(t => String(t.id) === String(taskId));
            if (task) {
                task.selesai = updatedTask ? updatedTask.selesai : isChecked;
            }
            render();
        } catch (error) {
            console.error(error);
            e.target.checked = !isChecked; // Revert checkbox jika gagal
            alert('Gagal memperbarui status tugas.');
        } finally {
            e.target.disabled = false;
        }
    }

    // 8. Tombol Hapus Tugas (DELETE /api/tugas/:id)
    if (e.target.classList.contains('btn-delete')) {
        const deleteBtn = e.target;
        deleteBtn.disabled = true;
        deleteBtn.textContent = '...';

        try {
            await api(`/api/tugas/${taskId}`, {
                method: 'DELETE'
            });

            // Hapus item dari state setelah server sukses merespons
            tasks = tasks.filter(t => String(t.id) !== String(taskId));
            render();
        } catch (error) {
            console.error(error);
            alert('Gagal menghapus tugas.');
            deleteBtn.disabled = false;
            deleteBtn.textContent = 'Hapus';
        }
    }
});

// 9. Fitur Filter
filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        render();
    });
});

// 15. Pencarian Tugas dengan Debounce
searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        searchQuery = e.target.value.trim().toLowerCase();
        render();
    }, 300);
});

// 11. Fungsi render() untuk membangun ulang daftar tugas dari state aplikasi
function render() {
    // Filter berdasarkan status & pencarian query
    const filteredTasks = tasks.filter(task => {
        const matchFilter = 
            currentFilter === 'active' ? !task.selesai :
            currentFilter === 'completed' ? task.selesai : true;

        const matchSearch = 
            task.judul.toLowerCase().includes(searchQuery) || 
            task.matkul.toLowerCase().includes(searchQuery);

        return matchFilter && matchSearch;
    });

    taskList.innerHTML = '';

    if (filteredTasks.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
    }

    // Membangun elemen DOM dengan aman menggunakan textContent (Mencegah XSS)
    filteredTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.selesai ? 'completed' : ''}`;
        li.dataset.id = task.id;

        const taskInfo = document.createElement('div');
        taskInfo.className = 'task-info';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task-checkbox';
        checkbox.checked = task.selesai;

        const taskDetails = document.createElement('div');
        taskDetails.className = 'task-details';

        const h3 = document.createElement('h3');
        h3.textContent = task.judul;

        const taskMeta = document.createElement('div');
        taskMeta.className = 'task-meta';

        const courseTag = document.createElement('span');
        courseTag.className = 'course-tag';
        courseTag.textContent = task.matkul;

        const deadlineSpan = document.createElement('span');
        deadlineSpan.textContent = `Deadline: ${task.deadline}`;

        taskMeta.appendChild(courseTag);
        taskMeta.appendChild(deadlineSpan);

        taskDetails.appendChild(h3);
        taskDetails.appendChild(taskMeta);

        taskInfo.appendChild(checkbox);
        taskInfo.appendChild(taskDetails);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-delete';
        deleteBtn.textContent = 'Hapus';

        li.appendChild(taskInfo);
        li.appendChild(deleteBtn);

        taskList.appendChild(li);
    });

    // 10. Tampilkan jumlah tugas yang masih aktif
    const activeTasksCount = tasks.filter(t => !t.selesai).length;
    activeCountSpan.textContent = activeTasksCount;
}