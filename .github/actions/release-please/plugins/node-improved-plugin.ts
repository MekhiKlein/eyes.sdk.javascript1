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
    const config = {...candidate.config, ...this.repositoryConfig[candidate.path]}
    const pullRequest = candidate.pullRequest
    return {
      ...candidate,
      config,
      pullRequest: {
        ...pullRequest,
        title: PullRequestTitle.ofComponentTargetBranchVersion(config.component, this.targetBranch, pullRequest.version, config.pullRequestTitlePattern),
        headRefName: `${pullRequest.headRefName}--components--${config.component || config.packageName}`
      }
    }
  }
}