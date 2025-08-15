import '@testing-library/jest-dom';
global.alert = jest.fn();
global.confirm = jest.fn(() => true);
global.prompt = jest.fn(() => null);

// Silenciar window.alert en jsdom para evitar el warning/console.error
if (typeof window !== 'undefined' && !window.alert?.mock) {
  jest.spyOn(window, 'alert').mockImplementation(() => {});
}
