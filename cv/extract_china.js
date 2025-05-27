const fs = require('fs');

// Читаем файл
const data = JSON.parse(fs.readFileSync('./china.json', 'utf8'));

// Если файл — массив объектов:
const allItems = Array.isArray(data)
  ? data.flatMap(obj => (obj.result && obj.result.items) ? obj.result.items : [])
  : (data.result && data.result.items ? data.result.items : []);

const products = allItems.map(item => ({
  title: item.title,
  imgSrc: item.imgsSrc || item.imgs || []
}));

fs.writeFileSync('./china_extracted.json', JSON.stringify(products, null, 2), 'utf8');
console.log('Done! Результат сохранён в china_extracted.json'); 