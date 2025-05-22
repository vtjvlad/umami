const buildFilter = (query) => {
    const filter = {};
    
    // Search by multiple fields
    if (query.search) {
        const searchFields = query.searchFields ? query.searchFields.split(',') : ['info.name'];
        const searchConditions = searchFields.map(field => {
            const fieldPath = field.includes('.') ? field : `info.${field}`;
            return { [fieldPath]: { $regex: query.search, $options: 'i' } };
        });
        filter.$or = searchConditions;
    }

    // Filter by color
    if (query.color) {
        filter['info.color.labelColor'] = query.color;
    }

    // Filter by price range
    if (query.minPrice || query.maxPrice) {
        filter['price.self.UAH.currentPrice'] = {};
        if (query.minPrice) {
            filter['price.self.UAH.currentPrice'].$gte = parseFloat(query.minPrice);
        }
        if (query.maxPrice) {
            filter['price.self.UAH.currentPrice'].$lte = parseFloat(query.maxPrice);
        }
    }

    // Filter by keywords
    if (query.keywords) {
        const keywords = Array.isArray(query.keywords) 
            ? query.keywords 
            : [query.keywords];
        
        const keywordConditions = keywords.map(keyword => ({
            'info.subtitle': { $regex: keyword, $options: 'i' }
        }));
        
        if (keywordConditions.length > 0) {
            filter.$and = keywordConditions;
        }
    }

    return filter;
};

const getSortOptions = (sort) => {
    let sortOptions = {};
    
    switch (sort) {
        case 'price_asc':
            sortOptions = { 'price.self.UAH.currentPrice': 1 };
            break;
        case 'price_desc':
            sortOptions = { 'price.self.UAH.currentPrice': -1 };
            break;
        case 'newest':
            sortOptions = { 'id': -1 };
            break;
        case 'discount':
            sortOptions = { 
                $expr: { 
                    $subtract: [
                        { $ifNull: ['$price.self.UAH.fullPrice', 0] }, 
                        { $ifNull: ['$price.self.UAH.currentPrice', 0] }
                    ] 
                }
            };
            break;
        default:
            sortOptions = {};
    }
    
    return sortOptions;
};

module.exports = {
    buildFilter,
    getSortOptions
}; 