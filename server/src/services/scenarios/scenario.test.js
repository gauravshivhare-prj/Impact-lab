/**
 * Tests for scenario comparison service and CPCB Class B threshold boundary conditions.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkBenchmark, CPCB_CLASS_B } from '../../config/benchmarks.js';

describe('CPCB Class B benchmark thresholds', () => {
  describe('Dissolved Oxygen (DO >= 5.0 mg/l)', () => {
    it('passes at exactly 5.00 mg/l (boundary)', () => {
      const result = checkBenchmark('Dissolved oxygen', 5.0);
      assert.equal(result.applicable, true);
      assert.equal(result.passes, true);
      assert.equal(result.exceedance, false);
    });

    it('passes at 5.01 mg/l (just above boundary)', () => {
      const result = checkBenchmark('Dissolved oxygen', 5.01);
      assert.equal(result.applicable, true);
      assert.equal(result.passes, true);
      assert.equal(result.exceedance, false);
    });

    it('fails at 4.99 mg/l (just below boundary)', () => {
      const result = checkBenchmark('Dissolved oxygen', 4.99);
      assert.equal(result.applicable, true);
      assert.equal(result.passes, false);
      assert.equal(result.exceedance, true);
    });

    it('passes at 10.0 mg/l (well above threshold)', () => {
      const result = checkBenchmark('Dissolved oxygen', 10.0);
      assert.equal(result.passes, true);
    });

    it('fails at 0.0 mg/l (zero)', () => {
      const result = checkBenchmark('Dissolved oxygen', 0.0);
      assert.equal(result.passes, false);
      assert.equal(result.exceedance, true);
    });
  });

  describe('BOD (<= 3.0 mg/l)', () => {
    it('passes at exactly 3.00 mg/l (boundary)', () => {
      const result = checkBenchmark('BOD', 3.0);
      assert.equal(result.applicable, true);
      assert.equal(result.passes, true);
      assert.equal(result.exceedance, false);
    });

    it('passes at 2.99 mg/l (just below boundary)', () => {
      const result = checkBenchmark('BOD', 2.99);
      assert.equal(result.applicable, true);
      assert.equal(result.passes, true);
      assert.equal(result.exceedance, false);
    });

    it('fails at 3.01 mg/l (just above boundary)', () => {
      const result = checkBenchmark('BOD', 3.01);
      assert.equal(result.applicable, true);
      assert.equal(result.passes, false);
      assert.equal(result.exceedance, true);
    });

    it('passes at 0.0 mg/l (zero)', () => {
      const result = checkBenchmark('BOD', 0.0);
      assert.equal(result.passes, true);
    });

    it('fails at 10.0 mg/l (well above threshold)', () => {
      const result = checkBenchmark('BOD', 10.0);
      assert.equal(result.passes, false);
      assert.equal(result.exceedance, true);
    });
  });

  describe('pH (6.5 - 8.5 range)', () => {
    it('passes at exactly 6.50 (lower boundary)', () => {
      const result = checkBenchmark('pH', 6.5);
      assert.equal(result.applicable, true);
      assert.equal(result.passes, true);
      assert.equal(result.exceedance, false);
    });

    it('passes at exactly 8.50 (upper boundary)', () => {
      const result = checkBenchmark('pH', 8.5);
      assert.equal(result.applicable, true);
      assert.equal(result.passes, true);
      assert.equal(result.exceedance, false);
    });

    it('fails at 6.49 (just below lower boundary)', () => {
      const result = checkBenchmark('pH', 6.49);
      assert.equal(result.applicable, true);
      assert.equal(result.passes, false);
      assert.equal(result.exceedance, true);
    });

    it('fails at 8.51 (just above upper boundary)', () => {
      const result = checkBenchmark('pH', 8.51);
      assert.equal(result.applicable, true);
      assert.equal(result.passes, false);
      assert.equal(result.exceedance, true);
    });

    it('passes at 7.0 (neutral, middle of range)', () => {
      const result = checkBenchmark('pH', 7.0);
      assert.equal(result.passes, true);
    });

    it('fails at 5.0 (acidic, below range)', () => {
      const result = checkBenchmark('pH', 5.0);
      assert.equal(result.passes, false);
      assert.equal(result.exceedance, true);
    });

    it('fails at 10.0 (alkaline, above range)', () => {
      const result = checkBenchmark('pH', 10.0);
      assert.equal(result.passes, false);
      assert.equal(result.exceedance, true);
    });
  });

  describe('Edge cases', () => {
    it('returns not applicable for null value', () => {
      const result = checkBenchmark('Dissolved oxygen', null);
      assert.equal(result.applicable, false);
      assert.equal(result.reason, 'missing_or_invalid_value');
    });

    it('returns not applicable for undefined value', () => {
      const result = checkBenchmark('Dissolved oxygen', undefined);
      assert.equal(result.applicable, false);
    });

    it('returns not applicable for NaN value', () => {
      const result = checkBenchmark('Dissolved oxygen', NaN);
      assert.equal(result.applicable, false);
    });

    it('returns not applicable for unknown parameter', () => {
      const result = checkBenchmark('Unknown Parameter', 5.0);
      assert.equal(result.applicable, false);
      assert.equal(result.reason, 'no_benchmark_defined');
    });

    it('handles negative values correctly for DO', () => {
      const result = checkBenchmark('Dissolved oxygen', -1.0);
      assert.equal(result.passes, false);
    });

    it('handles negative values correctly for BOD', () => {
      const result = checkBenchmark('BOD', -1.0);
      assert.equal(result.passes, true);
    });
  });

  describe('CPCB Class B configuration', () => {
    it('has correct DO threshold', () => {
      assert.equal(CPCB_CLASS_B.parameters['Dissolved oxygen'].threshold, 5);
      assert.equal(CPCB_CLASS_B.parameters['Dissolved oxygen'].type, 'min');
    });

    it('has correct BOD threshold', () => {
      assert.equal(CPCB_CLASS_B.parameters.BOD.threshold, 3);
      assert.equal(CPCB_CLASS_B.parameters.BOD.type, 'max');
    });

    it('has correct pH range', () => {
      assert.equal(CPCB_CLASS_B.parameters.pH.min, 6.5);
      assert.equal(CPCB_CLASS_B.parameters.pH.max, 8.5);
      assert.equal(CPCB_CLASS_B.parameters.pH.type, 'range');
    });
  });
});
