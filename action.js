const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');
const tc = require('@actions/tool-cache');

async function run() {
    const go22 = tc.find('go', "1.22")
    const go22Path = `${go22}/bin/go`

    core.info('Get current Go version in go.mod');
    var currentGoModVersion = await getCurrentGoModVersion(go22Path)

    core.info('Get latest Go version');
    var latestGoVersion = await getGoVersion()
    latestGoVersion = await fixLatestVersion(currentGoModVersion, latestGoVersion)
  
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
      currentGoModVersion,
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

async function getCurrentGoModVersion(goVersionToUpdateModFile) {
  const goModOutput = await exec.getExecOutput(goVersionToUpdateModFile, ["mod", "edit", "-json"], {silent: true})
  const goModJson = JSON.parse(goModOutput.stdout)
  return goModJson.Go
}

// Respect users that don't use the .Patch version style
// Example: 1.23.0 -> 1.23
async function fixLatestVersion(currentGoModVersion, latestGoVersion) {
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

async function createPullRequest(githubToken, branchName, repoOwner, repoName, currentGoVersion, latestGoVersion) {
  await exec.exec("git config user.name 'github-actions[bot]'");
  await exec.exec("git config user.email 'github-actions[bot]@users.noreply.github.com'");
  await exec.exec("git checkout -b " + branchName);
  await exec.exec(`git commit -m "Bump Go to version from ${currentGoVersion} to ${latestGoVersion}" .`);
  await exec.exec("git push origin " + branchName);

  let latestGoVersionForReleaseNotes = latestGoVersion
  if (latestGoVersion.split('.').length == 2) {
    latestGoVersionForReleaseNotes = latestGoVersion + ".0"
  }

  let title = `Bump Go from ${currentGoVersion} to ${latestGoVersion}`
  let body = `Bump Go from ${currentGoVersion} to ${latestGoVersion}\n\nRelease notes of Go ${latestGoVersion} can be found here:\nhttps://go.dev/doc/devel/release#go${latestGoVersionForReleaseNotes}`
  let baseBranch = core.getInput("base-branch")

  let pullCreateResponse = github.getOctokit(githubToken).rest.pulls.create({
    owner: repoOwner,
    repo: repoName,
    title: title,
    body: body,
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