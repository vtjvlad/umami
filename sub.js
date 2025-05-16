const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/yourDatabase';

const ItemSchema = new mongoose.Schema({
  info: {
    subtitle: String
  }
}, { collection: 'products' });

const Item = mongoose.model('Item', ItemSchema);

// Константы для настройки
const MIN_WORD_LENGTH = 2;
const MIN_FREQUENCY = 3; // Минимальная частота появления слова
const MIN_BIGRAM_FREQUENCY = 4; // Минимальная частота появления биграммы
const MAX_CONTEXT_WORDS = 3; // Максимальное количество разных слов, с которыми может сочетаться слово

// Загрузка ручных словосочетаний
let manualBigrams = new Set();
try {
  const config = JSON.parse(fs.readFileSync('bigrams.json', 'utf8'));
  manualBigrams = new Set(config.manual_bigrams.map(bigram => bigram.toLowerCase()));
  console.log(`Загружено ${manualBigrams.size} ручных словосочетаний`);
} catch (err) {
  console.log('Файл bigrams.json не найден или содержит ошибки. Ручные словосочетания не будут использоваться.');
}

const cleanWord = (word) => {
  return word
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}''-]+/gu, '')
    .replace(/^[''-]+|[''-]+$/gu, '');
};

(async () => {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Подключено к MongoDB');

    const items = await Item.find({}, { 'info.subtitle': 1 }).lean();
    console.log(`Найдено ${items.length} документов`);

    const unigramCounts = new Map();
    const bigramCounts = new Map();
    const wordContexts = new Map(); // Хранит контексты для каждого слова
    let totalWords = 0;

    // Первый проход: подсчет частот и контекстов
    for (const item of items) {
      const subtitle = item.info?.subtitle;
      if (typeof subtitle === 'string') {
        const words = subtitle
          .split(/\s+/)
          .map(cleanWord)
          .filter(word => word.length >= MIN_WORD_LENGTH);

        totalWords += words.length;

        // Подсчет униграмм и контекстов
        for (let i = 0; i < words.length; i++) {
          const word = words[i];
          unigramCounts.set(word, (unigramCounts.get(word) || 0) + 1);
          
          // Сохраняем контекст слова (соседние слова)
          if (!wordContexts.has(word)) {
            wordContexts.set(word, new Map()); // Используем Map для хранения частот
          }
          if (i > 0) {
            const prevWord = words[i - 1];
            wordContexts.get(word).set(prevWord, (wordContexts.get(word).get(prevWord) || 0) + 1);
          }
          if (i < words.length - 1) {
            const nextWord = words[i + 1];
            wordContexts.get(word).set(nextWord, (wordContexts.get(word).get(nextWord) || 0) + 1);
          }
        }

        // Подсчет биграмм
        for (let i = 0; i < words.length - 1; i++) {
          const bigram = `${words[i]} ${words[i + 1]}`;
          bigramCounts.set(bigram, (bigramCounts.get(bigram) || 0) + 1);
        }
      }
    }

    // Фильтрация редких слов
    const filteredUnigrams = new Map(
      [...unigramCounts].filter(([_, count]) => count >= MIN_FREQUENCY)
    );

    // Анализ и фильтрация биграмм
    const validBigrams = new Set(manualBigrams); // Начинаем с ручных словосочетаний
    const bigramFrequencies = new Map(); // Хранит частоты для биграмм

    // Добавляем частоты для ручных биграмм
    for (const bigram of manualBigrams) {
      bigramFrequencies.set(bigram, bigramCounts.get(bigram) || 0);
    }

    for (const [bigram, count] of bigramCounts) {
      if (count < MIN_BIGRAM_FREQUENCY) continue;

      const [w1, w2] = bigram.split(' ');
      const w1Context = wordContexts.get(w1) || new Map();
      const w2Context = wordContexts.get(w2) || new Map();

      // Проверяем, сколько разных слов встречается с каждым словом
      const w1ContextSize = w1Context.size;
      const w2ContextSize = w2Context.size;

      // Если слово встречается с большим количеством разных слов, пропускаем
      if (w1ContextSize > MAX_CONTEXT_WORDS || w2ContextSize > MAX_CONTEXT_WORDS) {
        continue;
      }

      // Проверяем, является ли это основным сочетанием для обоих слов
      const w1WithW2 = w1Context.get(w2) || 0;
      const w2WithW1 = w2Context.get(w1) || 0;

      // Если слова часто встречаются вместе и у каждого мало других сочетаний
      if (w1WithW2 >= MIN_BIGRAM_FREQUENCY && w2WithW1 >= MIN_BIGRAM_FREQUENCY) {
        validBigrams.add(bigram);
        bigramFrequencies.set(bigram, count);
      }
    }

    // Создаем Map для хранения всех фраз с их частотами
    const phraseFrequencies = new Map();

    // Добавляем биграммы с их частотами
    for (const bigram of validBigrams) {
      phraseFrequencies.set(bigram, bigramFrequencies.get(bigram) || 0);
    }

    // Добавляем одиночные слова с их частотами
    for (const [word, count] of filteredUnigrams) {
      // Проверяем, не является ли слово частью биграммы
      let isPartOfBigram = false;
      for (const bigram of validBigrams) {
        if (bigram.includes(word)) {
          isPartOfBigram = true;
          break;
        }
      }
      if (!isPartOfBigram) {
        phraseFrequencies.set(word, count);
      }
    }

    // Сортируем фразы по частоте (по убыванию)
    const sortedPhrases = [...phraseFrequencies.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([phrase, count]) => `${phrase} (${count})`);

    // Записываем результаты
    fs.writeFileSync('adaptive-phrases.txt', sortedPhrases.join('\n'), 'utf8');
    
    console.log(`Готово! Статистика:`);
    console.log(`- Всего уникальных слов: ${filteredUnigrams.size}`);
    console.log(`- Автоматически найденных биграмм: ${validBigrams.size - manualBigrams.size}`);
    console.log(`- Ручных биграмм: ${manualBigrams.size}`);
    console.log(`- Итоговых фраз: ${phraseFrequencies.size}`);
    console.log(`Результаты записаны в adaptive-phrases.txt`);

  } catch (err) {
    console.error('Ошибка:', err);
  } finally {
    await mongoose.disconnect();
  }
})();
