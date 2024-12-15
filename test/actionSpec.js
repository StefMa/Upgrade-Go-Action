const { getGoVersion, branchWithNameAlreadyExist } = require('../action.js');
const assert = require('assert');

describe('Action', function () {
  describe('#getGoVersion()', function () {
    it('should return latest version', async function () {
      const goVersion = await getGoVersion()
      assert.equal(goVersion, "1.23.4")
    });
  });

  describe('#branchWithNameAlreadyExist()', function () {
    it('should return false because branch does not exist', async function () {
      let token = process.env.GITHUB_TOKEN
      const exist = await branchWithNameAlreadyExist(
        token,
        "branchWillNeverExists!Hopefully", 
        "StefMa",
        "Upgrade-Go-Action"
      )
      assert.equal(exist, false)
    });
  });

  it('should return true because main branch exist', async function () {
    let token = process.env.GITHUB_TOKEN
    const exist = await branchWithNameAlreadyExist(
      token,
      "main", 
      "StefMa",
      "Upgrade-Go-Action"
    )
    assert.equal(exist, true)
  });
});