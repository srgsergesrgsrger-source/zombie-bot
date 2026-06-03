/**
 * logger.js — простой логгер с временными метками и уровнями.
 * Форматирует вывод в консоль с цветами для удобного чтения.
 */

// ANSI escape-коды для цветов в терминале
const COLORS = {
  reset:  '\x1b[0m',
  gray:   '\x1b[90m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  cyan:   '\x1b[36m',
  blue:   '\x1b[34m',
};

/**
 * Форматирует текущее время в строку HH:MM:SS.
 * @returns {string}
 */
function timestamp() {
  return new Date().toLocaleTimeString('ru-RU', { hour12: false });
}

/**
 * Базовая функция логирования.
 * @param {string} level — уровень (INFO, WARN, ERROR, etc.)
 * @param {string} color — ANSI-код цвета
 * @param {...any} args — аргументы для вывода
 */
function log(level, color, ...args) {
  const ts  = `${COLORS.gray}[${timestamp()}]${COLORS.reset}`;
  const lvl = `${color}[${level}]${COLORS.reset}`;
  console.log(ts, lvl, ...args);
}

module.exports = {
  info:    (...args) => log('INFO',    COLORS.green,  ...args),
  warn:    (...args) => log('WARN',    COLORS.yellow, ...args),
  error:   (...args) => log('ERROR',   COLORS.red,    ...args),
  debug:   (...args) => log('DEBUG',   COLORS.cyan,   ...args),
  success: (...args) => log('SUCCESS', COLORS.blue,   ...args),
};
