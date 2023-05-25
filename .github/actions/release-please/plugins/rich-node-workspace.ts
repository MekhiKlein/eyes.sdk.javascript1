import {type CandidateReleasePullRequest} from 'release-please/build/src/manifest'
import {type ReleasePullRequest} from 'release-please/build/src/release-pull-request'
import {type Strategy} from 'release-please/build/src/strategy'
import {type BaseStrategy} from 'release-please/build/src/strategies/base'
import {type Version} from 'release-please/build/src/version'
import {type Release} from 'release-please/build/src/release'
import {type Commit, type ConventionalCommit} from 'release-please/build/src/commit'
import {type DependencyGraph} from 'release-please/build/src/plugins/workspace'
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
    const updateDepsCommit = {
      sha: '',
      message: 'deps: update some dependencies',
      files: [],
      pullRequest: undefined,
      type: 'deps',
      scope: undefined,
      bareMessage: 'update some dependencies',
      notes: [],
      references: [],
      breaking: false
    }
    this.releasePullRequestsByPath = await Object.entries(this.strategiesByPath).reduce(async (promise, [path, strategy]) => {
      const releasePullRequest = 
        candidateReleasePullRequest.find(candidateReleasePullRequest => candidateReleasePullRequest.path === path)?.pullRequest ??
        await strategy.buildReleasePullRequest([...this.commitsByPath[path], updateDepsCommit], this.releasesByPath[path])
      return promise.then(releasePullRequestsByPath => {
        releasePullRequestsByPath[path] = releasePullRequest
        return releasePullRequestsByPath
      })
    }, Promise.resolve({} as Record<string, ReleasePullRequest | undefined>))
    console.log('RICH NODE WORKSPACE', this.releasePullRequestsByPath)
    return super.run(candidateReleasePullRequest)
  }

  protected async buildGraph(pkgs: any[]): Promise<DependencyGraph<any>> {
    const graph = await super.buildGraph(pkgs)
    console.log('DEPS GRAPH', graph)
    for (const packageName of graph.keys()) {
      console.log('DEPS GRAPH PACKAGE', packageName)
      let packageStrategy: BaseStrategy | undefined
      for (const strategy of Object.values(this.strategiesByPath) as BaseStrategy[]) {
        if (await strategy.getPackageName() === packageName) {
          packageStrategy = strategy
          break
        }
      }
      console.log('DEPS GRAPH STRATEGY', !!packageStrategy)
      if (packageStrategy?.extraLabels.includes('skip-release')) {
        console.log('DEPS GRAPH REMOVE', packageName)
        graph.delete(packageName)
      }
    }
    return graph
  }

  protected newCandidate(pkg: any, updatedVersions: Map<string, Version>) {
    const {path} = super.newCandidate(pkg, updatedVersions)
    const candidateReleasePullRequest = {
      path,
      pullRequest: this.releasePullRequestsByPath[path]!,
      config: this.repositoryConfig[path]
    }
    return super.updateCandidate(candidateReleasePullRequest, pkg, updatedVersions)
  }
}