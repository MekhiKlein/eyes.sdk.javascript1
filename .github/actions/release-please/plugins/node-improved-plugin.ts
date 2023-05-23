import {NodeWorkspace} from 'release-please/build/src/plugins/node-workspace'
import {PullRequestTitle} from 'release-please/build/src/util/pull-request-title'

export class NodeImprovedWorkspace extends NodeWorkspace {
  protected postProcessCandidates(candidates: any, b: any) {
    const res = super.postProcessCandidates(candidates, b)
    console.log('post process', res.map(r => r.pullRequest))
    return res
  }
  protected newCandidate(a: any, b: any) {
    const candidate = super.newCandidate(a, b)
    return {
      ...candidate,
      config: {...candidate.config, ...this.repositoryConfig[candidate.path]},
      pullRequest: {
        ...candidate.pullRequest,
        title: PullRequestTitle.ofComponentTargetBranchVersion(candidate.config.component, this.targetBranch, candidate.pullRequest.version, candidate.config.pullRequestTitlePattern),
        headRefName: `${candidate.pullRequest.headRefName}--components--${candidate.config.component || candidate.config.packageName}`
      }
    }
  }
}