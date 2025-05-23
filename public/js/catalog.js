// Глобальные переменные для управления состоянием каталога

    let hasMore = true;
let currentPage = 1;      // Текущая страница
let totalPages = 1;       // Общее количество страниц
let isLoading = false;    // Флаг загрузки данных
let priceRange = {        // Диапазон цен
    min: 0,
    max: 100000
};
let currentFilters = {    // Текущие активные фильтры
    search: '',           // Поисковый запрос
    minPrice: '',        // Минимальная цена
    maxPrice: '',        // Максимальная цена
    color: '',           // Выбранный цвет
    keywords: [],        // Выбранные ключевые слова
    sort: 'popular'      // Сортировка (по умолчанию по популярности)
};

/**
 * Показывает индикатор загрузки и скрывает кнопку "Загрузить еще"
 */
function showLoading() {
    document.getElementById('loading-spinner').style.display = 'flex';
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
 * Создает HTML-разметку карточки товара в премиум дизайне
 * @param {Object} product - Объект с данными товара
 * @returns {string} HTML-разметка карточки товара
 */
function createProductCard(product) {
    // Получаем URL изображения из различных возможных источников
    const imageUrl = product.imageData?.portraitURL || 
                   product.imageData?.squarishURL || 
                   'https://via.placeholder.com/300x400';
    
    // Получаем цену товара
    const price = product.price?.self?.selfUAH?.current20 || 
                '0';
                
    // Получаем скидку и оригинальную цену, если есть
    const hasDiscount = product.price?.self?.selfUAH?.current20 < product.price?.self?.selfUAH?.initial20;
    const originalPrice = product.price?.self?.selfUAH?.initial20 || null;
    const discountPercent = hasDiscount ? 
        Math.round(100 - (product.price.self.selfUAH.current20 / product.price.self.selfUAH.initial20 * 100)) : null;
    
    // Получаем информацию о цвете
    const colorHex = `#${product.info?.color?.hex}` || '#ffffff';
    const colorLabel = product.info?.color?.labelColor || '';
    
    // Проверяем, является ли товар новинкой по наличию поля isNewUntil
    const isNew = !!product.someAdditionalData?.isNewUntil;
    
    // Получаем категорию
    // const category = product.info?.subtitle?.split(' ')[0] || '';

    // Формируем HTML для вариантов
    const variantsHtml = product.variants && product.variants.length > 1 ? `
        <div class="product-variants-wrapper">
            <div class="product-variants">
                ${product.variants.slice(0, 5).map(variant => `
                    <div class="variant-item ${variant.isSelected ? 'selected' : ''}"
                         data-variant-id="${variant.id}"
                         data-variant-url="${variant.url}"
                         title="${variant.colorLabel || variant.name || ''}">
                        ${variant.image ? `<img src="${variant.image}" alt="${variant.name || ''}" class="variant-image">` : ''}
                    </div>
                `).join('')}
                ${product.variants.length > 5 ? `
                    <div class="variant-more" data-bs-toggle="collapse" data-bs-target="#variants-${product._id}">
                        <span>+${product.variants.length - 5}</span>
                    </div>
                ` : ''}
            </div>
            ${product.variants.length > 5 ? `
                <div class="collapse variants-collapse" id="variants-${product._id}">
                    <div class="product-variants variants-accordion">
                        ${product.variants.slice(5).map(variant => `
                            <div class="variant-item ${variant.isSelected ? 'selected' : ''}"
                                 style="background-color: #${variant.color}"
                                 data-variant-id="${variant.id}"
                                 data-variant-url="${variant.url}"
                                 title="${variant.colorLabel || variant.name || ''}">
                                ${variant.image ? `<img src="${variant.image}" alt="${variant.name || ''}" class="variant-image">` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    ` : '';

    const hsvr = product.variants && product.variants.length > 1 ? `hsvr` : '';


    const sustainable = product.someAdditionalData.badgeLabel && product.someAdditionalData.badgeLabel === 'Sustainable Materials' ? 'sustainable' : '';
    const justin = product.someAdditionalData.badgeLabel && product.someAdditionalData.badgeLabel === 'Just In' ? 'justin' : '';
    const bestslr = product.someAdditionalData.badgeLabel && product.someAdditionalData.badgeLabel === 'Best Seller' ? 'bestslr' : '';
    const custom = product.someAdditionalData.badgeLabel && product.someAdditionalData.badgeLabel === 'Customize' ? 'custom' : '';
    const soldout = product.someAdditionalData.badgeLabel && product.someAdditionalData.badgeLabel === 'Sold Out' ? 'soldout' : '';

                    // ${variant.color ? `<span class="variant-color" style="background-color: #${variant.color}"></span>` : ''}
    // ${category ? `<div class="product-category">${category}</div>` : ''}
    // Формируем HTML-разметку карточки в премиум дизайне
    return `
        <div class="col-md-4 col-sm-6 mb-4">
            <div class="product-card">
                <div class="product-image-container">
                    ${hasDiscount ? `<div class="discount-badge">-${discountPercent}%</div>` : ''}
                    ${isNew ? `<div class="new-badge">Новинка</div>` : ''}
                    <img src="${imageUrl}" class="product-image" alt="${product.info?.name || 'Товар'}">
                </div>
                <div class="product-body">
                    <h5 class="pb ${sustainable} ${justin} ${bestslr} ${custom} ${soldout}">${product.someAdditionalData.badgeLabel || ''}</h5>
                ${variantsHtml}
                    <h5 class="product-title ${hsvr}">${product.info?.name || 'Без названия'}</h5>
                    <p class='product-subtitle'>${product.info?.subtitle || 'Без описания'}</p>
                    
                    <div class="price-container">
                        <span class="product-price">${price} ₴</span>
                        ${hasDiscount && originalPrice ? `<span class="product-original-price">${originalPrice} ₴</span>` : ''}
                    </div>
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
            <a class="page-link" href="#" data-page="${currentPage - 1}" aria-label="Предыдущая">
                <i class="fas fa-chevron-left"></i>
            </a>
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
            <a class="page-link" href="#" data-page="${currentPage + 1}" aria-label="Следующая">
                <i class="fas fa-chevron-right"></i>
            </a>
        </li>
    `;

    // Добавляем обработчики кликов по страницам
    pagination.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = parseInt(e.target.dataset.page || e.target.closest('.page-link').dataset.page);
            if (page && page !== currentPage) {
                loadProducts(page);
                // Прокручиваем к верху каталога при переходе на новую страницу
                document.querySelector('.catalog-header').scrollIntoView({behavior: 'smooth'});
            }
        });
    });
}

