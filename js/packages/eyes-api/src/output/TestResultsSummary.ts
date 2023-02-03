import {CoreSpec, CoreTestResultContainer, CoreTestResultSummary} from '../Core'
import {TestResultContainer, TestResultContainerData} from './TestResultContainer'

export type TestResultsSummary = Iterable<TestResultContainer>

export class TestResultsSummaryData implements Iterable<TestResultContainerData> {
  private _summary?: CoreTestResultSummary
  private _deleteTest?: CoreSpec['deleteTest']

  /** @internal */
  constructor(options?: {summary?: CoreTestResultSummary; deleteTest?: CoreSpec['deleteTest']}) {
    this._summary = options?.summary
    this._deleteTest = options?.deleteTest
  }

  getAllResults(): TestResultContainerData[] {
    return (
      this._summary?.results.map(container => {
        return new TestResultContainerData({container, deleteTest: this._deleteTest})
      }) ?? []
    )
  }

  [Symbol.iterator](): Iterator<TestResultContainerData> {
    return (
      this._summary?.results
        .map(container => {
          return new TestResultContainerData({container, deleteTest: this._deleteTest})
        })
        [Symbol.iterator]() ?? [][Symbol.iterator]()
    )
  }

  /** @internal */
  toJSON(): CoreTestResultContainer[] {
    return this._summary?.results ?? []
  }

  /** @internal */
  toString() {
    return (
      'result summary {' +
      '\n\tpassed=' +
      this._summary?.passed +
      '\n\tunresolved=' +
      this._summary?.unresolved +
      '\n\tfailed=' +
      this._summary?.failed +
      '\n\texceptions=' +
      this._summary?.exceptions +
      '\n\tmismatches=' +
      this._summary?.mismatches +
      '\n\tmissing=' +
      this._summary?.missing +
      '\n\tmatches=' +
      this._summary?.matches +
      '\n}'
    )
  }
}
