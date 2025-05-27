const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const axios = require('axios');
const https = require('https');
const cliProgress = require('cli-progress');

// Создаем агент для игнорирования SSL ошибок (если нужно)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// Функция для форматирования времени
function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}ч ${minutes % 60}м`;
  } else if (minutes > 0) {
    return `${minutes}м ${seconds % 60}с`;
  } else {
    return `${seconds}с`;
  }
}

// Функция для загрузки одного изображения
async function downloadImage(url, filepath) {
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
      httpsAgent
    });

    // Получаем расширение файла из URL
    const ext = path.extname(url.split('?')[0]) || '.jpg';
    const finalPath = filepath + ext;

    const writer = fs.createWriteStream(finalPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`Ошибка при загрузке ${url}:`, error.message);
    return null;
  }
}

// Основная функция
async function processImages(jsonFilePath, outputDir) {
  try {
    // Создаем главную папку
    await fsPromises.mkdir(outputDir, { recursive: true });

    // Читаем JSON файл
    const data = JSON.parse(await fsPromises.readFile(jsonFilePath, 'utf8'));

    // Подсчитываем общее количество изображений
    const totalImages = data.reduce((sum, item) => sum + item.imgSrc.length, 0);
    let processedImages = 0;
    const startTime = Date.now();

    // Создаем прогресс-бар
    const progressBar = new cliProgress.SingleBar({
      format: 'Прогресс |{bar}| {percentage}% | {value}/{total} изображений | Осталось: {eta}s',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    });

    // Инициализируем прогресс-бар
    progressBar.start(totalImages, 0);

    // Обрабатываем каждый объект
    for (const item of data) {
      const { rownum, title, imgSrc: imgSrcArray } = item;

      // Создаем папку бренда
      const brandDir = path.join(outputDir, title);
      await fsPromises.mkdir(brandDir, { recursive: true });

      // Обрабатываем каждую ссылку
      for (let i = 0; i < imgSrcArray.length; i++) {
        const imageUrl = imgSrcArray[i];
        const fileName = `${rownum}-${i + 1}`;
        const filePath = path.join(brandDir, fileName);

        await downloadImage(imageUrl, filePath);
        processedImages++;
        progressBar.update(processedImages);
      }
    }

    progressBar.stop();
    const totalTime = Date.now() - startTime;
    console.log(`\nЗагрузка завершена! Общее время: ${formatTime(totalTime)}`);
  } catch (error) {
    console.error('Ошибка:', error.message);
  }
}

// Использование
const jsonFilePath = 'china-numbered.json'; // Путь к вашему JSON файлу
const outputDir = 'china-images'; // Главная папка для изображений

processImages(jsonFilePath, outputDir);