/**
 * Обновляет список доступных цветов в фильтре
 * @param {Array} colors - Массив доступных цветов
 */
function updateColorFilters(colors) {
    const containers = [
        document.getElementById('color-filters'),
        document.getElementById('color-filters-sidebar')
    ];
    
    // Определяем цвета для отображения
    const colorMap = {
        'white': '#ffffff',
        'black': '#000000',
        'grey': '#808080',
        'red': '#d32f2f',
        'blue': '#1976d2',
        'green': '#388e3c',
        'purple': '#7b1fa2',
        'pink': '#e91e63',
        'yellow': '#fbc02d',
        'orange': '#f57c00',
        'brown': '#795548'
    };
    
    // Обновляем оба контейнера цветов (для мобильных и десктопа)
    containers.forEach(container => {
        if (!container) return;
        
        container.innerHTML = '';
        
        // Создаем элементы для каждого цвета
        colors.forEach(color => {
            // Преобразуем название цвета в нижний регистр для поиска по colorMap
            const colorName = color.toLowerCase();
            const hexColor = colorMap[colorName] || '#cccccc'; // Используем серый по умолчанию
            
            // Создаем элемент цвета
            const colorElement = document.createElement('div');
            colorElement.className = `color-option ${color === currentFilters.color ? 'selected' : ''}`;
            colorElement.setAttribute('data-color', color);
            colorElement.style.backgroundColor = hexColor;
            colorElement.title = color;
            
            // Добавляем обработчик нажатия
            colorElement.addEventListener('click', () => {
                // Если уже выбран этот цвет, то снимаем выбор
                if (currentFilters.color === color) {
                    currentFilters.color = '';
                    document.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
                } else {
                    // Иначе выбираем новый цвет
                    currentFilters.color = color;
                    document.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
                    document.querySelectorAll(`.color-option[data-color="${color}"]`).forEach(el => el.classList.add('selected'));
                }
                
                // Загружаем товары с новым фильтром
                currentPage = 1;
                loadProducts(1);
            });
            
            container.appendChild(colorElement);
        });
    });
}

