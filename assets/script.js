/**
 * script.js — seluruh logika aplikasi
 * Bergantung pada: assets/config.js dan assets/quiz-data.js
 * (harus dimuat lebih dulu di index.html)
 */

/* ========================================================
   0. UTILITAS UMUM
   ======================================================== */
const $ = (selector, scope = document) => scope.querySelector(selector);
const $all = (selector, scope = document) => [...scope.querySelectorAll(selector)];

function formatRupiah(num) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(num);
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function escapeHtml(str = '') {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function showToast(message) {
  const el = $('#toast');
  if (!el) { alert(message); return; }
  el.textContent = message;
  el.classList.remove('hidden');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => el.classList.add('hidden'), 2500);
}

// Buka/tutup modal generik (class 'hidden' + 'flex')
function openModal(modalEl, focusSelector) {
  modalEl.classList.remove('hidden');
  modalEl.classList.add('flex');
  const target = focusSelector ? $(focusSelector, modalEl) : null;
  if (target) target.focus();
}

function closeModal(modalEl) {
  modalEl.classList.add('hidden');
  modalEl.classList.remove('flex');
}

/* ========================================================
   1. TAB SWITCHER — state disimpan di query URL (?tab=...)
   ======================================================== */
function getActiveTabFromUrl() {
  const tab = new URLSearchParams(window.location.search).get('tab');
  return VALID_TABS.includes(tab) ? tab : DEFAULT_TAB;
}

