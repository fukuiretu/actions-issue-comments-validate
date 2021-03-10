import * as core from '@actions/core'
import * as fs from 'fs'
import * as github from '@actions/github'
import * as yaml from 'js-yaml'

export type CheckItem = {
  key: string
  bodies?: string[]
  users?: string[]
}

export async function getCheckItems(
  client: any,
  configurationPath: string,
  debug: boolean
): Promise<CheckItem[]> {
  let config: any
  if (debug === true) {
    config = yaml.safeLoad(fs.readFileSync(configurationPath, 'utf8'))
  } else {
    const configurationContent: string = await fetchContent(
      client,
      configurationPath
    )
    config = yaml.safeLoad(configurationContent)
  }

  if (config === undefined) {
    throw new Error('config yaml is undefined')
  }
  if (config.validates === undefined) {
    throw new Error('Incorrect definition of config file')
  }

  const result: CheckItem[] = []
  for (const v of config.validates) {
    const checkItem: CheckItem = {key: v.key}
    if (v.bodies) {
      checkItem.bodies = v.bodies
    }

    if (v.users) {
      checkItem.users = v.users
    }

    if (v.userTeams) {
      if (!checkItem.users) {
        checkItem.users = []
      }

      for (const userTeam of v.userTeams) {
        const res: any = await client.teams.listMembersInOrg({
          org: userTeam.org,
          team_slug: userTeam.team_slug
        })
        for (const data of res.data) {
          checkItem.users.push(data.login)
        }
      }
    }

    result.push(checkItem)
  }

  return result
}

async function fetchContent(client: any, repoPath: string): Promise<string> {
  core.debug(
    `fetch content. owner: ${github.context.repo.owner}, repo: ${github.context.repo.repo}, path: ${repoPath}`
  )

  const response: any = await client.repos.getContent({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    path: repoPath
  })

  return Buffer.from(response.data.content, response.data.encoding).toString()
}

export type GetCommentOption = {
  issueRepoOwner: string
  issueRepoName: string
  issueNumber: number
}

export async function getComments(
  client,
  option?: GetCommentOption
): Promise<any> {
  const params: any = {
    accept: 'application/vnd.github.v3+json',
    owner: github.context?.payload?.repository?.owner?.login,
    repo: github.context?.payload?.repository?.name,
    issue_number: github.context?.payload?.issue?.number
  }
  if (option) {
    core.debug('option enable mode.')

    params['owner'] = option.issueRepoOwner
    params['repo'] = option.issueRepoName
    params['issue_number'] = option.issueNumber
  }

  core.debug(
    `owner:${params.owner}, repo:${params.repo}, issue_number:${params.issue_number}`
  )

  const res: any = await client.issues.listComments(params)
  core.debug(res)

  return res.data
}

export function checkComment(comment: string, item: any): boolean {
  core.debug(`checkComment来てます。`)
  for (const checkStr of item.bodies) {
    core.debug(
      `debug, key: ${item.key}, expected: ${checkStr}, got: ${comment}.`
    )
    if (comment.includes(checkStr)) {
      core.debug(
        `body is matched. key: ${item.key}, expected: ${checkStr}, got: ${comment}.`
      )
      return true
    }
  }
  return false
}