/**
 * Обновляет диапазон цен в ползунках
 * @param {number} min - Минимальная цена
 * @param {number} max - Максимальная цена
 */
function updatePriceRange(min, max) {
    // Округляем значения до ближайших сотен
    const roundedMin = Math.floor(min / 100) * 100;
    const roundedMax = Math.ceil(max / 100) * 100;
    
    // Обновляем глобальные значения
    priceRange.min = roundedMin;
    priceRange.max = roundedMax;
    
    // Обновляем ползунки
    const sliders = [
        document.getElementById('price-slider')?.noUiSlider,
        document.getElementById('price-slider-mobile')?.noUiSlider
    ];
    
    sliders.forEach(slider => {
        if (slider) {
            slider.updateOptions({
                range: {
                    'min': roundedMin,
                    'max': roundedMax
                }
            });
        }
    });
    
    // Обновляем плейсхолдеры в полях ввода
    const inputs = [
        document.getElementById('minPrice-sidebar'),
        document.getElementById('maxPrice-sidebar'),
        document.getElementById('minPrice'),
        document.getElementById('maxPrice')
    ];
    
    inputs.forEach(input => {
        if (input) {
            input.placeholder = input.id.includes('min') ? `От ${roundedMin}` : `До ${roundedMax}`;
        }
    });
}

/**
 * Формирует строку запроса с параметрами фильтрации
 * @returns {string} Строка запроса
 */
