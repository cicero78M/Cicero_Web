module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'ts-jest'
  },
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react-jsx'
      }
    }
  }
};
