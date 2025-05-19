const fs = require('fs').promises;
const path = require('path');
const acorn = require('acorn');
const walk = require('acorn-walk');
const escodegen = require('escodegen');

async function splitJsFile(inputFile, outputDir) {
    try {
        // Чтение исходного файла
        const code = await fs.readFile(inputFile, 'utf8');
        const ast = acorn.parse(code, { sourceType: 'module', ecmaVersion: 2020 });

        // Создание выходной директории
        await fs.mkdir(outputDir, { recursive: true });

        // Объект для хранения модулей
        const modules = {};
        const dependencies = new Map();
        const usedNames = new Set();

        // Функция для генерации уникального имени файла
        const generateFileName = (name) => {
            let baseName = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            let counter = 0;
            let fileName = baseName;
            while (usedNames.has(fileName)) {
                counter++;
                fileName = `${baseName}${counter}`;
            }
            usedNames.add(fileName);
            return fileName;
        };

        // Сбор всех объявлений функций и классов
        walk.simple(ast, {
            FunctionDeclaration(node) {
                if (node.id?.name) {
                    modules[node.id.name] = node;
                    dependencies.set(node.id.name, new Set());
                }
            },
            ClassDeclaration(node) {
                if (node.id?.name) {
                    modules[node.id.name] = node;
                    dependencies.set(node.id.name, new Set());
                }
            }
        });

        // Анализ зависимостей
        walk.simple(ast, {
            Identifier(node) {
                if (modules[node.name] && node !== ast.body.find(n => n.id?.name === node.name)) {
                    const parentFunction = findParentFunction(node, ast);
                    if (parentFunction?.id?.name) {
                        dependencies.get(parentFunction.id.name)?.add(node.name);
                    }
                }
            }
        });

        // Создание отдельных файлов для каждого модуля
        for (const [name, node] of Object.entries(modules)) {
            const deps = dependencies.get(name) || new Set();
            const imports = Array.from(deps)
                .map(dep => `import { ${dep} } from './${generateFileName(dep)}.js';`)
                .join('\n');
            
            const moduleCode = escodegen.generate(node);
            const fileContent = `${imports}\n\nexport const ${name} = ${moduleCode.slice(moduleCode.indexOf('function') || moduleCode.indexOf('class'))};`;
            
            const fileName = path.join(outputDir, `${generateFileName(name)}.js`);
            await fs.writeFile(fileName, fileContent);
        }

        // Создание основного файла
        const mainImports = Object.keys(modules)
            .map(name => `import { ${name} } from './${generateFileName(name)}.js';`)
            .join('\n');
        
        const mainExports = `export { ${Object.keys(modules).join(', ')} };`;
        const mainFileContent = `${mainImports}\n\n${mainExports}`;
        await fs.writeFile(path.join(outputDir, 'index.js'), mainFileContent);

        console.log(`Файл успешно разделен. Результат в директории: ${outputDir}`);
    } catch (error) {
        console.error('Ошибка при разделении файла:', error);
    }
}

// Вспомогательная функция для поиска родительской функции
function findParentFunction(node, ast) {
    let current = node;
    while (current) {
        if (current.type === 'FunctionDeclaration' && current.id?.name) {
            return current;
        }
        current = findParent(current, ast);
    }
    return null;
}

// Вспомогательная функция для поиска родительского узла
function findParent(node, ast) {
    for (const key in ast) {
        if (ast[key] === node) {
            return ast;
        }
        if (typeof ast[key] === 'object' && ast[key] !== null) {
            const parent = findParent(node, ast[key]);
            if (parent) return parent;
        }
    }
    return null;
}

// Использование: node split-js-file.js input.js output_directory
if (require.main === module) {
    const [, , inputFile, outputDir] = process.argv;
    if (!inputFile || !outputDir) {
        console.error('Использование: node split-js-file.js <input_file> <output_directory>');
        process.exit(1);
    }
    splitJsFile(inputFile, outputDir);
}
