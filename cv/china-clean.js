function cleanTitle(title) {
    // Удаляем китайские символы (Unicode: \u4E00-\u9FFF), эмодзи (Unicode: \uD800-\uDFFF) и другие ненужные символы
    // Сохраняем латинские буквы, цифры, пробелы, дефис и апостроф
    return title.replace(/[^\w\s-'’]/g, '').trim();
}

function processJson(jsonData) {
    // Проверяем, является ли jsonData массивом
    if (!Array.isArray(jsonData)) {
        throw new Error('Входные данные должны быть массивом объектов');
    }

    return jsonData.map(item => {
        // Проверяем наличие необходимых полей
        if (!item.title || !item.imgSrc) {
            console.warn('Пропущено поле title или imgsSrc в объекте:', item);
            return item; // Возвращаем объект без изменений, если поля отсутствуют
        }
        return {
            ...item, // Сохраняем все поля объекта
            title: cleanTitle(item.title) // Обрабатываем только title
        };
    });
}

// Пример использования
const fs = require('fs');

fs.readFile('./china_extracted.json', 'utf8', (err, data) => {
    if (err) {
        console.error('Ошибка чтения файла:', err);
        return;
    }

    try {
        const jsonData = JSON.parse(data);
        const cleanedData = processJson(jsonData);

        // Сохранение результата в новый файл
        fs.writeFile('output.json', JSON.stringify(cleanedData, null, 2), 'utf8', err => {
            if (err) {
                console.error('Ошибка записи файла:', err);
                return;
            }
            console.log('Файл успешно обработан и сохранен как output.json');
        });
    } catch (err) {
        console.error('Ошибка парсинга JSON или обработки данных:', err);
    }
});
