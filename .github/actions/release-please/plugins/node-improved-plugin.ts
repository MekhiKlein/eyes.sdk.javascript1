import {NodeWorkspace} from 'release-please/build/src/plugins/node-workspace'
import {CandidateReleasePullRequest, RepositoryConfig} from 'release-please/build/src/manifest';

export class NodeImprovedWorkspace extends NodeWorkspace {
  protected postProcessCandidates(candidates: any, b: any) {
    const res = super.postProcessCandidates(candidates, b)
    console.log('post process', res)
    return res
  }
  protected newCandidate(a: any, b: any) {
    const c = super.newCandidate(a, b)
    console.log(c, this.repositoryConfig)
    c.config = {...c.config, ...this.repositoryConfig[c.path]}
    return c
  }
}