function buildQueryString() {
    const params = new URLSearchParams();
    
    // Добавляем базовые фильтры
    if (currentFilters.search) {
        // Добавляем параметр search для поиска по всем полям
        params.append('search', currentFilters.search);
        // Добавляем параметр searchFields для указания полей поиска
        params.append('searchFields', 'name,subtitle,category,keywords,description');
    }
    if (currentFilters.minPrice) params.append('minPrice', currentFilters.minPrice);
    if (currentFilters.maxPrice) params.append('maxPrice', currentFilters.maxPrice);
    if (currentFilters.color) params.append('color', currentFilters.color);
    
    // Добавляем выбранные ключевые слова
    if (currentFilters.keywords.length > 0) {
        currentFilters.keywords.forEach(keyword => {
            params.append('keywords', keyword);
        });
    }
    
    // Добавляем параметр сортировки
    if (currentFilters.sort) {
        params.append('sort', currentFilters.sort);
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
        const response = await fetch(`https://vtjvlad.ddns.net/api/products?page=${page}&limit=12&${queryString}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Received data:', data);

        const productsContainer = document.getElementById('products-container');
        if (page === 1) {
            productsContainer.innerHTML = '';
        }
        
        // Обновляем заголовок результатов
        updateResultCount(data.pagination?.totalProducts || 0);
        
        // Обрабатываем случай, когда товары не найдены
        if (!data.products || data.products.length === 0) {
            productsContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-search fa-3x mb-3 text-muted"></i>
                    <h3 class="fw-light text-muted">Товары не найдены</h3>
                    <p class="text-muted">Попробуйте изменить параметры поиска</p>
                </div>
            `;
            document.getElementById('load-more').style.display = 'none';
            document.getElementById('pagination').style.display = 'none';
        } else {
            // Отображаем найденные товары
            const productsHTML = data.products.map(productGroup => {
                // Используем первый продукт из группы как основной
                const mainProduct = productGroup[0];
                if (!mainProduct) return '';

                // Создаем копию основного продукта и добавляем варианты
                const productWithVariants = {
                    ...mainProduct,
                    variants: [
                        // Добавляем основной продукт как первый вариант
                        {
                            id: mainProduct._id,
                            name: mainProduct.info?.name || '',
                            color: mainProduct.info?.color?.hex || '#ffffff',
                            colorLabel: mainProduct.info?.color?.labelColor || '',
                            image: mainProduct.imageData?.squarishURL || '',
                            additionalBadge: mainProduct.someAdditionalData?.badgeLabel || '',
                            isSelected: true // Основной продукт выбран по умолчанию
                        },
                        // Добавляем остальные варианты
                        ...productGroup.slice(1).map(variant => ({
                            id: variant._id,
                            name: variant.info?.name || '',
                            color: variant.info?.color?.hex || '#ffffff',
                            colorLabel: variant.info?.color?.labelColor || '',
                            image:  variant.imageData?.squarishURL || '',
                            additionalBadge: variant.someAdditionalData?.badgeLabel || '',
                            isSelected: false
                        }))
                    ]
                };

                // Если есть фильтр по цвету, находим и выбираем соответствующий вариант
                if (currentFilters.color) {
                    // Ищем подходящий вариант (включая основной продукт)
                    const matchingVariant = productWithVariants.variants.find(
                        v => v.colorLabel === currentFilters.color
                    );
                    
                    if (matchingVariant) {
                        // Если нашли подходящий вариант, делаем его активным
                        productWithVariants.variants.forEach(v => v.isSelected = false);
                        matchingVariant.isSelected = true;
                        
                        // Обновляем основное изображение и цвет
                        productWithVariants.imageData = {
                            ...productWithVariants.imageData,
                            imgMain: matchingVariant.image
                        };
                        productWithVariants.info = {
                            ...productWithVariants.info,
                            color: {
                                hex: matchingVariant.color,
                                labelColor: matchingVariant.colorLabel
                            }
                        };
                        productWithVariants.links = {
                            ...productWithVariants.links,
                            url: matchingVariant.url
                        };
                    }
                }

                return createProductCard(productWithVariants);
            }).join('');
            
            if (page === 1) {
                productsContainer.innerHTML = productsHTML;
            } else {
                productsContainer.insertAdjacentHTML('beforeend', productsHTML);
            }

            currentPage = data.pagination.currentPage;
            totalPages = data.pagination.totalPages;

            updatePagination(currentPage, totalPages);
            
            // Обновляем фильтр цветов только для первой страницы
            if (page === 1) {
                if (data.filters?.colors) {
                    updateColorFilters(data.filters.colors);
                }
                // Обновляем диапазон цен при первой загрузке
                if (data.filters?.priceRange) {
                    updatePriceRange(data.filters.priceRange.min, data.filters.priceRange.max);
                }
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
            <div class="col-12 text-center py-5">
                <i class="fas fa-exclamation-circle fa-3x mb-3 text-danger"></i>
                <h3 class="fw-light">Ошибка загрузки товаров</h3>
                <p class="text-muted mb-4">Пожалуйста, попробуйте позже</p>
                <button class="btn btn-primary" onclick="loadProducts(1)">
                    <i class="fas fa-sync-alt me-2"></i>
                    Попробовать снова
                </button>
            </div>
        `;
        document.getElementById('load-more').style.display = 'none';
        document.getElementById('pagination').style.display = 'none';
    } finally {
        hideLoading();
    }
}

/**
 * Обновляет счетчик результатов
 * @param {number} count - Количество найденных товаров
 */
function updateResultCount(count) {
    const resultsCount = document.querySelector('.results-count h4');
    if (resultsCount) {
        if (count === 0) {
            resultsCount.textContent = 'Товары не найдены';
        } else {
            resultsCount.textContent = `Найдено товаров: ${count}`;
        }
    }
}

/**
 * Синхронизирует значения полей между формами фильтров (мобильной и десктопной)
 * @param {string} sourceFormId - ID исходной формы
 * @param {string} targetFormId - ID целевой формы
 */
function syncFilterForms(sourceFormId, targetFormId) {
    const sourceForm = document.getElementById(sourceFormId);
    const targetForm = document.getElementById(targetFormId);
    
    if (!sourceForm || !targetForm) return;
    
    // Синхронизируем поля поиска
    const searchSource = sourceForm.querySelector('input[id^="search"]');
    const searchTarget = targetForm.querySelector('input[id^="search"]');
    if (searchSource && searchTarget) {
        searchTarget.value = searchSource.value;
    }
    
    // Синхронизируем поля цены
    const minPriceSource = sourceForm.querySelector('input[id^="minPrice"]');
    const minPriceTarget = targetForm.querySelector('input[id^="minPrice"]');
    if (minPriceSource && minPriceTarget) {
        minPriceTarget.value = minPriceSource.value;
    }
    
    const maxPriceSource = sourceForm.querySelector('input[id^="maxPrice"]');
    const maxPriceTarget = targetForm.querySelector('input[id^="maxPrice"]');
    if (maxPriceSource && maxPriceTarget) {
        maxPriceTarget.value = maxPriceSource.value;
    }
    
    // Синхронизируем чекбоксы для ключевых слов
    const keywordsSource = sourceForm.querySelectorAll('input[name="keywords"]:checked');
    if (keywordsSource.length > 0) {
        // Сначала снимаем все чекбоксы в целевой форме
        targetForm.querySelectorAll('input[name="keywords"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Затем устанавливаем нужные
        keywordsSource.forEach(checkbox => {
            const targetCheckbox = targetForm.querySelector(`input[name="keywords"][value="${checkbox.value}"]`);
            if (targetCheckbox) {
                targetCheckbox.checked = true;
            }
        });
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Инициализация ползунка цен для десктопной версии
    const priceSlider = document.getElementById('price-slider');
    if (priceSlider) {
        noUiSlider.create(priceSlider, {
            start: [priceRange.min, priceRange.max],
            connect: true,
            range: {
                'min': priceRange.min,
                'max': priceRange.max
            },
            step: 100
        });

        // Синхронизация значений ползунка с полями ввода
        const minPriceInput = document.getElementById('minPrice-sidebar');
        const maxPriceInput = document.getElementById('maxPrice-sidebar');

        priceSlider.noUiSlider.on('update', function (values, handle) {
            const value = Math.round(values[handle]);
            if (handle === 0) {
                minPriceInput.value = value;
            } else {
                maxPriceInput.value = value;
            }
        });

        // Обновление ползунка при вводе значений
        minPriceInput.addEventListener('change', function () {
            priceSlider.noUiSlider.set([this.value, null]);
        });

        maxPriceInput.addEventListener('change', function () {
            priceSlider.noUiSlider.set([null, this.value]);
        });

        // Добавляем обработчик изменения положения ползунка
        priceSlider.noUiSlider.on('change', function (values) {
            currentFilters.minPrice = Math.round(values[0]);
            currentFilters.maxPrice = Math.round(values[1]);
            currentPage = 1;
            loadProducts(1);
        });
    }

    // Инициализация ползунка цен для мобильной версии
    const priceSliderMobile = document.getElementById('price-slider-mobile');
    if (priceSliderMobile) {
        noUiSlider.create(priceSliderMobile, {
            start: [priceRange.min, priceRange.max],
            connect: true,
            range: {
                'min': priceRange.min,
                'max': priceRange.max
            },
            step: 100
        });

        // Синхронизация значений ползунка с полями ввода
        const minPriceInputMobile = document.getElementById('minPrice');
        const maxPriceInputMobile = document.getElementById('maxPrice');

        priceSliderMobile.noUiSlider.on('update', function (values, handle) {
            const value = Math.round(values[handle]);
            if (handle === 0) {
                minPriceInputMobile.value = value;
            } else {
                maxPriceInputMobile.value = value;
            }
        });

        // Обновление ползунка при вводе значений
        minPriceInputMobile.addEventListener('change', function () {
            priceSliderMobile.noUiSlider.set([this.value, null]);
        });

        maxPriceInputMobile.addEventListener('change', function () {
            priceSliderMobile.noUiSlider.set([null, this.value]);
        });

        // Добавляем обработчик изменения положения ползунка
        priceSliderMobile.noUiSlider.on('change', function (values) {
            currentFilters.minPrice = Math.round(values[0]);
            currentFilters.maxPrice = Math.round(values[1]);
            currentPage = 1;
            loadProducts(1);
        });
    }

    // Загружаем первую страницу товаров
    loadProducts(1);
    
    // Добавляем обработчик для поискового input'а
    const searchInput = document.getElementById('search-sidebar');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const searchValue = e.target.value.trim();
                currentFilters.search = searchValue;
                currentPage = 1;
                loadProducts(1);
            }, 500); // Задержка 500мс для предотвращения частых запросов
        });
    }
    
    // Обработчик кнопки переключения фильтров
    const filterToggle = document.getElementById('filterToggle');
    const filterSidebar = document.querySelector('.filter-sidebar');
    
    if (filterToggle && filterSidebar) {
        const filterColumn = filterSidebar.closest('.col-lg-3');
        const contentColumn = document.querySelector('.col-lg-9');
        
        filterToggle.addEventListener('click', () => {
            if (window.innerWidth <= 992) {
                // Мобильное поведение
                filterSidebar.classList.toggle('active');
                document.body.classList.toggle('filter-open');
            } else {
                // Десктопное поведение
                filterSidebar.classList.toggle('hidden');
                filterColumn.classList.toggle('hidden');
                contentColumn.classList.toggle('expanded');
                
                // Обновляем текст кнопки
                const buttonText = filterToggle.querySelector('i').nextSibling;
                if (filterSidebar.classList.contains('hidden')) {
                    buttonText.textContent = ' Показать фильтры';
                } else {
                    buttonText.textContent = ' Скрыть фильтры';
                }
            }
        });
        
        // Закрываем фильтр при клике вне его области (только для мобильных)
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 992 && 
                filterSidebar.classList.contains('active') && 
                !filterSidebar.contains(e.target) && 
                !filterToggle.contains(e.target)) {
                filterSidebar.classList.remove('active');
                document.body.classList.remove('filter-open');
            }
        });
    }
    
    // Обработчик кнопки "Загрузить еще"
    document.getElementById('load-more').addEventListener('click', () => {
        if (!isLoading) {
            loadProducts(currentPage + 1);
        }
    });

    // Обработчик отправки формы мобильных фильтров
    const mobileFilterForm = document.getElementById('filter-form');
    if (mobileFilterForm) {
        mobileFilterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (isLoading) return;
            
            // Собираем значения фильтров
            currentFilters = {
                search: document.getElementById('search').value.trim(),
                minPrice: document.getElementById('minPrice').value.trim(),
                maxPrice: document.getElementById('maxPrice').value.trim(),
                color: currentFilters.color, // Сохраняем текущий выбранный цвет
                keywords: Array.from(mobileFilterForm.querySelectorAll('input[name="keywords"]:checked')).map(input => input.value),
                sort: currentFilters.sort
            };
            
            // Синхронизируем значения с боковой формой фильтров
            syncFilterForms('filter-form', 'filter-form-sidebar');
            
            // Закрываем offcanvas меню на мобильных
            const offcanvasElement = document.getElementById('filtersOffcanvas');
            if (offcanvasElement) {
                const offcanvas = bootstrap.Offcanvas.getInstance(offcanvasElement);
                if (offcanvas) {
                    offcanvas.hide();
                }
            }

            // Сбрасываем страницу на первую при применении фильтров
            currentPage = 1;
            loadProducts(1);
        });
    }
    
    // Обработчик отправки формы боковых фильтров (десктоп)
    const sidebarFilterForm = document.getElementById('filter-form-sidebar');
    if (sidebarFilterForm) {
        sidebarFilterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (isLoading) return;
            
            // Собираем значения фильтров
            currentFilters = {
                search: document.getElementById('search-sidebar').value.trim(),
                minPrice: document.getElementById('minPrice-sidebar').value.trim(),
                maxPrice: document.getElementById('maxPrice-sidebar').value.trim(),
                color: currentFilters.color, // Сохраняем текущий выбранный цвет
                keywords: Array.from(sidebarFilterForm.querySelectorAll('input[name="keywords"]:checked')).map(input => input.value),
                sort: currentFilters.sort
            };
            
            // Синхронизируем значения с мобильной формой фильтров
            syncFilterForms('filter-form-sidebar', 'filter-form');

            // Сбрасываем страницу на первую при применении фильтров
            currentPage = 1;
            loadProducts(1);
        });
    }

    // Обработчик сброса фильтров для мобильной версии
    const resetFiltersBtn = document.getElementById('reset-filters');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', () => {
            if (isLoading) return;
            
            // Сбрасываем мобильную форму
            document.getElementById('filter-form').reset();
            
            // Сбрасываем текущие фильтры
            currentFilters = {
                search: '',
                minPrice: '',
                maxPrice: '',
                color: '',
                keywords: [],
                sort: 'popular' // Возвращаем сортировку по умолчанию
            };
            
            // Сбрасываем выбранный цвет в UI
            document.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
            
            // Сбрасываем боковую форму
            if (document.getElementById('filter-form-sidebar')) {
                document.getElementById('filter-form-sidebar').reset();
            }
            
            // Сбрасываем сортировку
            const sortSelect = document.querySelector('.sort-options select');
            if (sortSelect) {
                sortSelect.selectedIndex = 0;
            }

            // Сбрасываем страницу на первую
            currentPage = 1;
            loadProducts(1);
        });
    }
    
    // Обработчик сброса фильтров для десктопной версии
    const resetFiltersSidebarBtn = document.getElementById('reset-filters-sidebar');
    if (resetFiltersSidebarBtn) {
        resetFiltersSidebarBtn.addEventListener('click', () => {
            if (isLoading) return;
            
            // Сбрасываем боковую форму
            document.getElementById('filter-form-sidebar').reset();
            
            // Сбрасываем текущие фильтры
            currentFilters = {
                search: '',
                minPrice: '',
                maxPrice: '',
                color: '',
                keywords: [],
                sort: 'popular' // Возвращаем сортировку по умолчанию
            };
            
            // Сбрасываем выбранный цвет в UI
            document.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
            
            // Сбрасываем мобильную форму
            if (document.getElementById('filter-form')) {
                document.getElementById('filter-form').reset();
            }
            
            // Сбрасываем сортировку
            const sortSelect = document.querySelector('.sort-options select');
            if (sortSelect) {
                sortSelect.selectedIndex = 0;
            }

            // Сбрасываем страницу на первую
            currentPage = 1;
            loadProducts(1);
        });
    }

    // Обработчики для чекбоксов ключевых слов в мобильной форме
    document.querySelectorAll('#filter-form input[name="keywords"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            // Обновляем соответствующий чекбокс в боковой форме
            const sidebarCheckbox = document.querySelector(`#filter-form-sidebar input[name="keywords"][value="${checkbox.value}"]`);
            if (sidebarCheckbox) {
                sidebarCheckbox.checked = checkbox.checked;
            }
            
            // Собираем все выбранные ключевые слова
            currentFilters.keywords = Array.from(document.querySelectorAll('#filter-form input[name="keywords"]:checked')).map(input => input.value);
            
            // Применяем фильтры сразу
            currentPage = 1;
            loadProducts(1);
        });
    });
    
    // Обработчики для чекбоксов ключевых слов в боковой форме
    document.querySelectorAll('#filter-form-sidebar input[name="keywords"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            // Обновляем соответствующий чекбокс в мобильной форме
            const mobileCheckbox = document.querySelector(`#filter-form input[name="keywords"][value="${checkbox.value}"]`);
            if (mobileCheckbox) {
                mobileCheckbox.checked = checkbox.checked;
            }
            
            // Собираем все выбранные ключевые слова
            currentFilters.keywords = Array.from(document.querySelectorAll('#filter-form-sidebar input[name="keywords"]:checked')).map(input => input.value);
            
            // Применяем фильтры сразу
            currentPage = 1;
            loadProducts(1);
        });
    });
    
    // Обработчик сортировки
    const sortSelect = document.querySelector('.sort-options select');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            // Обновляем параметр сортировки
            const selectedIndex = sortSelect.selectedIndex;
            const sortOptions = ['popular', 'price_asc', 'price_desc', 'newest', 'discount'];
            currentFilters.sort = sortOptions[selectedIndex] || 'popular';
            
            // Загружаем товары с новой сортировкой
            currentPage = 1;
            loadProducts(1);
        });
    }
    
    // Добавляем анимацию прокрутки для плавной навигации
    document.querySelectorAll('a.dropdown-item').forEach(link => {
        link.addEventListener('click', (e) => {
            // Предотвращаем стандартное действие
            e.preventDefault();
            
            // Закрываем меню
            const dropdown = bootstrap.Dropdown.getInstance(link.closest('.dropdown').querySelector('.dropdown-toggle'));
            if (dropdown) dropdown.hide();
            
            // Прокручиваем к каталогу
            document.querySelector('.catalog-header').scrollIntoView({behavior: 'smooth'});
        });
    });

    // Добавляем обработчики для вариантов товаров
    document.addEventListener('click', (e) => {
        const variantItem = e.target.closest('.variant-item');
        if (variantItem) {
            const productCard = variantItem.closest('.product-card');
            if (productCard) {
                // Убираем выделение со всех вариантов в этой карточке
                productCard.querySelectorAll('.variant-item').forEach(item => {
                    item.classList.remove('selected');
                });
                
                // Выделяем выбранный вариант
                variantItem.classList.add('selected');
                
                // Получаем URL варианта
                const variantUrl = variantItem.dataset.variantUrl;
                if (variantUrl) {
                    // Обновляем изображение товара
                    const productImage = productCard.querySelector('.product-image');
                    const variantImage = variantItem.querySelector('.variant-image');
                    if (productImage && variantImage) {
                        productImage.src = variantImage.src;
                    }
                    
                    // Обновляем цвет в информации о товаре
                    const colorLabel = variantItem.title;
                    const colorElement = productCard.querySelector('.product-color');
                    const colorLabelElement = productCard.querySelector('.product-colors small');
                    
                    if (colorElement) {
                        colorElement.style.backgroundColor = variantItem.querySelector('.variant-color')?.style.backgroundColor || '#ffffff';
                    }
                    
                    if (colorLabelElement && colorLabel) {
                        colorLabelElement.textContent = colorLabel;
                    }
                    
                    // Обновляем URL товара
                    const productLink = productCard.querySelector('a');
                    if (productLink) {
                        productLink.href = variantUrl;
                    }
                }
            }
        }
    });
}); 


function handleScroll() {
    if (isLoading || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    
    if (scrollTop + clientHeight >= scrollHeight - 500) {
        loadProducts(currentPage + 1);
    }
}  





window.addEventListener('scroll', handleScroll); 
