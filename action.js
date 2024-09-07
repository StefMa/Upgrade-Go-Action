const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');
const tc = require('@actions/tool-cache');

async function run() {
    const go22 = tc.find('go', "1.22")
    const go22Path = `${go22}/bin/go`

    core.info('Get latest Go version');
    var latestGoVersion = await getGoVersion()
    latestGoVersion = await fixLatestVersion(latestGoVersion, go22Path)
  
    core.info('Try to update the "go.mod" file with Go version ' + latestGoVersion)
    await updateGoVersion(latestGoVersion, go22Path)
  
    const changes = await detectGitChanges()
    if (!changes) {
      core.info('No changes detect.\nSeems everything is up to date 🎉')
      return
    }

    if (core.getInput("dry-run") == "true") {
      core.info('Dry run enabled. Will not create a PR')
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

// Respect users that don't use the .Patch version style
// Example: 1.23.0 -> 1.23
async function fixLatestVersion(latestGoVersion, goVersionToUpdateModFile) {
  const goModOutput = await exec.getExecOutput(goVersionToUpdateModFile, ["mod", "edit", "-json"], {silent: true})
  const goModJson = JSON.parse(goModOutput.stdout)
  const currentGoModVersion = goModJson.Go

  if (currentGoModVersion.split('.').length == 2) {
    latestGoVersion = latestGoVersion.slice(0, -2)
  }
  return latestGoVersion
}
  
async function updateGoVersion(latestGoVersion, goVersionToUpdateModFile) {
    await exec.exec(goVersionToUpdateModFile + ' mod edit -go=' + latestGoVersion)
    await exec.exec(goVersionToUpdateModFile + ' mod tidy')
}
  
async function detectGitChanges() {
    let gitChanges = ''
    const execOptionsGitChanges = {}
    execOptionsGitChanges.listeners = {
      stdout: (data) => {
        gitChanges += data.toString()
      },
    };
    await exec.exec('git status -s', '', execOptionsGitChanges)
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