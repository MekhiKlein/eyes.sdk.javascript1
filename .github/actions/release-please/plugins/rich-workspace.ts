import {type GitHub} from 'release-please/build/src/github'
import {type RepositoryConfig, type CandidateReleasePullRequest} from 'release-please/build/src/manifest'
import {type ReleasePullRequest} from 'release-please/build/src/release-pull-request'
import {type Strategy} from 'release-please/build/src/strategy'
import {type BaseStrategy} from 'release-please/build/src/strategies/base'
import {type Version} from 'release-please/build/src/version'
import {type Release} from 'release-please/build/src/release'
import {type Commit, type ConventionalCommit} from 'release-please/build/src/commit'
import {type WorkspacePlugin, type WorkspacePluginOptions, type DependencyGraph} from 'release-please/build/src/plugins/workspace'
import {ManifestPlugin} from 'release-please/build/src/plugin'
import {buildPlugin} from 'release-please/build/src/factories/plugin-factory'

export interface RichWorkspaceOptions extends WorkspacePluginOptions {
  manifestPath: string;
  workspace: 'node' | 'maven'
}

export class RichWorkspace extends ManifestPlugin {
  private index = -1
  protected plugin: WorkspacePlugin<unknown>
  protected strategiesByPath: Record<string, Strategy> = {}
  protected commitsByPath: Record<string, ConventionalCommit[]> = {}
  protected releasesByPath: Record<string, Release> = {}
  protected releasePullRequestsByPath: Record<string, ReleasePullRequest | undefined> = {}

  constructor(
    github: GitHub,
    targetBranch: string,
    repositoryConfig: RepositoryConfig,
    options: RichWorkspaceOptions
  ) {
    super(github, targetBranch, repositoryConfig, options.logger);
    const workspacePlugin = buildPlugin({
      type: {type: `${options.workspace}-workspace`, merge: false},
      github,
      targetBranch,
      repositoryConfig,
      ...options,
    }) as WorkspacePlugin<unknown>
    this.plugin = this.patchWorkspacePlugin(workspacePlugin)
  }

  preconfigure(
    strategiesByPath: Record<string, Strategy>,
    commitsByPath: Record<string, Commit[]>,
    releasesByPath: Record<string, Release>
  ): Promise<Record<string, Strategy>> {
    this.strategiesByPath = strategiesByPath
    this.releasesByPath = releasesByPath
    return this.plugin.preconfigure(strategiesByPath, commitsByPath, releasesByPath)
  }

  processCommits(commits: ConventionalCommit[]): ConventionalCommit[] {
    this.index += 1
    this.commitsByPath[Object.keys(this.strategiesByPath)[this.index]] = commits
    return this.plugin.processCommits(commits)
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
    const updatedCandidateReleasePullRequests = await this.plugin.run(candidateReleasePullRequest)

    return updatedCandidateReleasePullRequests.filter(candidatePullRequest => {
      return !candidatePullRequest.pullRequest.labels.some(label => label === 'skip-release')
    })
  }

  protected patchWorkspacePlugin(workspacePlugin: WorkspacePlugin<unknown>): WorkspacePlugin<unknown> {
    const self = this

    const patchedWorkspacePlugin = Object.create(workspacePlugin) as any
    patchedWorkspacePlugin.buildGraph = patchedBuildGraph.bind(workspacePlugin)
    patchedWorkspacePlugin.newCandidate = patchedNewCandidate.bind(workspacePlugin)
    return patchedWorkspacePlugin

    async function patchedBuildGraph(pkgs: unknown[]): Promise<DependencyGraph<any>> {
      const graph = await (workspacePlugin as any).buildGraph(pkgs)
      for (const packageName of graph.keys()) {
        let packageStrategy: BaseStrategy | undefined
        for (const strategy of Object.values(self.strategiesByPath) as BaseStrategy[]) {
          if (await strategy.getPackageName() === packageName) {
            packageStrategy = strategy
            break
          }
        }
        if (packageStrategy?.extraLabels.includes('skip-release')) {
          graph.delete(packageName)
        }
      }
      return graph
    }
    function patchedNewCandidate(pkg: any, updatedVersions: Map<string, Version>): CandidateReleasePullRequest {
      const {path} = (workspacePlugin as any).newCandidate(pkg, updatedVersions)
      const candidateReleasePullRequest = {
        path,
        pullRequest: self.releasePullRequestsByPath[path]!,
        config: self.repositoryConfig[path]
      }
      return (workspacePlugin as any).updateCandidate(candidateReleasePullRequest, pkg, updatedVersions)
    }
  }
}