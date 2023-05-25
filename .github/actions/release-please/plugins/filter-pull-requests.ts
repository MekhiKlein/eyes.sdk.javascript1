import {type RepositoryConfig, type CandidateReleasePullRequest} from 'release-please/build/src/manifest'
import {type GitHub} from 'release-please/build/src/github'
import {type Logger} from 'release-please/build/src/util/logger'
import {ManifestPlugin} from 'release-please/build/src/plugin'

export interface FilterPullRequestsOptions {
  labels?: string[]
  logger?: Logger
}

const DEFAULT_LABELS = ['skip-release']

export class FilterPullRequests extends ManifestPlugin {
  private labels: string[]
  constructor(
    github: GitHub,
    targetBranch: string,
    repositoryConfig: RepositoryConfig,
    options: FilterPullRequestsOptions = {}
  ) {
    super(github, targetBranch, repositoryConfig, options.logger)
    this.labels = options.labels ?? DEFAULT_LABELS
  }

  async run(candidatePullRequests: CandidateReleasePullRequest[]): Promise<CandidateReleasePullRequest[]> {
    console.log('FILTERING OUT PULL REQUESTS', candidatePullRequests.length, candidatePullRequests.map(candidatePullRequest => [candidatePullRequest.path, candidatePullRequest.pullRequest.labels]))
    // filter out pull requests that were labeled to skip
    return candidatePullRequests.filter(candidatePullRequest => {
      return !candidatePullRequest.pullRequest.labels.some(pullRequestLabel => this.labels.includes(pullRequestLabel))
    })
  }
}
