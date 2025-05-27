function cleanTitle(title) {
    // Список брендов с альтернативными написаниями и сокращениями


    const brands = [
        'Louis Vuitton', 'Armani', 'Dior', 'Prada', 'Dolce & Gabbana', 'Fendi', 'Berlut',
        'Brunello Cucinelli', 'Ermenegildo Zegna', 'Zegna', 'Santoni', 
        'Tod’s', 'Bottega Veneta', 'Balenciaga', 'Gucci', 'Versace', 
        'Hermès', 'Alexander McQueen', 'Valentino', 'Philipp Plein', 'BV',
        'Amiri', 'Off-White', 'Boss', 'BOOS', 'P-P', 'PP', 'Lv','LV', 'Salvatore Ferragamo', 'Ferragamo', 'LVLV',
        'VERACE', 'PHILIPP PIEIN', 'Brunello Cucinell', 'HK', 'G logo', 'HERMES', 'DGdg', 'D&G',
        'HERMES HERMES', 'CHANEL', 'Ferraga', 'HER MES', 'G I V E N C H Y', 'GIVENCHY', 'GIVENCHY PARFUMS',
        'HERME', 'HERMESTPR', 'DG', 'Burberry', 'HERME Bouncing', 'BURBERRY'
    ];
        

    // const brands = [
    //     { canonical: 'Louis Vuitton', variants: ['Louis Vuitton', 'LV', 'LouisVuitton'] },
    //     { canonical: 'Dior', variants: ['Dior', 'Christian Dior', 'ChristianDior'] },
    //     { canonical: 'Prada', variants: ['Prada', 'Prada Milano', 'PradaMilan'] },
    //     { canonical: 'Dolce & Gabbana', variants: ['Dolce & Gabbana', 'Dolce Gabbana', 'D&G', 'DolceGabbana'] },
    //     { canonical: 'Fendi', variants: ['Fendi', 'Fendi Roma', 'FendiRoma'] },
    //     { canonical: 'Brunello Cucinelli', variants: ['Brunello Cucinelli', 'Cucinelli', 'BrunelloCucinelli'] },
    //     { canonical: 'Ermenegildo Zegna', variants: ['Ermenegildo Zegna', 'Zegna', 'ErmenegildoZegna', 'EZegna'] },
    //     { canonical: 'Santoni', variants: ['Santoni', 'Santoni Shoes'] },
    //     { canonical: 'Tod's', variants: ['Tod's', 'Tods', 'Tod s', 'Tod'] },
    //     { canonical: 'Bottega Veneta', variants: ['Bottega Veneta', 'Bottega', 'BottegaVeneta', 'BV'] },
    //     { canonical: 'Balenciaga', variants: ['Balenciaga', 'Balenci'] },
    //     { canonical: 'Gucci', variants: ['Gucci', 'Gucci Italy'] },
    //     { canonical: 'Versace', variants: ['Versace', 'Gianni Versace', 'Versace Italy'] },
    //     { canonical: 'Hermès', variants: ['Hermès', 'Hermes', 'Hermes Paris'] },
    //     { canonical: 'Alexander McQueen', variants: ['Alexander McQueen', 'McQueen', 'AlexanderMcQueen'] },
    //     { canonical: 'Valentino', variants: ['Valentino', 'Valentino Garavani', 'ValentinoGaravani'] },
    //     { canonical: 'Philipp Plein', variants: ['Philipp Plein', 'Plein', 'PhilippPlein'] },
    //     { canonical: 'Amiri', variants: ['Amiri', 'Amiri LA'] },
    //     { canonical: 'Off-White', variants: ['Off-White', 'Off White', 'OffWhite'] },
    //     { canonical: 'Boss', variants: ['Boss', 'BOSS']}
    //     ];
    
    // Приводим заголовок к нижнему регистру для упрощения поиска
    const lowerTitle = title.toLowerCase();
    
    // Ищем первый подходящий бренд
    for (const brand of brands) {
        if (lowerTitle.includes(brand.toLowerCase())) {
            return brand; // Возвращаем бренд в оригинальном регистре
        }
    }
    
    // Если бренд не найден, возвращаем очищенную строку (только латинские буквы)
    return title.replace(/[^\w\s]/g, '').trim().replace(/\s+/g, ' ');
}

function countUniqueTitles(items) {
    const titleCount = {};
    items.forEach(item => {
        if (item.title) {
            titleCount[item.title] = (titleCount[item.title] || 0) + 1;
        }
    });
    return titleCount;
}

function processJson(jsonData) {
    // Проверяем, является ли jsonData массивом
    if (!Array.isArray(jsonData)) {
        throw new Error('Входные данные должны быть массивом объектов');
    }

    const processedItems = jsonData.map(item => {
        // Проверяем наличие поля title
        if (!item.title) {
            console.warn('Пропущено поле title в объекте:', item);
            return item;
        }
        return {
            ...item, // Сохраняем все поля объекта, включая imgsSrc
            title: cleanTitle(item.title) // Обрабатываем только title
        };
    });

    // Статистика
    console.log('=== Статистика обработки ===');
    console.log(`Общее количество объектов: ${processedItems.length}`);

    // Подсчет уникальных тайтлов
    const titleCount = countUniqueTitles(processedItems);
    const brandTitles = {};
    const brands = ['Louis Vuitton', 'Armani', 'Dior', 'Prada', 'Dolce & Gabbana', 'Fendi', 'Berlut',
        'Brunello Cucinelli', 'Ermenegildo Zegna', 'Zegna', 'Santoni', 
        'Tod’s', 'Bottega Veneta', 'Balenciaga', 'Gucci', 'Versace', 
        'Hermès', 'Alexander McQueen', 'Valentino', 'Philipp Plein', 'BV',
        'Amiri', 'Off-White', 'Boss', 'BOOS', 'P-P', 'PP', 'Lv','LV', 'Salvatore Ferragamo', 'Ferragamo', 'LVLV',
        'VERACE', 'PHILIPP PIEIN', 'Brunello Cucinell', 'HK', 'G logo', 'HERMES', 'DGdg', 'D&G',
        'HERMES HERMES', 'CHANEL', 'Ferraga', 'HER MES', 'G I V E N C H Y', 'GIVENCHY', 'GIVENCHY PARFUMS',
        'HERME', 'HERMESTPR', 'DG', 'Burberry', 'HERME Bouncing', 'BURBERRY'];

    // Считаем только тайтлы, которые содержат известные бренды
    let unnamedCount = 0;
    for (const [title, count] of Object.entries(titleCount)) {
        const isBrandTitle = brands.some(brand => title.toLowerCase().includes(brand.toLowerCase()));
        if (isBrandTitle) {
            brandTitles[title] = count;
        } else {
            unnamedCount++;
        }
    }

    console.log('\nУникальные тайтлы с брендами:');
    for (const [title, count] of Object.entries(brandTitles)) {
        console.log(`${title} (${count})`);
    }

    console.log(`\nКоличество "не названных" объектов: ${unnamedCount}`);

    return processedItems;
}

// Чтение и запись файла
const fs = require('fs');

fs.readFile('output.json', 'utf8', (err, data) => {
    if (err) {
        console.error('Ошибка чтения файла:', err);
        return;
    }

    try {
        const jsonData = JSON.parse(data);
        const cleanedData = processJson(jsonData);

        // Сохранение результата
        fs.writeFile('china-almost.json', JSON.stringify(cleanedData, null, 2), 'utf8', err => {
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
