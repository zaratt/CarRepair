#!/usr/bin/env node

import { parseKilometerValue, parseMonetaryValue } from './src/utils/parsing.js';

console.log('🧪 Testando utilitários de parsing...\n');

// Teste parseMonetaryValue
console.log('📊 Teste parseMonetaryValue:');
const monetaryTests = [
    'R$ 550,00',
    '1.500,50',
    '1500',
    '1500,00',
    'R$ 1.000.000,99',
    '',
    null,
    undefined
];

monetaryTests.forEach(test => {
    const result = parseMonetaryValue(test);
    console.log(`  Input: "${test}" => ${result.success ? `✅ ${result.value}` : `❌ ${result.error}`}`);
});

// Teste parseKilometerValue
console.log('\n🛣️  Teste parseKilometerValue:');
const kilometerTests = [
    '152.000',
    '152000',
    '152,000',
    '50.000 km',
    '1.500.000',
    '',
    null,
    undefined
];

kilometerTests.forEach(test => {
    const result = parseKilometerValue(test);
    console.log(`  Input: "${test}" => ${result.success ? `✅ ${result.value}` : `❌ ${result.error}`}`);
});

console.log('\n✅ Testes concluídos!');
