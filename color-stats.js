const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// MongoDB connection string - replace with your actual connection string
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/your_database';

// Product schema
const productSchema = new mongoose.Schema({
    info: {
        color: {
            labelColor: String
        }
    }
});

// Create model
const Product = mongoose.model('Product', productSchema);

async function getColorStats() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Aggregate to get color counts
        const colorStats = await Product.aggregate([
            {
                $group: {
                    _id: '$info.color.labelColor',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        // Format the results
        const formattedStats = colorStats
            .filter(stat => stat._id) // Filter out null/undefined values
            .map(stat => `${stat._id} (${stat.count})`)
            .join('\n');

        // Write to file
        const outputPath = path.join(__dirname, 'color-stats.txt');
        fs.writeFileSync(outputPath, formattedStats);
        console.log(`Color statistics have been written to ${outputPath}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        // Close MongoDB connection
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    }
}

// Run the script
getColorStats(); 