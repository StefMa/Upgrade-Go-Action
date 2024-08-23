const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');

async function run() {
    core.info('Get current (latest(?)) installed Go version from host');
    const latestGoVersion = await getGoVersion()
  
    core.info('Try to update the "go.mod" file with Go version ' + latestGoVersion);
    updateGoVersion(latestGoVersion)
  
    const changes = await detectGitChanges()
    if (!changes) {
      core.info('No changes detect.\nSeems everything is up to date 🎉');
      return
    }

    let githubToken = process.env.GITHUB_TOKEN
    let repoOwner = github.context.repo.owner
    let repoName = github.context.repo.repo
    const branchName = "go-upgrade-" + latestGoVersion
    const branchAlreadyExist = await branchWithNameAlreadyExist(
      githubToken,
      branchName, 
      repoOwner,
      repoName
    )
    if (branchAlreadyExist) {
      core.info('Branch with name ' + branchName + ' already exist.\nSeems everything is up to date 🎉');
      return
    }

    core.info('Will create a PR')
    let prUrl = await createPullRequest(
      githubToken,
      branchName,
      repoOwner,
      repoName,
      latestGoVersion
    )
    core.info('PR created. Check it out at ' + prUrl);
}
  
async function getGoVersion() {
  const response = await fetch('https://go.dev/dl/?mode=json');
  const data = await response.json();
  const version = data[0].version;
  const goVersion = version.replace('go', '');
  return goVersion;
}
  
async function updateGoVersion(goVersion) {
    await exec.exec('go mod edit -go=' + goVersion);
    await exec.exec('go mod tidy');
}
  
async function detectGitChanges() {
    let gitChanges = '';
    const execOptionsGitChanges = {};
    execOptionsGitChanges.listeners = {
      stdout: (data) => {
        gitChanges += data.toString();
      },
    };
    await exec.exec('git status -s', '', execOptionsGitChanges);
    return gitChanges !== ''
}

async function branchWithNameAlreadyExist(githubToken, branchName, repoOwner, repoName) {
  let listBranchesResponse = github.getOctokit(githubToken).rest.repos.listBranches({
    owner: repoOwner,
    repo: repoName,
  })
  let brancheWithName = (await listBranchesResponse).data.find(item => {
    return item.name == branchName
  })

  return brancheWithName != undefined
}

async function createPullRequest(githubToken, branchName, repoOwner, repoName, latestGoVersion) {
  await exec.exec("git config user.name 'github-actions[bot]'");
  await exec.exec("git config user.email 'github-actions[bot]@users.noreply.github.com'");
  await exec.exec("git checkout -b " + branchName);
  await exec.exec(`git commit -m "Upgrade Go to version to ` + latestGoVersion + `" .`);
  await exec.exec("git push origin " + branchName);

  let title = "Upgrade Go version to " + latestGoVersion
  let baseBranch = core.getInput("base-branch")

  let pullCreateResponse = github.getOctokit(githubToken).rest.pulls.create({
    owner: repoOwner,
    repo: repoName,
    title: title,
    body: "",
    head: branchName,
    base: baseBranch
  });

  return (await pullCreateResponse).data.html_url
}

module.exports = {
    run,
    getGoVersion,
    branchWithNameAlreadyExist
}