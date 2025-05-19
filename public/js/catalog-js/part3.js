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
        
        const container = document.getElementById('products-container');
        if (page === 1) {
            container.innerHTML = '';
        }
        
        // Обновляем заголовок результатов
        updateResultCount(data.pagination?.totalProducts || 0);
        
        // Обрабатываем случай, когда товары не найдены
        if (!data.products || data.products.length === 0) {
            container.innerHTML = `
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
            data.products.forEach(product => {
                container.innerHTML += createProductCard(product);
            });

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

