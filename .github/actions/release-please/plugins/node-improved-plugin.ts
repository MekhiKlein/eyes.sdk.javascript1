import {NodeWorkspace} from 'release-please/build/src/plugins/node-workspace'
import {CandidateReleasePullRequest, RepositoryConfig} from 'release-please/build/src/manifest';

export class NodeImprovedWorkspace extends NodeWorkspace {
  // protected async buildAllPackages(candidates: CandidateReleasePullRequest[]) {
  //   const res = await super.buildAllPackages(candidates)
  //   console.log(res)
  //   return res
  // }
  protected postProcessCandidates(candidates: any, updatedVersions: any) {
    console.log(candidates, updatedVersions)
    return super.postProcessCandidates(candidates, updatedVersions)
  }
}