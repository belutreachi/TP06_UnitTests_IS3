/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'cobertura'], // Agregado 'cobertura' para Azure
  coverageThreshold: {
    global: { lines: 20, functions: 20, branches: 10, statements: 20 }
  },
  setupFilesAfterEnv: [
    '<rootDir>/tests/setupTests.js',
    '<rootDir>/tests/frontend/setupFrontend.js'
  ],
  
  // Configuración de reportes para Azure DevOps
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './test-results',
        outputName: 'junit.xml',
        ancestorSeparator: ' › ',
        uniqueOutputName: 'false',
        suiteNameTemplate: '{filepath}',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}'
      }
    ]
  ]
};