function setActiveTab(tab, { pushHistory = true } = {}) {
  if (!VALID_TABS.includes(tab)) tab = DEFAULT_TAB;

  $all('.tab-panel').forEach((panel) => {
    panel.classList.toggle('hidden', panel.dataset.tabPanel !== tab);
  });

  $all('.tab-btn').forEach((btn) => {
    const isActive = btn.dataset.tab === tab;
    btn.classList.toggle('bg-amber-700', isActive);
    btn.classList.toggle('text-white', isActive);
    btn.classList.toggle('bg-amber-100', !isActive);
    btn.classList.toggle('text-amber-900', !isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  const url = new URL(window.location.href);
  url.searchParams.set('tab', tab);
  if (pushHistory) {
    history.pushState({ tab }, '', url);
  } else {
    history.replaceState({ tab }, '', url);
  }
}

function initTabs() {
  $all('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => setActiveTab(btn.dataset.tab));
  });
  window.addEventListener('popstate', () => {
    setActiveTab(getActiveTabFromUrl(), { pushHistory: false });
  });
  setActiveTab(getActiveTabFromUrl(), { pushHistory: false });
}

/* ========================================================
   2. EXPENSE TRACKER
   ======================================================== */
let expenseState = {
  transactions: [],
  search: '',
  filterType: 'all',
  filterCategory: 'all',
  sortBy: 'newest',
  editingId: null,
  deletingId: null,
};

function loadExpenses() {
  try {
    const raw = localStorage.getItem(EXPENSE_STORAGE_KEY);
    expenseState.transactions = raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Gagal memuat data pengeluaran:', err);
    expenseState.transactions = [];
  }
}

function saveExpenses() {
  localStorage.setItem(EXPENSE_STORAGE_KEY, JSON.stringify(expenseState.transactions));
}

function addTransaction(data) {
  expenseState.transactions.push({ id: generateId(), ...data });
  saveExpenses();
}

function updateTransaction(id, updates) {
  const item = expenseState.transactions.find((t) => t.id === id);
  if (item) Object.assign(item, updates);
  saveExpenses();
}

function deleteTransaction(id) {
  expenseState.transactions = expenseState.transactions.filter((t) => t.id !== id);
  saveExpenses();
}

function getFilteredExpenses() {
  let list = [...expenseState.transactions];

  if (expenseState.search.trim()) {
    const q = expenseState.search.trim().toLowerCase();
    list = list.filter((t) => t.title.toLowerCase().includes(q));
  }
  if (expenseState.filterType !== 'all') {
    list = list.filter((t) => t.type === expenseState.filterType);
  }
  if (expenseState.filterCategory !== 'all') {
    list = list.filter((t) => t.category === expenseState.filterCategory);
  }

  switch (expenseState.sortBy) {
    case 'oldest': list.sort((a, b) => new Date(a.date) - new Date(b.date)); break;
    case 'amount-desc': list.sort((a, b) => b.amount - a.amount); break;
    case 'amount-asc': list.sort((a, b) => a.amount - b.amount); break;
    default: list.sort((a, b) => new Date(b.date) - new Date(a.date)); // newest
  }
  return list;
}

function renderExpenseSummary() {
  const income = expenseState.transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = expenseState.transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  $('#expense-total-income').textContent = formatRupiah(income);
  $('#expense-total-expense').textContent = formatRupiah(expense);
  $('#expense-total-balance').textContent = formatRupiah(income - expense);
}

function renderExpenseCategoryOptions() {
  const select = $('#expense-filter-category');
  const categories = [...new Set(expenseState.transactions.map((t) => t.category))];
  const current = expenseState.filterCategory;
  select.innerHTML = '<option value="all">Semua kategori</option>' +
    categories.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  if (categories.includes(current)) {
    select.value = current;
  } else {
    select.value = 'all';
    expenseState.filterCategory = 'all';
  }
}

function renderExpenseList() {
  const container = $('#expense-list');
  const items = getFilteredExpenses();

  if (expenseState.transactions.length === 0) {
    container.innerHTML = '<p class="text-center text-stone-600 py-8">Belum ada transaksi. Tambahkan transaksi pertama Anda.</p>';
    return;
  }
  if (items.length === 0) {
    container.innerHTML = '<p class="text-center text-stone-600 py-8">Tidak ada transaksi yang cocok.</p>';
    return;
  }

  container.innerHTML = '';
  items.forEach((t) => {
    const row = document.createElement('div');
    row.className = 'flex items-center justify-between gap-3 border-b border-amber-100 py-3 last:border-0';
    row.innerHTML = `
      <div class="min-w-0">
        <p class="font-medium text-stone-800 truncate">${escapeHtml(t.title)}</p>
        <p class="text-xs text-stone-600">${escapeHtml(t.category)} • ${new Date(t.date).toLocaleDateString('id-ID')}</p>
      </div>
      <div class="flex items-center gap-1 shrink-0">
        <span class="text-sm font-semibold mr-2 ${t.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}">
          ${t.type === 'income' ? '+' : '-'} ${formatRupiah(t.amount)}
        </span>
        <button type="button" data-action="edit" data-id="${t.id}"
                aria-label="Ubah transaksi ${escapeHtml(t.title)}"
                class="h-11 w-11 inline-flex items-center justify-center rounded-full text-stone-600 hover:bg-amber-100">
          <span aria-hidden="true">✎</span>
        </button>
        <button type="button" data-action="delete" data-id="${t.id}"
                aria-label="Hapus transaksi ${escapeHtml(t.title)}"
                class="h-11 w-11 inline-flex items-center justify-center rounded-full text-stone-600 hover:bg-rose-100">
          <span aria-hidden="true">🗑</span>
        </button>
      </div>`;
    container.appendChild(row);
  });
}

function renderExpense() {
  renderExpenseSummary();
  renderExpenseCategoryOptions();
  renderExpenseList();
}

function openExpenseEditModal(id) {
  const item = expenseState.transactions.find((t) => t.id === id);
  if (!item) return;
  expenseState.editingId = id;
  $('#expense-edit-title').value = item.title;
  $('#expense-edit-category').value = item.category;
  $('#expense-edit-amount').value = item.amount;
  $('#expense-edit-type').value = item.type;
  $('#expense-edit-date').value = item.date;
  openModal($('#expense-edit-modal'), '#expense-edit-title');
}

function closeExpenseEditModal() {
  expenseState.editingId = null;
  closeModal($('#expense-edit-modal'));
}

function openExpenseDeleteModal(id) {
  expenseState.deletingId = id;
  openModal($('#expense-delete-modal'), '#expense-delete-cancel');
}

function closeExpenseDeleteModal() {
  expenseState.deletingId = null;
  closeModal($('#expense-delete-modal'));
}

function initExpenseTracker() {
  loadExpenses();
  renderExpense();

  $('#expense-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = $('#expense-title').value.trim();
    const category = $('#expense-category').value.trim();
    const amount = parseFloat($('#expense-amount').value);
    const type = $('#expense-type').value;
    const date = $('#expense-date').value;

    if (!title || !category || !date) { showToast('Semua field wajib diisi.'); return; }
    if (isNaN(amount) || amount <= 0) { showToast('Jumlah harus angka lebih dari 0.'); return; }

    addTransaction({ title, category, amount, type, date });
    e.target.reset();
    renderExpense();
    showToast('Transaksi ditambahkan.');
  });

  $('#expense-search').addEventListener('input', (e) => {
    expenseState.search = e.target.value;
    renderExpenseList();
  });
  $('#expense-filter-type').addEventListener('change', (e) => {
    expenseState.filterType = e.target.value;
    renderExpenseList();
  });
  $('#expense-filter-category').addEventListener('change', (e) => {
    expenseState.filterCategory = e.target.value;
    renderExpenseList();
  });
  $('#expense-sort').addEventListener('change', (e) => {
    expenseState.sortBy = e.target.value;
    renderExpenseList();
  });

  $('#expense-list').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const { action, id } = btn.dataset;
    if (action === 'edit') openExpenseEditModal(id);
    if (action === 'delete') openExpenseDeleteModal(id);
  });

  $('#expense-edit-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = parseFloat($('#expense-edit-amount').value);
    if (isNaN(amount) || amount <= 0) { showToast('Jumlah harus angka lebih dari 0.'); return; }
    updateTransaction(expenseState.editingId, {
      title: $('#expense-edit-title').value.trim(),
      category: $('#expense-edit-category').value.trim(),
      amount,
      type: $('#expense-edit-type').value,
      date: $('#expense-edit-date').value,
    });
    closeExpenseEditModal();
    renderExpense();
    showToast('Transaksi diperbarui.');
  });
  $('#expense-edit-cancel').addEventListener('click', closeExpenseEditModal);

  $('#expense-delete-confirm').addEventListener('click', () => {
    deleteTransaction(expenseState.deletingId);
    closeExpenseDeleteModal();
    renderExpense();
    showToast('Transaksi dihapus.');
  });
  $('#expense-delete-cancel').addEventListener('click', closeExpenseDeleteModal);
}

