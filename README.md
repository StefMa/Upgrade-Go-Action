# Upgrade Go Action

[![MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/StefMa/Upgrade-Go-Action/blob/main/LICENSE)

## What?

A Github Action that checks for Go upgrades and modifies the `go.mod` file accordingly.

## How?

```yml
- uses: actions/setup-go@v4
  with:
    go-version: '>=1.20'
    check-latest: true
- uses: StefMa/Upgrade-Go-Action@main
  with:
    base-branch: 'master' # Defaults to 'main' if absent
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

It is required to run the `actions/setup-go` before with the parameters `go-version: '>=[MINIMAL-SUPPORTED-GO-VERSION]'` 
as well as `check-latest: true` to install the latest Go version on the machine.

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
  update-go:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-go@v4
        id: setup-go
        with:
          go-version: '>=1.20'
          check-latest: true
      - uses: StefMa/Upgrade-Go-Action@main
        with:
          base-branch: 'master'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Action Inputs

Full a full-reference, checkout the [`action.yml`](action.yml) file.

**base-branch**</br>
The (base) branch where the PR will be created against at. Default is main.

## Release

1. Checkout the repo (`git clone ...`)
2. Run `npm install`
3. Run `ncc build index.js` (`ncc` required to be installed: `npm i -g @vercel/ncc`)
4. Push to the repo

## Developer information links

* [Create a JavaScript GitHub Action](https://docs.github.com/en/actions/creating-actions/creating-a-javascript-action)
* [The GitHub Actions Toolkit repository](https://github.com/actions/toolkit)
* [An "example" GitHub Actions implementation](https://github.com/Blackjacx/backlog-notifier)
