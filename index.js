const core = require('@actions/core');
const { run } = require('./action.js');

run()
  .then(result => {
    console.log('🟢  Done 🎉');
  })
  .catch(error => {
    console.error(`🔴 Error: ${error.message}`);
    core.setFailed(`Action failed with error: ${error.message}`);
  });