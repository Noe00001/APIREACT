import '@testing-library/jest-dom';

window.scrollTo = jest.fn();

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
  })
);
