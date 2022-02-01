import assert from "assert"
import test from "../src/index.js"

describe('First Test', function() {
  describe('testing if test var = 1', function() {
    it('should return test var is = 1', function() {
      assert.equal(test, 1);
    });
  });
});
