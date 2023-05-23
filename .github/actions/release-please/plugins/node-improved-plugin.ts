import {NodeWorkspace} from 'release-please/build/src/plugins/node-workspace'
import {PullRequestTitle} from 'release-please/build/src/util/pull-request-title'

export class NodeImprovedWorkspace extends NodeWorkspace {
  protected postProcessCandidates(candidates: any[], updatedVersions: any) {
    const newCandidates = super.postProcessCandidates(candidates, updatedVersions)
    const labeledCandidate = newCandidates.find(candidate => candidate.pullRequest.labels)
    if (labeledCandidate) {
      newCandidates.forEach(candidate => (candidate.pullRequest as any).labels = labeledCandidate.pullRequest.labels)
    }
    return newCandidates
  }
  protected newCandidate(pkg: any, updatedVersions: any) {
    const candidate = super.newCandidate(pkg, updatedVersions)
    const config = {...candidate.config, ...this.repositoryConfig[candidate.path]}
    const pullRequest = candidate.pullRequest
    console.log(this)
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