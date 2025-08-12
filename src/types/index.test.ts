import { TetrominoType, GameStatus } from './index';

describe('Core Types and Enums', () => {
  test('TetrominoType enum should have all expected values', () => {
    expect(TetrominoType.I).toBe('I');
    expect(TetrominoType.O).toBe('O');
    expect(TetrominoType.T).toBe('T');
    expect(TetrominoType.S).toBe('S');
    expect(TetrominoType.Z).toBe('Z');
    expect(TetrominoType.J).toBe('J');
    expect(TetrominoType.L).toBe('L');
  });

  test('GameStatus enum should have all expected values', () => {
    expect(GameStatus.PLAYING).toBe('PLAYING');
    expect(GameStatus.PAUSED).toBe('PAUSED');
    expect(GameStatus.GAME_OVER).toBe('GAME_OVER');
    expect(GameStatus.MENU).toBe('MENU');
  });
});