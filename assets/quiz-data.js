/**
 * quiz-data.js — bank soal kuis (array of object, tanpa logika)
 * answer = indeks jawaban benar pada array options (mulai dari 0)
 */
const QUIZ_QUESTIONS = [
  { question: 'Tag HTML apa yang digunakan untuk membuat tautan?', options: ['<link>', '<a>', '<href>', '<nav>'], answer: 1 },
  { question: 'Properti CSS untuk mengubah warna teks adalah?', options: ['background-color', 'text-color', 'color', 'font-color'], answer: 2 },
  { question: 'Cara mendeklarasikan variabel yang tidak bisa diubah nilainya di JS?', options: ['var', 'let', 'const', 'static'], answer: 2 },
  { question: 'Method array untuk menambah elemen di akhir array adalah?', options: ['push()', 'pop()', 'shift()', 'unshift()'], answer: 0 },
  { question: 'Objek browser untuk menyimpan data permanen di sisi klien adalah?', options: ['sessionStorage', 'cookie', 'localStorage', 'cache'], answer: 2 },
  { question: 'Selector untuk memilih elemen pertama yang cocok di JS adalah?', options: ['querySelectorAll', 'getElementById', 'querySelector', 'getElementsByClass'], answer: 2 },
];