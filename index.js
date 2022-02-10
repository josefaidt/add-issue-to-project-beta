import { getInput, setOutput, setFailed } from '@actions/core'
import { context } from '@actions/github'
import { graphql } from '@octokit/graphql'

const gql = String.raw

const MUTATION_ADD_TO_PROJECT = gql`
  mutation ADD_TO_PROJECT($projectId: String!, $contentId: String!) {
    addProjectNextItem(
      input: { projectId: $projectId, contentId: $contentId }
    ) {
      projectNextItem {
        id
      }
    }
  }
`
const QUERY_GET_PROJECT_ID_BY_NUMBER_BY_USER = gql`
  query GET_PROJECT_ID_BY_NUMBER_BY_USER($owner: String!, $number: Int!) {
    user(login: $owner) {
      projectNext(number: $number) {
        id
      }
    }
  }
`
const QUERY_PROJECT_ID_BY_NUMBER_BY_ORGANIZATION = gql`
  query GET_PROJECT_ID_BY_NUMBER_BY_ORGANIZATION(
    $owner: String!
    $number: Int!
  ) {
    organization(login: $owner) {
      projectNext(number: $number) {
        id
      }
    }
  }
`
const QUERY_GET_OWNER_TYPE = gql`
  query GET_OWNER_TYPE($owner: String!) {
    repositoryOwner(login: $owner) {
      __typename
    }
  }
`

const GITHUB_PROJECT_NUMBER = parseInt(getInput('project-number'), 10)
const GITHUB_PROJECT_OWNER = getInput('project-owner')
const GITHUB_TOKEN = getInput('github-token')
const GITHUB_CONTENT_ID = context.payload.issue.node_id

const GITHUB = {
  User: 'User',
  Organization: 'Organization',
}

const request = graphql.defaults({
  headers: {
    authorization: `token ${GITHUB_TOKEN}`,
  },
})

try {
  const ownerType = (
    await request(QUERY_GET_OWNER_TYPE, { owner: GITHUB_PROJECT_OWNER })
  )?.repositoryOwner?.__typename

  if (!ownerType) {
    setFailed(`Owner ${GITHUB_PROJECT_OWNER} not found`)
    process.exit(1)
  }

  let QUERY_GET_PROJECT_ID_BY_NUMBER
  if (ownerType === GITHUB.User) {
    QUERY_GET_PROJECT_ID_BY_NUMBER = QUERY_GET_PROJECT_ID_BY_NUMBER_BY_USER
  }
  if (ownerType === GITHUB.Organization) {
    QUERY_GET_PROJECT_ID_BY_NUMBER = QUERY_PROJECT_ID_BY_NUMBER_BY_ORGANIZATION
  }
  if (!QUERY_GET_PROJECT_ID_BY_NUMBER) {
    setFailed(`Owner type ${ownerType} not recognized`)
    process.exit(1)
  }

  const projectId = (
    await request(QUERY_GET_PROJECT_ID_BY_NUMBER, {
      owner: GITHUB_PROJECT_OWNER,
      number: GITHUB_PROJECT_NUMBER,
    })
  )?.[ownerType.toLowerCase()]?.projectNext?.id

  if (!projectId) {
    setFailed(
      `Could not find project ID for ${GITHUB_PROJECT_OWNER}/${GITHUB_PROJECT_NUMBER}`
    )
    process.exit(1)
  }

  const projectItemId = (
    await request(MUTATION_ADD_TO_PROJECT, {
      projectId,
      contentId: GITHUB_CONTENT_ID,
    })
  )?.addProjectNextItem?.projectNextItem?.id

  setOutput('project-item-id', projectItemId)
} catch (error) {
  console.error(error)
  setFailed(error.message)
}