/* ========================================================
   3. BOOKMARK MANAGER
   ======================================================== */
let bookmarkState = {
  items: [],
  search: '',
  sortBy: 'newest',
  editingId: null,
  deletingId: null,
};

function isValidUrl(value) {
  return /^https?:\/\/.+/i.test(value.trim());
}

function loadBookmarks() {
  try {
    const raw = localStorage.getItem(BOOKMARK_STORAGE_KEY);
    bookmarkState.items = raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Gagal memuat data bookmark:', err);
    bookmarkState.items = [];
  }
}

function saveBookmarks() {
  localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(bookmarkState.items));
}

function addBookmark(data) {
  bookmarkState.items.push({ id: generateId(), createdAt: Date.now(), ...data });
  saveBookmarks();
}

function updateBookmark(id, updates) {
  const item = bookmarkState.items.find((b) => b.id === id);
  if (item) Object.assign(item, updates);
  saveBookmarks();
}

function deleteBookmark(id) {
  bookmarkState.items = bookmarkState.items.filter((b) => b.id !== id);
  saveBookmarks();
}

function getFilteredBookmarks() {
  let list = [...bookmarkState.items];
  if (bookmarkState.search.trim()) {
    const q = bookmarkState.search.trim().toLowerCase();
    list = list.filter((b) =>
      b.name.toLowerCase().includes(q) ||
      b.url.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q));
  }
  switch (bookmarkState.sortBy) {
    case 'name-asc': list.sort((a, b) => a.name.localeCompare(b.name)); break;
    case 'name-desc': list.sort((a, b) => b.name.localeCompare(a.name)); break;
    default: list.sort((a, b) => b.createdAt - a.createdAt); // newest
  }
  return list;
}

