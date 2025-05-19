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
});
//
// function handleScroll() {
//     if (isLoading || !hasMore) return;
//
//     const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
//     
//     if (scrollTop + clientHeight >= scrollHeight - 500) {
//         loadProducts(currentPage + 1);
//     }
// }
//
// window.addEventListener('scroll', handleScroll);

