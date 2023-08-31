const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');

async function run() {
  try {
      let latestGoVersion;
      const options = {};
      options.listeners = {
          stdout: (data) => {
            latestGoVersion = data.toString().trim();
          },
      };
      await exec.exec('go version', '', options);
      core.info('Current installed go version: ' + latestGoVersion);
      await exec.exec(`/bin/bash -c "go version | grep -o \\"go[0-9]\\+\\.[0-9]\\+\\" | cut -c 3-`, '', options);

      core.info('Latest Go version determinate to: ' + latestGoVersion);
      core.info('Try to modify the go.mod file with that version');

      await exec.exec('go mod edit -go=' + latestGoVersion);
      await exec.exec('go mod tidy');

      let gitChanges;
      const options2 = {};
      options.listeners = {
          stdout: (data) => {
              gitChanges += data.toString();
          },
      };
      await exec.exec('git status -s', '', options2);
      if (gitChanges != undefined || gitChanges != "") {
          core.info('Changes detected. Will create a PR')

          await exec.exec("git config user.name 'github-actions[bot]'");
          await exec.exec("git config user.email 'github-actions[bot]@users.noreply.github.com'");
          await exec.exec("git checkout -b go-upgrade-" + latestGoVersion);
          await exec.exec(`git commit -m "Update Go to version to ` + latestGoVersion + `" .`);
          await exec.exec("git push origin go-upgrade-" + latestGoVersion);

          let token = process.env.GITHUB_TOKEN
          let baseBranch = core.getInput("base-branch")
          let head = "go-upgrade-" + latestGoVersion
          core.info(head)
          github.getOctokit(token).rest.pulls.create({
              owner: github.context.repo.owner,
              repo: github.context.repo.repo,
              title: "Update go version to " + latestGoVersion,
              body: "",
              head: head,
              base: baseBranch
          });
      } else {
          core.info('Seems everything is up to date 🎉');
      }

    } catch (error) {
      core.setFailed(error.message);
    }
}

run();