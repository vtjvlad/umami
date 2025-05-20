async function renderBodyToTag(filePath, targetTagId) {
    try {
        // Проверяем, существует ли целевой элемент
        const targetElement = document.getElementById(targetTagId);
        if (!targetElement) {
            throw new Error(`Элемент с id "${targetTagId}" не найден`);
        }

        // Загружаем HTML файл
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Не удалось загрузить файл: ${response.statusText}`);
        }
        
        // Получаем текст HTML
        const htmlText = await response.text();
        
        // Парсим HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
        
        // Получаем содержимое body
        const bodyContent = doc.body.innerHTML;
        
        // Добавляем содержимое в целевой элемент
        targetElement.innerHTML += bodyContent;
        
        console.log(`Содержимое body успешно добавлено в элемент с id "${targetTagId}"`);
    } catch (error) {
        console.error('Ошибка при рендере содержимого:', error);
    }
}

// Пример использования:
renderBodyToTag('../sb.html', 'targetForRenderingSidebar');
