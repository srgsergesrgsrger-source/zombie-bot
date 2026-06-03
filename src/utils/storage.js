/**
 * storage.js — простое JSON-хранилище для персистентных настроек бота.
 * Сохраняет данные в data/settings.json, чтобы настройки не терялись при перезапуске.
 */

const fs   = require('fs');
const path = require('path');

// Путь к файлу с данными
const DATA_DIR  = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'settings.json');

/**
 * Инициализирует хранилище: создаёт директорию и файл, если их нет.
 * @returns {object} текущее состояние хранилища
 */
function init() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({}, null, 2), 'utf8');
  }
  return load();
}

/**
 * Загружает все данные из файла.
 * @returns {object}
 */
function load() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[Storage] Ошибка чтения файла настроек:', err.message);
    return {};
  }
}

/**
 * Сохраняет объект данных в файл.
 * @param {object} data
 */
function save(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[Storage] Ошибка записи файла настроек:', err.message);
  }
}

/**
 * Получает значение по ключу.
 * @param {string} key
 * @param {*} defaultValue — значение по умолчанию, если ключ не найден
 * @returns {*}
 */
function get(key, defaultValue = null) {
  const data = load();
  return key in data ? data[key] : defaultValue;
}

/**
 * Устанавливает значение по ключу и сохраняет файл.
 * @param {string} key
 * @param {*} value
 */
function set(key, value) {
  const data = load();
  data[key] = value;
  save(data);
}

/**
 * Удаляет ключ из хранилища.
 * @param {string} key
 */
function del(key) {
  const data = load();
  delete data[key];
  save(data);
}

module.exports = { init, get, set, del, load };
