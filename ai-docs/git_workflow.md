---
trigger: manual
---

# Instructions for Git Workflow

This is a set of instructions to the AI Code Generator, regarding the Git Workflow.

## Tools and Commands available for use

* To pull/fetch latest code from repo.

```bash
git pull
```

* To create a new branch.

```bash
git checkout -b <branch-name>   
```

* To commit all changes to repo.

```bash
git push
```

* To get the configured Git user and/or email.

```bash
git config user.name
git config user.email
```

* To create a PR from the feature branch to the `main` branch.

```bash
gh pr create
```

## Instructions

### Before making code changes

* Pull/fetch the latest code from github repo from the `main` branch.
* Create a new branch from `main` branch.

### After making code changes

* Commit all changes to repo.
* Push repo to Github.
* Create a PR from the feature branch to the `main` branch.
* Assign the PR to the configured git user or email in the computer.
* Provide a link to the PR for the user to easily navigate.
* Pause for PR Review and Approval.
