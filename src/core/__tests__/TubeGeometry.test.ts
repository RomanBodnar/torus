import { describe, it, expect } from 'vitest';
import { Vector3 } from 'three';
import { TubeGeometry } from '../TubeGeometry';

describe('TubeGeometry', () => {
    describe('constructor', () => {
        it('should create instance with default parameters', () => {
            const tube = new TubeGeometry();

            expect(tube.radius).toBe(5);
            expect(tube.height).toBe(20);
            expect(tube.segments).toBe(16);
        });

        it('should create instance with custom parameters', () => {
            const tube = new TubeGeometry(10, 30, 8);

            expect(tube.radius).toBe(10);
            expect(tube.height).toBe(30);
            expect(tube.segments).toBe(8);
        });

        it('should have readonly properties', () => {
            const tube = new TubeGeometry();

            // TypeScript should prevent this, but we can verify the properties exist
            expect(tube).toHaveProperty('radius');
            expect(tube).toHaveProperty('height');
            expect(tube).toHaveProperty('segments');
        });
    });

    describe('getSegmentAngle', () => {
        it('should return 0 for segment 0', () => {
            const tube = new TubeGeometry(5, 20, 8);

            expect(tube.getSegmentAngle(0)).toBe(0);
        });

        it('should return correct angles for segments', () => {
            const tube = new TubeGeometry(5, 20, 8);

            expect(tube.getSegmentAngle(1)).toBeCloseTo(Math.PI / 4, 10);
            expect(tube.getSegmentAngle(2)).toBeCloseTo(Math.PI / 2, 10);
            expect(tube.getSegmentAngle(4)).toBeCloseTo(Math.PI, 10);
            expect(tube.getSegmentAngle(8)).toBeCloseTo(Math.PI * 2, 10);
        });

        it('should handle fractional segments', () => {
            const tube = new TubeGeometry(5, 20, 8);

            expect(tube.getSegmentAngle(0.5)).toBeCloseTo(Math.PI / 8, 10);
            expect(tube.getSegmentAngle(1.5)).toBeCloseTo(3 * Math.PI / 8, 10);
        });

        it('should work with different segment counts', () => {
            const tube4 = new TubeGeometry(5, 20, 4);
            const tube16 = new TubeGeometry(5, 20, 16);

            expect(tube4.getSegmentAngle(1)).toBeCloseTo(Math.PI / 2, 10);
            expect(tube16.getSegmentAngle(1)).toBeCloseTo(Math.PI / 8, 10);
        });
    });

    describe('tubeToWorld', () => {
        it('should convert segment 0, row 0 to correct world position', () => {
            const tube = new TubeGeometry(5, 20, 8);
            const position = tube.tubeToWorld(0, 0);

            // Segment 0 should be at angle 0 (positive X axis)
            // Row 0 should be at y = -height/2
            expect(position.x).toBeCloseTo(5, 10);
            expect(position.y).toBeCloseTo(-10, 10);
            expect(position.z).toBeCloseTo(0, 10);
        });

        it('should convert different segments correctly', () => {
            const tube = new TubeGeometry(5, 20, 8);

            // Segment 2 should be at angle π/2 (positive Z axis)
            const pos2 = tube.tubeToWorld(2, 10);
            expect(pos2.x).toBeCloseTo(0, 10);
            expect(pos2.y).toBeCloseTo(0, 10); // Row 10 = middle of tube
            expect(pos2.z).toBeCloseTo(5, 10);

            // Segment 4 should be at angle π (negative X axis)
            const pos4 = tube.tubeToWorld(4, 10);
            expect(pos4.x).toBeCloseTo(-5, 10);
            expect(pos4.y).toBeCloseTo(0, 10);
            expect(pos4.z).toBeCloseTo(0, 10);
        });

        it('should handle different row positions', () => {
            const tube = new TubeGeometry(5, 20, 8);

            const bottom = tube.tubeToWorld(0, 0);
            const middle = tube.tubeToWorld(0, 10);
            const top = tube.tubeToWorld(0, 20);

            expect(bottom.y).toBeCloseTo(-10, 10);
            expect(middle.y).toBeCloseTo(0, 10);
            expect(top.y).toBeCloseTo(10, 10);
        });

        it('should work with different tube dimensions', () => {
            const tube = new TubeGeometry(10, 40, 16);
            const position = tube.tubeToWorld(0, 20);

            expect(position.x).toBeCloseTo(10, 10);
            expect(position.y).toBeCloseTo(0, 10); // Middle of 40-unit tall tube
            expect(position.z).toBeCloseTo(0, 10);
        });
    });

    describe('worldToTube', () => {
        it('should convert world position back to tube coordinates', () => {
            const tube = new TubeGeometry(5, 20, 8);

            // Test position at segment 0, row 10
            const worldPos = new Vector3(5, 0, 0);
            const tubePos = tube.worldToTube(worldPos);

            expect(tubePos.segment).toBe(0);
            expect(tubePos.row).toBe(10);
        });

        it('should handle different quadrants', () => {
            const tube = new TubeGeometry(5, 20, 8);

            // Positive Z axis (segment 2)
            const pos1 = tube.worldToTube(new Vector3(0, 0, 5));
            expect(pos1.segment).toBe(2);
            expect(pos1.row).toBe(10);

            // Negative X axis (segment 4)
            const pos2 = tube.worldToTube(new Vector3(-5, 0, 0));
            expect(pos2.segment).toBe(4);
            expect(pos2.row).toBe(10);

            // Negative Z axis (segment 6)
            const pos3 = tube.worldToTube(new Vector3(0, 0, -5));
            expect(pos3.segment).toBe(6);
            expect(pos3.row).toBe(10);
        });

        it('should handle negative angles correctly', () => {
            const tube = new TubeGeometry(5, 20, 8);

            // Position in fourth quadrant (negative Z, positive X)
            const pos = tube.worldToTube(new Vector3(3.536, 0, -3.536)); // 45° in fourth quadrant
            expect(pos.segment).toBe(7); // Should wrap to segment 7
        });

        it('should handle different row positions', () => {
            const tube = new TubeGeometry(5, 20, 8);

            const bottom = tube.worldToTube(new Vector3(5, -10, 0));
            const middle = tube.worldToTube(new Vector3(5, 0, 0));
            const top = tube.worldToTube(new Vector3(5, 10, 0));

            expect(bottom.row).toBe(0);
            expect(middle.row).toBe(10);
            expect(top.row).toBe(20);
        });
    });

    describe('coordinate conversion round-trip accuracy', () => {
        it('should maintain accuracy for integer coordinates', () => {
            const tube = new TubeGeometry(5, 20, 8);

            for (let segment = 0; segment < 8; segment++) {
                for (let row = 0; row <= 20; row += 5) {
                    const worldPos = tube.tubeToWorld(segment, row);
                    const tubePos = tube.worldToTube(worldPos);

                    expect(tubePos.segment).toBe(segment);
                    expect(tubePos.row).toBe(row);
                }
            }
        });

        it('should maintain reasonable accuracy for fractional coordinates', () => {
            const tube = new TubeGeometry(5, 20, 16); // More segments for better precision

            // Test with half-segment positions
            for (let segment = 0; segment < 16; segment++) {
                const worldPos = tube.tubeToWorld(segment + 0.5, 10.5);
                const tubePos = tube.worldToTube(worldPos);

                // worldToTube rounds to nearest integer, so we expect integer results
                // The segment should be either segment or segment+1 (due to rounding)
                expect(tubePos.segment === segment || tubePos.segment === (segment + 1) % 16).toBe(true);
                // Row should round to either 10 or 11
                expect(tubePos.row === 10 || tubePos.row === 11).toBe(true);
            }
        });

        it('should handle edge cases near boundaries', () => {
            const tube = new TubeGeometry(5, 20, 8);

            // Test near segment boundary (between segment 7 and 0)
            const worldPos = tube.tubeToWorld(7.9, 10);
            const tubePos = tube.worldToTube(worldPos);

            // worldToTube rounds, so 7.9 should round to 8, which wraps to 0
            expect(tubePos.segment === 0 || tubePos.segment === 7).toBe(true);
            expect(tubePos.row).toBe(10);
        });
    });

    describe('boundary cases and wrapping behavior', () => {
        it('should handle segment wrapping', () => {
            const tube = new TubeGeometry(5, 20, 8);

            // Test positions that should wrap around
            const angle0 = tube.getSegmentAngle(0);
            const angle8 = tube.getSegmentAngle(8);

            expect(angle8).toBeCloseTo(Math.PI * 2, 10);
            expect(angle8 % (Math.PI * 2)).toBeCloseTo(angle0, 10);
        });

        it('should handle negative segment indices in angle calculation', () => {
            const tube = new TubeGeometry(5, 20, 8);

            // Negative segments should still produce valid angles
            const negativeAngle = tube.getSegmentAngle(-1);
            expect(negativeAngle).toBeCloseTo(-Math.PI / 4, 10);
        });

        it('should handle out-of-bounds row values', () => {
            const tube = new TubeGeometry(5, 20, 8);

            // Negative rows
            const negativeRow = tube.tubeToWorld(0, -5);
            expect(negativeRow.y).toBeCloseTo(-15, 10);

            // Rows beyond height
            const highRow = tube.tubeToWorld(0, 25);
            expect(highRow.y).toBeCloseTo(15, 10);
        });

        it('should handle extreme coordinate values', () => {
            const tube = new TubeGeometry(5, 20, 8);

            // Very large segment numbers
            const largeSegment = tube.getSegmentAngle(1000);
            expect(largeSegment).toBeCloseTo(1000 * Math.PI / 4, 10);

            // Very large row numbers
            const largeRow = tube.tubeToWorld(0, 1000);
            expect(largeRow.y).toBeCloseTo(990, 10);
        });

        it('should handle zero-radius edge case', () => {
            const tube = new TubeGeometry(0, 20, 8);
            const position = tube.tubeToWorld(2, 10);

            expect(position.x).toBeCloseTo(0, 10);
            expect(position.z).toBeCloseTo(0, 10);
            expect(position.y).toBeCloseTo(0, 10);
        });

        it('should handle single segment tube', () => {
            const tube = new TubeGeometry(5, 20, 1);

            const angle0 = tube.getSegmentAngle(0);
            const angle1 = tube.getSegmentAngle(1);

            expect(angle0).toBe(0);
            expect(angle1).toBeCloseTo(Math.PI * 2, 10);
        });

        it('should handle worldToTube with positions not exactly on tube surface', () => {
            const tube = new TubeGeometry(5, 20, 8);

            // Position inside the tube
            const inside = tube.worldToTube(new Vector3(2, 0, 0));
            expect(inside.segment).toBe(0);
            expect(inside.row).toBe(10);

            // Position outside the tube
            const outside = tube.worldToTube(new Vector3(10, 0, 0));
            expect(outside.segment).toBe(0);
            expect(outside.row).toBe(10);
        });
    });

    describe('getWorldPosition method', () => {
        it('should be equivalent to tubeToWorld', () => {
            const tube = new TubeGeometry(5, 20, 8);

            for (let segment = 0; segment < 8; segment++) {
                for (let row = 0; row <= 20; row += 5) {
                    const pos1 = tube.getWorldPosition(segment, row);
                    const pos2 = tube.tubeToWorld(segment, row);

                    expect(pos1.x).toBeCloseTo(pos2.x, 10);
                    expect(pos1.y).toBeCloseTo(pos2.y, 10);
                    expect(pos1.z).toBeCloseTo(pos2.z, 10);
                }
            }
        });
    });
});