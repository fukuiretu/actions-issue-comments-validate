import * as core from '@actions/core'
import * as github from '@actions/github'
import {
  getComments,
  GetCommentOption,
  getCheckItems,
  CheckItem,
  checkComment
} from './util'

async function run(): Promise<void> {
  try {
    const token: string = core.getInput('github-token')
    const configPath: string = core.getInput('configuration-path', {
      required: true
    })
    const debug: boolean =
      core.getInput('debug', {required: true}) === 'true' ? true : false
    let option: undefined | GetCommentOption
    if (core.getInput('issue-repo-owner')) {
      option = {
        issueRepoOwner: core.getInput('issue-repo-owner'),
        issueRepoName: core.getInput('issue-repo-name'),
        issueNumber: Number(core.getInput('issue-number'))
      }
    }
    const client: any = github.getOctokit(token, {log: console})

    const checkItems: CheckItem[] = await getCheckItems(
      client,
      configPath,
      debug
    )
    const comments: any = await getComments(client, option)
    const result: any = check(client, checkItems, comments)

    core.debug('===== result =====')
    for (const key in result) {
      core.debug(`key:${key}, value:${result[key]}`)
      core.setOutput(key, result[key])
    }
    core.debug('==================')
  } catch (error) {
    core.setFailed(error.message)
  }
}

function check(
  client: any,
  checkItems: CheckItem[],
  comments: any
): {[key: string]: boolean} {
  core.debug('check start...')

  const result: {[key: string]: boolean} = {}

  for (const comment of comments) {
    core.debug(`comment:${JSON.stringify(comment)}`)

    for (const item of checkItems) {
      core.debug(`check item:${JSON.stringify(item)}`)

      if (result[item.key] === true) {
        core.debug(`already checked true. key:${item.key}`)
        continue
      }

      if (item.bodies && checkComment(comment.body, item) === false) {
        core.debug(
          `body is invalid. key: ${item.key}, expected: ${item.bodies}, got: ${comment.body}.`
        )
        continue
      }

      if (item.users && item.users.includes(comment.user.login) === false) {
        core.debug(
          `user is invalid. key: ${item.key}, expected: ${item.users}, got: ${comment.user.login}.`
        )
        continue
      }

      core.debug(`check valid. key: ${item.key}`)

      result[item.key] = true

      break
    }
  }

  for (const item of checkItems) {
    if (result.hasOwnProperty(item.key) === false) {
      result[item.key] = false
    }
  }

  core.debug('check end.')

  return result
}

run()
