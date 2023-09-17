const { getGoVersion } = require('../action.js');
const assert = require('assert');

describe('Action', function () {
  describe('#getGoVersion()', function () {
    it('should return 1.21', async function () {
      const goVersion = await getGoVersion()
      assert.equal(goVersion, "1.21")
    });
  });
});