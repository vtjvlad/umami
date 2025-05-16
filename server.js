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

// Test route to create a product
app.post("/api/test-product", async (req, res) => {
    try {
        const testProduct = new Product({
            info: {
                name: "Тестовый товар",
                subtitle: "Подзаголовок тестового товара",
                discription: "Описание тестового товара",
                color: {
                    labelColor: "Красный",
                    hex: "#ff0000",
                    colorDescription: "Красный"
                }
            },
            imageData: {
                imgMain: "https://via.placeholder.com/300x200",
                portraitURL: "https://via.placeholder.com/300x200",
                squarishURL: "https://via.placeholder.com/300x200"
            },
            price: {
                self: {
                    UAH: {
                        currentPrice: 999
                    }
                }
            }
        });
        await testProduct.save();
        res.json({ message: "Test product created", product: testProduct });
    } catch (error) {
        console.error('Error creating test product:', error);
        res.status(500).json({ message: error.message });
    }
});

// API endpoint to get all products
app.get("/api/products", async (req, res) => {
    try {
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

        console.log('Filter:', JSON.stringify(filter, null, 2));

        // Get products with pagination
        const products = await Product.find(filter)
            .skip(skip)
            .limit(limit)
            .lean();

        // Get total count for pagination
        const total = await Product.countDocuments(filter);

        // Get all unique colors from database
        const colors = await Product.distinct('info.color.labelColor');

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


