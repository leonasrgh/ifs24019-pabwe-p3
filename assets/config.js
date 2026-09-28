/**
 * config.js — konstanta aplikasi (tanpa logika)
 * Dimuat SEBELUM script.js.
 */

// Tab yang valid untuk query URL (?tab=...)
const VALID_TABS = ['expense', 'bookmark', 'quiz'];
const DEFAULT_TAB = 'expense';

// Key localStorage dipisah per fitur agar data tidak saling menimpa
const EXPENSE_STORAGE_KEY = 'pabwe_p3_expense_transactions';
const BOOKMARK_STORAGE_KEY = 'pabwe_p3_bookmark_items';
const QUIZ_HIGH_SCORE_KEY = 'pabwe_p3_quiz_high_score';