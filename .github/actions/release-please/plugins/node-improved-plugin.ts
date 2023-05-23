import {NodeWorkspace} from 'release-please/build/src/plugins/node-workspace'
import {CandidateReleasePullRequest, RepositoryConfig} from 'release-please/build/src/manifest';

export class NodeImprovedWorkspace extends NodeWorkspace {
  // protected async buildAllPackages(candidates: CandidateReleasePullRequest[]) {
  //   const res = await super.buildAllPackages(candidates)
  //   console.log(res)
  //   return res
  // }
  protected newCandidate(a: any, b: any) {
    const c = super.newCandidate(a, b)
    console.log(c)
    return c
  }
}