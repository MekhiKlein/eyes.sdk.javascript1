import {type CandidateReleasePullRequest} from 'release-please/build/src/manifest'
import {type ReleasePullRequest} from 'release-please/build/src/release-pull-request'
import {type Strategy} from 'release-please/build/src/strategy'
import {type Release} from 'release-please/build/src/release'
import {type Commit, type ConventionalCommit} from 'release-please/build/src/commit'
import {NodeWorkspace} from 'release-please/build/src/plugins/node-workspace'

export class RichNodeWorkspace extends NodeWorkspace {
  private index = -1
  protected strategiesByPath: Record<string, Strategy> = {}
  protected commitsByPath: Record<string, ConventionalCommit[]> = {}
  protected releasesByPath: Record<string, Release> = {}
  protected releasePullRequestsByPath: Record<string, ReleasePullRequest | undefined> = {}

  async preconfigure(
    strategiesByPath: Record<string, Strategy>,
    _commitsByPath: Record<string, Commit[]>,
    releasesByPath: Record<string, Release>
  ): Promise<Record<string, Strategy>> {
    this.strategiesByPath = strategiesByPath
    this.releasesByPath = releasesByPath
    return strategiesByPath
  }

  processCommits(commits: ConventionalCommit[]): ConventionalCommit[] {
    this.index += 1
    this.commitsByPath[Object.keys(this.strategiesByPath)[this.index]] = commits
    return commits
  }

  async run(candidateReleasePullRequest: CandidateReleasePullRequest[]) {
    this.releasePullRequestsByPath = await Object.entries(this.strategiesByPath).reduce(async (promise, [path, strategy]) => {
      console.log('COMMITS FOR PATH', path, this.commitsByPath[path])
      const releasePullRequest = 
        candidateReleasePullRequest.find(candidateReleasePullRequest => candidateReleasePullRequest.path === path)?.pullRequest ??
        await strategy.buildReleasePullRequest(this.commitsByPath[path], this.releasesByPath[path])
      return promise.then(releasePullRequestsByPath => {
        releasePullRequestsByPath[path] = releasePullRequest
        return releasePullRequestsByPath
      })
    }, Promise.resolve({} as Record<string, ReleasePullRequest | undefined>))
    console.log('RICH NODE WORKSPACE', this.releasePullRequestsByPath)
    return super.run(candidateReleasePullRequest)
  }

  protected newCandidate(pkg: any, updatedVersions: any) {
    const poorCandidateReleasePullRequest = super.newCandidate(pkg, updatedVersions)
    if (!this.releasePullRequestsByPath[poorCandidateReleasePullRequest.path]) {
      return poorCandidateReleasePullRequest
    }
    const candidateReleasePullRequest = {
      path: poorCandidateReleasePullRequest.path,
      pullRequest: this.releasePullRequestsByPath[poorCandidateReleasePullRequest.path]!,
      config: {...this.repositoryConfig[poorCandidateReleasePullRequest.path], separatePullRequests: false}
    }
    return super.updateCandidate(candidateReleasePullRequest, pkg, updatedVersions)
  }
}