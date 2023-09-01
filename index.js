const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');

async function run() {
  core.info('Get current (latest) installed Go version');
  const latestGoVersion = await getGoVersion()

  core.info('Try to update the "go.mod" file with Go version ' + latestGoVersion);
  updateGoVersion(latestGoVersion)

  const changes = detectGitChanges()
  if (changes) {
    core.info('Changes detected. Will create a PR')

    await exec.exec("git config user.name 'github-actions[bot]'");
    await exec.exec("git config user.email 'github-actions[bot]@users.noreply.github.com'");
    await exec.exec("git checkout -b go-upgrade-" + latestGoVersion);
    await exec.exec(`git commit -m "Upgrade Go to version to ` + latestGoVersion + `" .`);
    await exec.exec("git push origin go-upgrade-" + latestGoVersion);

    let title = "Upgrade Go version to " + latestGoVersion
    let head = "go-upgrade-" + latestGoVersion
    let baseBranch = core.getInput("base-branch")

    let token = process.env.GITHUB_TOKEN
    let pullCreateResponse = github.getOctokit(token).rest.pulls.create({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      title: title,
      body: "",
      head: head,
      base: baseBranch
    });
    let prUrl = (await pullCreateResponse).data.html_url

    core.info('PR created. Check it out at ' + prUrl);
  } else {
    core.info('Seems everything is up to date 🎉');
  }
}

async function getGoVersion() {
  let latestGoVersion;
  const execOptionsLatesGoVersion = {};
  execOptionsLatesGoVersion.listeners = {
    stdout: (data) => {
      latestGoVersion = data.toString().trim();
    },
  };
  await exec.exec('go version', '', execOptionsLatesGoVersion);
  await exec.exec(`/bin/bash -c "go version | grep -o \\"go[0-9]\\+\\.[0-9]\\+\\" | cut -c 3-`, '', execOptionsLatesGoVersion);

  return latestGoVersion
}

async function updateGoVersion(goVersion) {
  await exec.exec('go mod edit -go=' + goVersion);
  await exec.exec('go mod tidy');
}

async function detectGitChanges() {
  let gitChanges;
  const execOptionsGitChanges = {};
  execOptionsGitChanges.listeners = {
    stdout: (data) => {
      gitChanges += data.toString();
    },
  };
  await exec.exec('git status -s', '', execOptionsGitChanges);
  return gitChanges != undefined || gitChanges != ""
}

run()
  .then(result => {
    console.log('🟢  Done 🎉');
  })
  .catch(error => {
    console.error(`🔴 Error: ${error.message}`);
    core.setFailed(`Action failed with error: ${error.message}`);
  });