const fs = require('fs');
const path = require('path');
const acorn = require('acorn');

const inputFile = './public/js/catalog.js'; // Путь к исходному файлу
const outputDir = './public/js/output'; // Папка для сохранения частей
const maxStatementsPerFile = 5; // Кол-во синтаксических блоков на файл

// Чтение исходного кода
const code = fs.readFileSync(inputFile, 'utf8');

// Разбор в AST
const ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'script', locations: true });

// Получение блоков верхнего уровня
const statements = ast.body;

// Очистка выходной папки
if (fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true });
fs.mkdirSync(outputDir);

// Разделение на файлы по блокам
let fileCount = 0;
let buffer = '';
let currentCount = 0;
let currentPos = 0;

for (let i = 0; i < statements.length; i++) {
  const node = statements[i];
  const start = node.start;
  const end = node.end;

  const snippet = code.slice(start, end);

  buffer += snippet + '\n\n';
  currentCount++;

  if (currentCount >= maxStatementsPerFile || i === statements.length - 1) {
    fileCount++;
    const filename = `part${fileCount}.js`;
    fs.writeFileSync(path.join(outputDir, filename), buffer);
    buffer = '';
    currentCount = 0;
  }
}

// Генерация HTML-файла
let htmlContent = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Split JS Syntax-Aware</title></head>
<body>\n`;

for (let i = 1; i <= fileCount; i++) {
  htmlContent += `  <script src="./output/part${i}.js"></script>\n`;
}

htmlContent += `</body>\n</html>`;

fs.writeFileSync('index.html', htmlContent);

console.log(`Создано ${fileCount} частей с учётом синтаксиса.`);
