import type { Config } from 'jest';

const config: Config = {
  displayName: 'frontend',
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testMatch: ['**/src/**/*.spec.ts'],
  transform: {
    '^.+\\.(ts|js|mjs|html|svg)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'html', 'js', 'json', 'mjs'],
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@compartidos/(.*)$': '<rootDir>/src/app/compartidos/$1',
    '^@modelos/(.*)$': '<rootDir>/src/app/modelos/$1',
    '^@servicios/(.*)$': '<rootDir>/src/app/servicios/$1',
    '^@paginas/(.*)$': '<rootDir>/src/app/paginas/$1',
    '^@svgs/(.*)$': '<rootDir>/src/app/compartidos/SVGs/$1',
    '^@environments/(.*)$': '<rootDir>/src/environments/$1',
  },
  testEnvironment: 'jsdom',
  collectCoverage: false,
  coverageReporters: ['html', 'text'],
  coverageDirectory: 'coverage',
};

export default config;