function renderBookmarkList() {
  const container = $('#bookmark-list');
  const items = getFilteredBookmarks();

  if (bookmarkState.items.length === 0) {
    container.innerHTML = '<p class="col-span-full text-center text-stone-600 py-8">Belum ada bookmark tersimpan.</p>';
    return;
  }
  if (items.length === 0) {
    container.innerHTML = '<p class="col-span-full text-center text-stone-600 py-8">Tidak ada bookmark yang cocok.</p>';
    return;
  }

  container.innerHTML = '';
  items.forEach((b) => {
    const card = document.createElement('div');
    card.className = 'flex items-start justify-between gap-3 border-2 border-amber-100 bg-white rounded-2xl p-4';
    card.innerHTML = `
      <div class="min-w-0">
        <a href="${escapeHtml(b.url)}" target="_blank" rel="noopener noreferrer"
           class="font-medium text-amber-700 underline hover:text-amber-900 break-words">${escapeHtml(b.name)}</a>
        <p class="text-xs text-stone-600 truncate">${escapeHtml(b.url)}</p>
        <span class="inline-block mt-1 text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">${escapeHtml(b.category)}</span>
        ${b.note ? `<p class="text-sm text-stone-600 mt-1">${escapeHtml(b.note)}</p>` : ''}
      </div>
      <div class="flex items-center gap-1 shrink-0">
        <button type="button" data-action="edit" data-id="${b.id}"
                aria-label="Ubah bookmark ${escapeHtml(b.name)}"
                class="h-11 w-11 inline-flex items-center justify-center rounded-full text-stone-600 hover:bg-amber-100">
          <span aria-hidden="true">✎</span>
        </button>
        <button type="button" data-action="delete" data-id="${b.id}"
                aria-label="Hapus bookmark ${escapeHtml(b.name)}"
                class="h-11 w-11 inline-flex items-center justify-center rounded-full text-stone-600 hover:bg-rose-100">
          <span aria-hidden="true">🗑</span>
        </button>
      </div>`;
    container.appendChild(card);
  });
}

function openBookmarkEditModal(id) {
  const item = bookmarkState.items.find((b) => b.id === id);
  if (!item) return;
  bookmarkState.editingId = id;
  $('#bookmark-edit-name').value = item.name;
  $('#bookmark-edit-url').value = item.url;
  $('#bookmark-edit-category').value = item.category;
  $('#bookmark-edit-note').value = item.note || '';
  openModal($('#bookmark-edit-modal'), '#bookmark-edit-name');
}

function closeBookmarkEditModal() {
  bookmarkState.editingId = null;
  closeModal($('#bookmark-edit-modal'));
}

function openBookmarkDeleteModal(id) {
  bookmarkState.deletingId = id;
  openModal($('#bookmark-delete-modal'), '#bookmark-delete-cancel');
}

function closeBookmarkDeleteModal() {
  bookmarkState.deletingId = null;
  closeModal($('#bookmark-delete-modal'));
}

function initBookmarkManager() {
  loadBookmarks();
  renderBookmarkList();

  $('#bookmark-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#bookmark-name').value.trim();
    const url = $('#bookmark-url').value.trim();
    const category = $('#bookmark-category').value.trim();
    const note = $('#bookmark-note').value.trim();

    if (!name || !url || !category) { showToast('Nama, URL, dan kategori wajib diisi.'); return; }
    if (!isValidUrl(url)) { showToast('URL harus diawali http:// atau https://'); return; }

    addBookmark({ name, url, category, note });
    e.target.reset();
    renderBookmarkList();
    showToast('Bookmark ditambahkan.');
  });

  $('#bookmark-search').addEventListener('input', (e) => {
    bookmarkState.search = e.target.value;
    renderBookmarkList();
  });
  $('#bookmark-sort').addEventListener('change', (e) => {
    bookmarkState.sortBy = e.target.value;
    renderBookmarkList();
  });

  $('#bookmark-list').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const { action, id } = btn.dataset;
    if (action === 'edit') openBookmarkEditModal(id);
    if (action === 'delete') openBookmarkDeleteModal(id);
  });

  $('#bookmark-edit-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const url = $('#bookmark-edit-url').value.trim();
    if (!isValidUrl(url)) { showToast('URL harus diawali http:// atau https://'); return; }
    updateBookmark(bookmarkState.editingId, {
      name: $('#bookmark-edit-name').value.trim(),
      url,
      category: $('#bookmark-edit-category').value.trim(),
      note: $('#bookmark-edit-note').value.trim(),
    });
    closeBookmarkEditModal();
    renderBookmarkList();
    showToast('Bookmark diperbarui.');
  });
  $('#bookmark-edit-cancel').addEventListener('click', closeBookmarkEditModal);

  $('#bookmark-delete-confirm').addEventListener('click', () => {
    deleteBookmark(bookmarkState.deletingId);
    closeBookmarkDeleteModal();
    renderBookmarkList();
    showToast('Bookmark dihapus.');
  });
  $('#bookmark-delete-cancel').addEventListener('click', closeBookmarkDeleteModal);
}

/* ========================================================
   4. QUIZ APP
   ======================================================== */
let quizState = { currentIndex: 0, score: 0, answered: false, finished: false };

