const fs = require('fs');

// Функция для добавления порядковых номеров к объектам
function addSequentialNumbers(items) {
    return items.map((item, index) => ({
        ...item,
        rownum: index + 1  // Нумерация начинается с 1
    }));
}

// Чтение файла
fs.readFile('china-almost.json', 'utf8', (err, data) => {
    if (err) {
        console.error('Ошибка чтения файла:', err);
        return;
    }

    try {
        const jsonData = JSON.parse(data);
        const numberedData = addSequentialNumbers(jsonData);

        // Сохранение результата
        fs.writeFile('china-numbered.json', JSON.stringify(numberedData, null, 2), 'utf8', err => {
            if (err) {
                console.error('Ошибка записи файла:', err);
                return;
            }
            console.log('Файл успешно обработан и сохранен как china-numbered.json');
            console.log(`Добавлена нумерация для ${numberedData.length} объектов`);
        });
    } catch (err) {
        console.error('Ошибка парсинга JSON или обработки данных:', err);
    }
}); 