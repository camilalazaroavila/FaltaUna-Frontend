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
  testEnvironment: 'jsdom',
  collectCoverage: false,
  coverageReporters: ['html', 'text'],
  coverageDirectory: 'coverage',
};

export default config;
