import {NodeWorkspace} from 'release-please/build/src/plugins/node-workspace'
import {CandidateReleasePullRequest, RepositoryConfig} from 'release-please/build/src/manifest';

export class NodeImprovedWorkspace extends NodeWorkspace {
  protected newCandidate(a: any, b: any) {
    const c = super.newCandidate(a, b)
    c.config = {...c.config, ...this.repositoryConfig[c.path]}
    return c
  }
}