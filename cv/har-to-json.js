const fs = require('fs');
const path = require('path');
const { cachedDataVersionTag } = require('v8');

// Get the HAR file path from command line arguments
const harFilePath = './china.har';

if (!harFilePath) {
    console.error('Please provide the path to the HAR file as an argument');
    console.error('Usage: node har-to-json.js <path-to-har-file>');
    process.exit(1);
}

try {
    // Read the HAR file
    const harContent = fs.readFileSync(harFilePath, 'utf8');
    
    // Parse the HAR content
    const harData = JSON.parse(harContent);
    
    // Create output filename
    const outputPath = path.join(
        path.dirname(harFilePath),
        `${path.basename(harFilePath, '.har')}.json`
    );
    
    // Write the JSON file
    fs.writeFileSync(outputPath, JSON.stringify(harData, null, 2));
    
    console.log(`Successfully converted ${harFilePath} to ${outputPath}`);
} catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
} 