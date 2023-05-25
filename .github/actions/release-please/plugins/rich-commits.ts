import {type CandidateReleasePullRequest} from 'release-please/build/src/manifest'
import {type Strategy} from 'release-please/build/src/strategy'
import {type BaseStrategy} from 'release-please/build/src/strategies/base'
import {type Release} from 'release-please/build/src/release'
import {parseConventionalCommits, type Commit} from 'release-please/build/src/commit'
import {ManifestPlugin} from 'release-please/build/src/plugin'

export class RichCommits extends ManifestPlugin {
  async preconfigure(
    strategiesByPath: Record<string, Strategy>,
    commitsByPath: Record<string, Commit[]>,
    _releasesByPath: Record<string, Release>
  ): Promise<Record<string, Strategy>> {
    for (const path in strategiesByPath) {
      const strategy = strategiesByPath[path] as BaseStrategy
      const commits = commitsByPath[path]
      const component = (await strategy.getComponent()) || ''
  
      commitsByPath[path] = this.filterRedundantCommits(commits, component)
      const conventionalCommits = parseConventionalCommits(commitsByPath[path], this.logger)

      // add extra label to strategies that should be skipped
      console.log('Conventional commits for COMPONENT', component, commits, conventionalCommits)
      const skipReleaseConventionalCommit = [...conventionalCommits].reverse().find(conventionalCommit => {
        return conventionalCommit.notes.some(note => note.title.toLowerCase() === 'skip-release')
      })
      console.log('SKIP RELEASE FOR COMPONENT', component, !!skipReleaseConventionalCommit)
      if (skipReleaseConventionalCommit) {
        const skipReleaseNote = [...skipReleaseConventionalCommit.notes].reverse().find(note => note.title.toLowerCase() === 'skip-release')!
        console.log('SKIP RELEASE NOTE FOR COMPONENT', component, skipReleaseNote)
        if (skipReleaseNote.text === 'true') {
          strategy.extraLabels.push('skip-release')
        }
      }
    }
    return strategiesByPath
  }

  async run(candidatePullRequests: CandidateReleasePullRequest[]): Promise<CandidateReleasePullRequest[]> {
    console.log('FILTERING OUT PULL REQUESTS', candidatePullRequests.length, candidatePullRequests.map(candidatePullRequest => [candidatePullRequest.path, candidatePullRequest.pullRequest.labels]))
    // filter out pull requests that were labeled to skip
    return candidatePullRequests.filter(candidatePullRequest => {
      return !candidatePullRequest.pullRequest.labels.includes('skip-release')
    })
  }

  protected filterRedundantCommits(commits: Commit[], component: string): Commit[] {
    // if empty commit has scope it should contain component in order to be attached to the path
    const conventionalCommits = parseConventionalCommits(commits, this.logger)
    const redundantConventionalCommits = conventionalCommits.filter(conventionalCommit => {
      return (
        (conventionalCommit.files?.length ?? 0) === 0 &&
        (conventionalCommit.scope && !conventionalCommit.scope.split(/,\s*/g).includes(component))
      )
    })
    if (redundantConventionalCommits.length === 0) {
      return commits
    }
    return commits.filter(commit => !redundantConventionalCommits.some(redundantCommit => commit.sha === redundantCommit.sha))
  }
}