function loadQuizHighScore() {
  return parseInt(localStorage.getItem(QUIZ_HIGH_SCORE_KEY) || '0', 10);
}

function saveQuizHighScore(score) {
  if (score > loadQuizHighScore()) localStorage.setItem(QUIZ_HIGH_SCORE_KEY, String(score));
}

function resetQuizState() {
  quizState = { currentIndex: 0, score: 0, answered: false, finished: false };
}

function renderQuizStartScreen() {
  $('#quiz-start-screen').classList.remove('hidden');
  $('#quiz-question-screen').classList.add('hidden');
  $('#quiz-result-screen').classList.add('hidden');
  $('#quiz-high-score-start').textContent = loadQuizHighScore();
}

function renderQuizQuestion() {
  const q = QUIZ_QUESTIONS[quizState.currentIndex];
  $('#quiz-progress').textContent = `Soal ${quizState.currentIndex + 1} dari ${QUIZ_QUESTIONS.length}`;
  $('#quiz-score-live').textContent = `Skor: ${quizState.score}`;
  $('#quiz-question-text').textContent = q.question;

  const optionsContainer = $('#quiz-options');
  optionsContainer.innerHTML = '';
  q.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.index = idx;
    btn.className = 'quiz-option w-full text-left border-2 border-amber-200 rounded-xl px-4 py-3 text-stone-800 hover:border-amber-500 transition';
    btn.textContent = opt;
    optionsContainer.appendChild(btn);
  });

  $('#quiz-feedback').textContent = '';
  $('#quiz-next-btn').classList.add('hidden');
  quizState.answered = false;
}

function handleQuizAnswer(selectedIndex) {
  if (quizState.answered) return;
  quizState.answered = true;

  const q = QUIZ_QUESTIONS[quizState.currentIndex];
  const buttons = $all('.quiz-option');
  buttons.forEach((btn) => { btn.disabled = true; });

  const feedback = $('#quiz-feedback');
  if (selectedIndex === q.answer) {
    quizState.score += 1;
    buttons[selectedIndex].classList.add('border-emerald-600', 'bg-emerald-50');
    feedback.textContent = 'Benar!';
    feedback.className = 'text-emerald-700 font-medium mt-2';
  } else {
    buttons[selectedIndex].classList.add('border-rose-600', 'bg-rose-50');
    buttons[q.answer].classList.add('border-emerald-600', 'bg-emerald-50');
    feedback.textContent = 'Kurang tepat.';
    feedback.className = 'text-rose-700 font-medium mt-2';
  }

  $('#quiz-score-live').textContent = `Skor: ${quizState.score}`;
  $('#quiz-next-btn').classList.remove('hidden');
}

function goToNextQuizQuestion() {
  if (quizState.currentIndex < QUIZ_QUESTIONS.length - 1) {
    quizState.currentIndex += 1;
    renderQuizQuestion();
  } else {
    finishQuiz();
  }
}

function finishQuiz() {
  quizState.finished = true;
  saveQuizHighScore(quizState.score);
  $('#quiz-question-screen').classList.add('hidden');
  $('#quiz-result-screen').classList.remove('hidden');
  $('#quiz-final-score').textContent = `${quizState.score} / ${QUIZ_QUESTIONS.length}`;
  $('#quiz-high-score-result').textContent = loadQuizHighScore();
}

function initQuizApp() {
  renderQuizStartScreen();

  $('#quiz-start-btn').addEventListener('click', () => {
    resetQuizState();
    $('#quiz-start-screen').classList.add('hidden');
    $('#quiz-result-screen').classList.add('hidden');
    $('#quiz-question-screen').classList.remove('hidden');
    renderQuizQuestion();
  });

  $('#quiz-options').addEventListener('click', (e) => {
    const btn = e.target.closest('.quiz-option');
    if (!btn) return;
    handleQuizAnswer(parseInt(btn.dataset.index, 10));
  });

  $('#quiz-next-btn').addEventListener('click', goToNextQuizQuestion);

  $('#quiz-restart-btn').addEventListener('click', () => {
    resetQuizState();
    $('#quiz-result-screen').classList.add('hidden');
    $('#quiz-question-screen').classList.remove('hidden');
    renderQuizQuestion();
  });
}

/* ========================================================
   5. INISIALISASI APLIKASI
   ======================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initExpenseTracker();
  initBookmarkManager();
  initQuizApp();
});