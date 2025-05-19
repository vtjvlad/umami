let currentFilters = {    // Текущие активные фильтры
    search: '',           // Поисковый запрос
    minPrice: '',        // Минимальная цена
    maxPrice: '',        // Максимальная цена
    color: '',           // Выбранный цвет
    keywords: [],        // Выбранные ключевые слова
    sort: 'popular'      // Сортировка (по умолчанию по популярности)
};

function showLoading() {
    document.getElementById('loading-spinner').style.display = 'flex';
    document.getElementById('load-more').style.display = 'none';
    isLoading = true;
}

function hideLoading() {
    document.getElementById('loading-spinner').style.display = 'none';
    document.getElementById('load-more').style.display = 'block';
    isLoading = false;
}

function createProductCard(product) {
    // Получаем URL изображения из различных возможных источников
    const imageUrl = product.imageData?.imgMain || 
                   product.imageData?.portraitURL || 
                   product.imageData?.squarishURL || 
                   'https://via.placeholder.com/300x400';
    
    // Получаем цену товара
    const price = product.price?.self?.UAH?.currentPrice || 
                product.price?.origin?.currentPrice || 
                '0';
                
    // Получаем скидку и оригинальную цену, если есть
    const hasDiscount = product.price?.self?.UAH?.currentPrice < product.price?.self?.UAH?.fullPrice;
    const originalPrice = product.price?.self?.UAH?.fullPrice || null;
    const discountPercent = hasDiscount ? 
        Math.round(100 - (product.price.self.UAH.currentPrice / product.price.self.UAH.fullPrice * 100)) : null;
    
    // Получаем информацию о цвете
    const colorHex = product.info?.color?.hex || '#ffffff';
    const colorLabel = product.info?.color?.labelColor || '';
    
    // Определяем, является ли товар новинкой (условно - товар с id > 1000 считаем новинкой)
    const isNew = parseInt(product.id) > 1000;
    
    // Получаем категорию
    const category = product.info?.subtitle?.split(' ')[0] || '';

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
                    ${category ? `<div class="product-category">${category}</div>` : ''}
                    <h5 class="product-title">${product.info?.name || 'Без названия'}</h5>
                    <p class='product-subtitle'>${product.info?.subtitle || 'Без описания'}</p>
                    
                    <div class="price-container">
                        <span class="product-price">${price} ₴</span>
                        ${hasDiscount && originalPrice ? `<span class="product-original-price">${originalPrice} ₴</span>` : ''}
                    </div>
                    
                    ${colorLabel ? `
                        <div class="product-colors">
                            <span class="product-color" style="background-color: ${colorHex}"></span>
                            ${colorLabel && colorLabel !== 'null' ? `<small class="ms-2">${colorLabel}</small>` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

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

