const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT;

const productSchema = require("./model");
const Product = mongoose.model('Product', productSchema);

// Подключение к MongoDB
mongoose.connect(MONGO_URI)
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to get all products
app.get("/api/products", async (req, res) => {
    try {
        console.log('Received request with query:', req.query);
        
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;

        // Build filter object
        const filter = {};
        
        // Search by multiple fields
        if (req.query.search) {
            const searchFields = req.query.searchFields ? req.query.searchFields.split(',') : ['info.name'];
            const searchConditions = searchFields.map(field => {
                const fieldPath = field.includes('.') ? field : `info.${field}`;
                return { [fieldPath]: { $regex: req.query.search, $options: 'i' } };
            });
            filter.$or = searchConditions;
        }

        // Filter by color
        if (req.query.color) {
            filter['info.color.labelColor'] = req.query.color;
        }

        // Filter by price range
        if (req.query.minPrice || req.query.maxPrice) {
            filter['price.self.UAH.currentPrice'] = {};
            if (req.query.minPrice) {
                filter['price.self.UAH.currentPrice'].$gte = parseFloat(req.query.minPrice);
            }
            if (req.query.maxPrice) {
                filter['price.self.UAH.currentPrice'].$lte = parseFloat(req.query.maxPrice);
            }
        }

        // Filter by keywords
        if (req.query.keywords) {
            // Преобразуем строку ключевых слов в массив
            const keywords = Array.isArray(req.query.keywords) 
                ? req.query.keywords 
                : [req.query.keywords];
            
            console.log('Processing keywords:', keywords);
            
            // Создаем массив условий для поиска по ключевым словам в subtitle
            const keywordConditions = keywords.map(keyword => ({
                'info.subtitle': { $regex: keyword, $options: 'i' }
            }));
            
            // Добавляем условия в фильтр
            if (keywordConditions.length > 0) {
                filter.$and = keywordConditions;
            }
        }

        console.log('Final filter:', JSON.stringify(filter, null, 2));

        // Set up sort options
        let sortOptions = {};
        
        // Handle sort parameter
        if (req.query.sort) {
            switch (req.query.sort) {
                case 'price_asc':
                    sortOptions = { 'price.self.UAH.currentPrice': 1 };
                    break;
                case 'price_desc':
                    sortOptions = { 'price.self.UAH.currentPrice': -1 };
                    break;
                case 'newest':
                    // Условно считаем, что id с большим значением - это более новые товары
                    sortOptions = { 'id': -1 };
                    break;
                case 'discount':
                    // Сортируем по размеру скидки (разница между исходной и текущей ценой)
                    // Для товаров без скидки разница будет 0, поэтому они будут в конце
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
                    // По умолчанию сортируем по id в обратном порядке (новые первыми)
                    sortOptions = { 'id': -1 };
            }
        } else {
            // Если сортировка не указана, сортируем по id в обратном порядке
            sortOptions = { 'id': -1 };
        }
        
        console.log('Using sort options:', sortOptions);

        // Get products with pagination and sorting
        console.log('Fetching products with skip:', skip, 'limit:', limit);
        
        // First get the group keys with pagination
        const groupKeysResult = await Product.aggregate([
            { $match: filter },
            { $group: { _id: '$pid.groupKey' } },
            { $sort: sortOptions },
            { $skip: skip },
            { $limit: limit }
        ]);

        const groupKeys = groupKeysResult.map(result => result._id);

        if (!groupKeys.length) {
            return res.json({
                products: [],
                pagination: {
                    currentPage: page,
                    totalPages: 0,
                    totalProducts: 0,
                    productsPerPage: limit
                },
                filters: {
                    colors: [],
                    priceRange: {
                        min: 0,
                        max: 10000
                    }
                }
            });
        }

        // Then get all products for these group keys
        const products = await Product.find({
            'pid.groupKey': { $in: groupKeys }
        }).select('+*');

        // Group products by groupKey
        const groupedProducts = groupKeys.map(groupKey => {
            return products.filter(p => p.pid && p.pid.groupKey === groupKey);
        });

        // Get total count of groups for pagination
        const totalGroups = await Product.aggregate([
            { $match: filter },
            { $group: { _id: '$pid.groupKey' } }
        ]).length;

        // Get all unique colors from database
        const colors = await Product.distinct('info.color.labelColor');
        console.log('Available colors:', colors);

        // Get min and max prices from database
        const priceStats = await Product.aggregate([
            {
                $group: {
                    _id: null,
                    minPrice: { $min: "$price.self.UAH.currentPrice" },
                    maxPrice: { $max: "$price.self.UAH.currentPrice" }
                }
            }
        ]);
        
        const priceRange = priceStats[0] || { minPrice: 0, maxPrice: 10000 };
        console.log('Price range:', priceRange);

        console.log(`Found ${groupedProducts.length} product groups on page ${page} of ${Math.ceil(totalGroups / limit)}`);

        res.json({
            products: groupedProducts,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalGroups / limit),
                totalProducts: totalGroups,
                productsPerPage: limit
            },
            filters: {
                colors: colors.filter(Boolean),
                priceRange: {
                    min: priceRange.minPrice,
                    max: priceRange.maxPrice
                }
            }
        });
    } catch (error) {
        console.error('Error in /api/products:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            message: 'Ошибка при загрузке товаров',
            error: error.message 
        });
    }
});

// Catalog page route
app.get("/catalog", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "catalog.html"));
});

// Catalog page route
app.get("/w", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "catalog-old.html"));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        message: 'Внутренняя ошибка сервера',
        error: err.message 
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


