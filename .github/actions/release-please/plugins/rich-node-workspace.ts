import {type CandidateReleasePullRequest} from 'release-please/build/src/manifest'
import {type Strategy} from 'release-please/build/src/strategy'
import {type Release} from 'release-please/build/src/release'
import {parseConventionalCommits, type Commit} from 'release-please/build/src/commit'
import {NodeWorkspace} from 'release-please/build/src/plugins/node-workspace'
import {PullRequestTitle} from 'release-please/build/src/util/pull-request-title'

export class RichNodeWorkspace extends NodeWorkspace {
  protected postProcessCandidates(candidates: CandidateReleasePullRequest[], updatedVersions: any) {
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