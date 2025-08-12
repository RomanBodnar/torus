// Vitest setup file for testing configuration
import { vi } from 'vitest';

// Mock WebGL context for Three.js testing
Object.defineProperty(window, 'WebGLRenderingContext', {
  value: vi.fn(() => ({
    canvas: {},
    drawingBufferWidth: 1024,
    drawingBufferHeight: 768,
    getParameter: vi.fn(),
    getExtension: vi.fn(),
  }))
});

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16));
global.cancelAnimationFrame = vi.fn();