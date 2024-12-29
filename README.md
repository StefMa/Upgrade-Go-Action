# Upgrade Go Action

[![MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/StefMa/Upgrade-Go-Action/blob/main/LICENSE)

## What?

A Github Action that checks for Go upgrades and modifies the `go.mod` file accordingly.

## How?

```yml
- uses: StefMa/Upgrade-Go-Action@main
  with:
    base-branch: 'master' # Defaults to 'main' if absent
    gh-token: {{ secrets.GITHUB_TOKEN }} # Optional. But a custom token can be provided
```

## Why?

It is like [Dependabot](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/about-dependabot-version-updates) or the [Gradle Wrapper Upgrade Gradle Plugin](https://github.com/gradle/wrapper-upgrade-gradle-plugin).
You shouldn't really care about the Go version as long as you don't build a Go library.
You can always be on the bleeding edge 🙂

So, why not?

## Example

A fully working example can bn seen below.
It make sense to run this Action periodically to check for new Go versions.

```yml
name: Upgrade Go

on: 
  workflow_dispatch:
  schedule:
    - cron: "0 8 * * MON"

jobs:
  upgrade-go:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: StefMa/Upgrade-Go-Action@main
        with:
          base-branch: 'master'
          gh-token: ${{ secrets.CUSTOM_TOKEN }}
```

## Action Inputs

Full a full-reference, checkout the [`action.yml`](action.yml) file.

**base-branch**</br>
The (base) branch where the PR will be created against at. Default is main.

**gh-token**</br>
The gh-token that is used to create the pull request. Defaults to `secrets.GITHUB_TOKEN`.
Please note that actions won't run with that token.
So a custom token might be desirable.

## Release

1. Navigate to the [Actions tab](../../actions) in your repository.
2. Select the ["Create Release" workflow](../../actions/workflows/release.yml).
3. Click on "Run workflow" and enter the new version number (e.g., `1.2.3`).

The new version tag will be created as well as the **major** tag will be created or updated.
Also a draft GitHub release will be generated. You can view the releases on the [Releases page](../../releases/latest).

## Developer information links

* [Create a JavaScript GitHub Action](https://docs.github.com/en/actions/creating-actions/creating-a-javascript-action)
* [The GitHub Actions Toolkit repository](https://github.com/actions/toolkit)
* [An "example" GitHub Actions implementation](https://github.com/Blackjacx/backlog-notifier)
