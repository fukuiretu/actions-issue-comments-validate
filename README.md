<p align="center">
  <a href="https://github.com/actions/typescript-action/actions"><img alt="typescript-action status" src="https://github.com/actions/typescript-action/workflows/build-test/badge.svg"></a>
</p>

# Issue Comments Validator

Checks the validity of comments associated with an issue and returns true or false.

## Usage

### Create `.github/issue-comments-validate.yml`
Check the validity of the comments in the issue based on this file.

#### Property
##### key (String)
The key of the item to be checked. The value is optional, but should be unique.

##### bodies (Array)
If any of the comments associated with the target issue match any of the specified values, the result is returned as true.

##### users (Array)
If the user who made the comment associated with the target issue has at least one matching value specified, the result is returned as true.

##### userTeams (Array)
Return the result as true if any of the users who commented on the target issue have a specified value that matches one of the users who belong to the team.

#### Examples

```yml
validates:
  - key: check1
    bodies:
      - "@github-actions approved!!"
      - "@github-actions LGTM"
    users:
      - fukuiretu
  - key: check2
    bodies:
      - "@github-actions nice!!"
    userTeams:
      - org: hoge
        team_slug: pjms
```

### Create Workflow

```yml
name: 'issue-comments-validate'
on:
  issue_comment:
    types:
      - created
      - edited

jobs:
  check:
    steps:
      - id: step1
        uses: fukuiretu/actions-issue-comment-validates@main
        with:
          github-token: "${{ secrets.GITHUB_TOKEN }}"
      - id: step2
        run: |
          echo "check1 result: ${{ steps.step1.outputs.check1 }}"
          echo "check2 result: ${{ steps.step1.outputs.check2 }}"
```

_Note: This grants access to the `GITHUB_TOKEN` so the action can make calls to GitHub's rest API_

#### Inputs

Various inputs are defined in [`action.yml`](action.yml) to let you configure the labeler:

| Name | Description | Default |
| - | - | - |
| `repo-token` | The GITHUB_TOKEN secret | N/A |
| `configuration-path` | The path to the label configuration file | `.github/issue-comments-validate.yml` |
| `debug` | If set to true, it will start as debug mode | `false`
| `issue-repo-owner` | Owner of the target issue, required if you want to directly specify the issue you want to check. | N/A
| `issue-repo-name:` | The repo name of the target issue, required if you want to directly specify the issue to be checked. | N/A
| `issue-number:` | The number of the target issue, required if you want to directly specify the issue to be checked. | N/A