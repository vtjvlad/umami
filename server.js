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
        
        // Search by name
        if (req.query.search) {
            filter['info.name'] = { $regex: req.query.search, $options: 'i' };
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
                    // По умолчанию без сортировки (или можно добавить вашу логику "по популярности")
                    sortOptions = {};
            }
        }
        
        console.log('Using sort options:', sortOptions);

        // Get products with pagination and sorting
        console.log('Fetching products with skip:', skip, 'limit:', limit);
        const products = await Product.find(filter)
            .sort(sortOptions)
            .skip(skip)
            .limit(limit)
            .lean();
        console.log('Found products:', products.length);

        // Get total count for pagination
        const total = await Product.countDocuments(filter);
        console.log('Total products matching filter:', total);

        // Get all unique colors from database
        const colors = await Product.distinct('info.color.labelColor');
        console.log('Available colors:', colors);

        console.log(`Found ${products.length} products on page ${page} of ${Math.ceil(total / limit)}`);

        res.json({
            products,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalProducts: total,
                productsPerPage: limit
            },
            filters: {
                colors: colors.filter(Boolean)
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
app.get("/catalog-ex", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "catalog-ex.html"));
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


