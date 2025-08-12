// Jest setup file for testing configuration
// Add any global test setup here

// Mock WebGL context for Three.js testing
Object.defineProperty(window, 'WebGLRenderingContext', {
  value: jest.fn(() => ({
    canvas: {},
    drawingBufferWidth: 1024,
    drawingBufferHeight: 768,
    getParameter: jest.fn(),
    getExtension: jest.fn(),
  }))
});

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn();