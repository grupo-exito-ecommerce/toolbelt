import chalk from 'chalk'
import {indexOf} from 'ramda'
import log from '../../logger'
import {
  add,
  bump,
  checkGit,
  checkIfInGitRepo,
  commit,
  confirmRelease,
  getNewVersion,
  postRelease,
  preRelease,
  push,
  readVersion,
  tag
} from './utils'

const supportedReleaseTypes = ['major', 'minor', 'patch', 'prerelease']

const supportedTagNames = ['stable', 'beta']

export default async (
  releaseType = 'patch',
  tagName = 'beta'
) => {
  checkGit()
  checkIfInGitRepo()
  // Check if releaseType is valid.
  if (indexOf(releaseType, supportedReleaseTypes) === -1) {
    // TODO: Remove the below log.error when toolbelt has better error handling.
    log.error(`Invalid release type: ${releaseType}
Valid release types are: ${supportedReleaseTypes.join(', ')}`)
    throw new Error(`Invalid release type: ${releaseType}
Valid release types are: ${supportedReleaseTypes.join(', ')}`)
  }
  // Check if tagName is valid.
  if (indexOf(tagName, supportedTagNames) === -1) {
    // TODO: Remove the below log.error when toolbelt has better error handling.
    log.error(`Invalid release tag: ${tagName}
Valid release tags are: ${supportedTagNames.join(', ')}`)
    throw new Error(`Invalid release tag: ${tagName}
Valid release tags are: ${supportedTagNames.join(', ')}`)
  }

  const oldVersion = readVersion()
  const newVersion = getNewVersion(oldVersion, releaseType, tagName)

  log.info(`Old version: ${chalk.bold(oldVersion)}`)
  log.info(`New version: ${chalk.bold.yellow(newVersion)}`)

  const [month, day, year] = new Date()
    .toLocaleDateString(
      'en-US',
      {year: 'numeric', month: '2-digit', day: '2-digit'}
    ).split('/')

  // Pachamama v2 requires that version tags start with a 'v' character.
  const tagText = `v${newVersion}`
  const changelogVersion = `\n\n## [${newVersion}] - ${year}-${month}-${day}`

  if (!(await confirmRelease())) {
    // Abort release.
    return
  }
  log.info('Starting release...')
  try {
    await preRelease()
    await bump(changelogVersion, newVersion)
    await add()
    await commit(tagText)
    await tag(tagText)
    await push(tagText)
    await postRelease()
  } catch (e) {
    log.error(`Failed to release \n${e}`)
  }
}