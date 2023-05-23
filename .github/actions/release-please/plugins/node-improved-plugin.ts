import {NodeWorkspace} from 'release-please/build/src/plugins/node-workspace'
import {PullRequestTitle} from 'release-please/build/src/util/pull-request-title'

export class NodeImprovedWorkspace extends NodeWorkspace {
  protected postProcessCandidates(candidates: any, b: any) {
    const res = super.postProcessCandidates(candidates, b)
    console.log('post process', res.map(r => r.pullRequest))
    return res
  }
  protected newCandidate(a: any, b: any) {
    const c = super.newCandidate(a, b)
    c.config = {...c.config, ...this.repositoryConfig[c.path]}
    ;(c.pullRequest as any).headRefName += `--components--${c.config.component || c.config.packageName}`
    ;(c.pullRequest as any).title = PullRequestTitle.ofComponentTargetBranchVersion(c.config.component, this.targetBranch, c.pullRequest.version, c.config.pullRequestTitlePattern)
    console.log('new candidate', c)
    return c
  }
}