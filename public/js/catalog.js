// Глобальные переменные для управления состоянием каталога
let currentPage = 1;      // Текущая страница
let totalPages = 1;       // Общее количество страниц
let isLoading = false;    // Флаг загрузки данных
let currentFilters = {    // Текущие активные фильтры
    search: '',           // Поисковый запрос
    minPrice: '',        // Минимальная цена
    maxPrice: '',        // Максимальная цена
    color: '',           // Выбранный цвет
    keywords: []         // Выбранные ключевые слова
};

/**
 * Показывает индикатор загрузки и скрывает кнопку "Загрузить еще"
 */
function showLoading() {
    document.getElementById('loading-spinner').style.display = 'block';
    document.getElementById('load-more').style.display = 'none';
    isLoading = true;
}

/**
 * Скрывает индикатор загрузки и показывает кнопку "Загрузить еще"
 */
function hideLoading() {
    document.getElementById('loading-spinner').style.display = 'none';
    document.getElementById('load-more').style.display = 'block';
    isLoading = false;
}

/**
 * Создает HTML-разметку карточки товара
 * @param {Object} product - Объект с данными товара
 * @returns {string} HTML-разметка карточки товара
 */
function createProductCard(product) {
    // Получаем URL изображения из различных возможных источников
    const imageUrl = product.imageData?.imgMain || 
                   product.imageData?.portraitURL || 
                   product.imageData?.squarishURL || 
                   'https://via.placeholder.com/300x200';
    
    // Получаем цену товара
    const price = product.price?.self?.UAH?.currentPrice || 
                product.price?.origin?.currentPrice || 
                '0';
    
    // Получаем информацию о цвете
    const colorHex = product.info?.color?.hex || '#ffffff';
    const colorLabel = product.info?.color?.labelColor || '';

    // Формируем HTML-разметку карточки
    return `
        <div class="col-md-4 col-sm-6 mb-4">
            <div class="product-card">
                <img src="${imageUrl}" 
                     class="product-image" 
                     alt="${product.info?.name || 'Товар'}">
                <div class="card-body">
                    <h5 class="card-title">${product.info?.name || 'Без названия'}</h5>
                    ${product.info?.subtitle ? `
                        <p class="card-text text-muted">${product.info.subtitle}</p>
                    ` : ''}
                    ${product.info?.discription ? `
                        <p class="card-text">${product.info.discription}</p>
                    ` : ''}
                    ${colorLabel ? `
                        <p class="card-text">
                            <span class="color-dot" style="background-color: ${colorHex}"></span>
                            ${colorLabel}
                        </p>
                    ` : ''}
                    <p class="price-tag mb-3">
                        ${price} ₴
                    </p>
                    <button class="btn btn-primary w-100">
                        <i class="fas fa-shopping-cart me-2"></i>
                        Подробнее
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Обновляет элементы пагинации
 * @param {number} currentPage - Текущая страница
 * @param {number} totalPages - Общее количество страниц
 */
function updatePagination(currentPage, totalPages) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    // Добавляем кнопку "Предыдущая"
    pagination.innerHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage - 1}">Предыдущая</a>
        </li>
    `;

    // Добавляем номера страниц
    for (let i = 1; i <= totalPages; i++) {
        // Показываем первую, последнюю страницу и страницы вокруг текущей
        if (
            i === 1 || 
            i === totalPages || 
            (i >= currentPage - 2 && i <= currentPage + 2)
        ) {
            pagination.innerHTML += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        } else if (
            i === currentPage - 3 || 
            i === currentPage + 3
        ) {
            // Добавляем многоточие для пропущенных страниц
            pagination.innerHTML += `
                <li class="page-item disabled">
                    <span class="page-link">...</span>
                </li>
            `;
        }
    }

    // Добавляем кнопку "Следующая"
    pagination.innerHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage + 1}">Следующая</a>
        </li>
    `;

    // Добавляем обработчики кликов по страницам
    pagination.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = parseInt(e.target.dataset.page);
            if (page && page !== currentPage) {
                loadProducts(page);
            }
        });
    });
}

/**
 * Обновляет список доступных цветов в фильтре
 * @param {Array} colors - Массив доступных цветов
 */
function updateColorFilters(colors) {
    const container = document.getElementById('color-filters');
    const currentColor = document.querySelector('input[name="color"]:checked')?.value || '';
    
    // Добавляем опцию "Все цвета"
    container.innerHTML = `
        <div class="color-option">
            <input type="radio" name="color" id="color-all" value="" ${!currentColor ? 'checked' : ''}>
            <label for="color-all">Все цвета</label>
        </div>
    `;
    
    // Добавляем опции для каждого цвета
    colors.forEach(color => {
        container.innerHTML += `
            <div class="color-option">
                <input type="radio" name="color" id="color-${color}" value="${color}" ${color === currentColor ? 'checked' : ''}>
                <label for="color-${color}">${color}</label>
            </div>
        `;
    });
}

/**
 * Формирует строку запроса с параметрами фильтрации
 * @returns {string} Строка запроса
 */
function buildQueryString() {
    const params = new URLSearchParams();
    
    // Добавляем базовые фильтры
    if (currentFilters.search) params.append('search', currentFilters.search);
    if (currentFilters.minPrice) params.append('minPrice', currentFilters.minPrice);
    if (currentFilters.maxPrice) params.append('maxPrice', currentFilters.maxPrice);
    if (currentFilters.color) params.append('color', currentFilters.color);
    
    // Добавляем выбранные ключевые слова
    if (currentFilters.keywords.length > 0) {
        currentFilters.keywords.forEach(keyword => {
            params.append('keywords', keyword);
        });
    }
    
    return params.toString();
}

/**
 * Загружает товары с сервера
 * @param {number} page - Номер страницы для загрузки
 */
async function loadProducts(page = 1) {
    if (isLoading) return;
    
    showLoading();
    try {
        const queryString = buildQueryString();
        console.log('Loading products with query:', queryString);
        
        // Запрашиваем данные с сервера
        const response = await fetch(`/api/products?page=${page}&limit=12&${queryString}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Received data:', data);
        
        const container = document.getElementById('products-container');
        if (page === 1) {
            container.innerHTML = '';
        }
        
        // Обрабатываем случай, когда товары не найдены
        if (!data.products || data.products.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center">
                    <p class="text-muted">Товары не найдены</p>
                </div>
            `;
            document.getElementById('load-more').style.display = 'none';
            document.getElementById('pagination').style.display = 'none';
        } else {
            // Отображаем найденные товары
            data.products.forEach(product => {
                container.innerHTML += createProductCard(product);
            });

            currentPage = data.pagination.currentPage;
            totalPages = data.pagination.totalPages;

            updatePagination(currentPage, totalPages);
            
            // Обновляем фильтр цветов только для первой страницы
            if (page === 1 && data.filters?.colors) {
                updateColorFilters(data.filters.colors);
            }
            
            // Показываем/скрываем кнопку "Загрузить еще"
            document.getElementById('load-more').style.display = 
                currentPage < totalPages ? 'block' : 'none';
            document.getElementById('pagination').style.display = 'block';
        }

    } catch (error) {
        console.error('Error loading products:', error);
        // Показываем сообщение об ошибке
        document.getElementById('products-container').innerHTML = `
            <div class="col-12 text-center">
                <p class="text-danger">Ошибка загрузки товаров. Пожалуйста, попробуйте позже.</p>
                <button class="btn btn-primary mt-3" onclick="loadProducts(1)">Попробовать снова</button>
            </div>
        `;
        document.getElementById('load-more').style.display = 'none';
        document.getElementById('pagination').style.display = 'none';
    } finally {
        hideLoading();
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Загружаем первую страницу товаров
    loadProducts(1);
    
    // Обработчик кнопки "Загрузить еще"
    document.getElementById('load-more').addEventListener('click', () => {
        if (!isLoading) {
            loadProducts(currentPage + 1);
        }
    });

    // Обработчик отправки формы фильтров
    document.getElementById('filter-form').addEventListener('submit', (e) => {
        e.preventDefault();
        if (isLoading) return;
        
        // Собираем значения фильтров
        currentFilters = {
            search: document.getElementById('search').value.trim(),
            minPrice: document.getElementById('minPrice').value.trim(),
            maxPrice: document.getElementById('maxPrice').value.trim(),
            color: document.querySelector('input[name="color"]:checked')?.value || '',
            keywords: Array.from(document.querySelectorAll('input[name="keywords"]:checked')).map(input => input.value)
        };

        // Сбрасываем страницу на первую при применении фильтров
        currentPage = 1;
        loadProducts(1);
    });

    // Обработчик сброса фильтров
    document.getElementById('reset-filters').addEventListener('click', () => {
        if (isLoading) return;
        
        // Сбрасываем форму
        document.getElementById('filter-form').reset();
        
        // Сбрасываем текущие фильтры
        currentFilters = {
            search: '',
            minPrice: '',
            maxPrice: '',
            color: '',
            keywords: []
        };

        // Сбрасываем страницу на первую
        currentPage = 1;
        loadProducts(1);
    });

    // Добавляем обработчики для чекбоксов ключевых слов
    document.querySelectorAll('input[name="keywords"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            // Обновляем список выбранных ключевых слов
            currentFilters.keywords = Array.from(document.querySelectorAll('input[name="keywords"]:checked'))
                .map(input => input.value);
            
            // Перезагружаем товары с новыми фильтрами
            currentPage = 1;
            loadProducts(1);
        });
    });
}); 