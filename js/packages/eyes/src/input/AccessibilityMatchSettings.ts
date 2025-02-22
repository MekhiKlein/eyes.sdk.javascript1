import * as utils from '@applitools/utils'
import {AccessibilityRegionType, AccessibilityRegionTypeEnum} from '../enums/AccessibilityRegionType'
import {Region, RegionData} from './Region'

export type AccessibilityMatchSettings = {
  region: Region
  type?: AccessibilityRegionType
}

export class AccessibilityMatchSettingsData implements Required<AccessibilityMatchSettings> {
  private _settings: AccessibilityMatchSettings

  constructor(settings: AccessibilityMatchSettings)
  constructor(region: Region)
  constructor(x: number, y: number, width: number, height: number, type?: AccessibilityRegionType)
  constructor(
    settingsOrRegionOrX: AccessibilityMatchSettings | Region | number,
    y?: number,
    width?: number,
    height?: number,
    type?: AccessibilityRegionType,
  ) {
    let settings: AccessibilityMatchSettings
    if (utils.types.isNumber(settingsOrRegionOrX)) {
      settings = {region: {x: settingsOrRegionOrX, y: y!, width: width!, height: height!}, type}
    } else if (!utils.types.has(settingsOrRegionOrX, 'region')) {
      settings = {region: settingsOrRegionOrX}
    } else {
      settings = settingsOrRegionOrX
    }
    utils.guard.isEnumValue(settings.type, AccessibilityRegionTypeEnum, {name: 'type', strict: false})
    utils.guard.isObject(settings.region, {name: 'region'})
    this._settings = settings
  }

  get region(): Region {
    return this._settings.region
  }
  set region(region: Region) {
    utils.guard.isObject(region, {name: 'region'})
    this._settings.region = region
  }
  getRegion(): RegionData {
    return new RegionData(this._settings.region)
  }
  setRegion(region: Region) {
    this.region = region
  }
  getLeft(): number {
    return this.region.x
  }
  setLeft(left: number) {
    this.region.x = left
  }
  getTop(): number {
    return this.region.y
  }
  setTop(top: number) {
    this.region.y = top
  }
  getWidth(): number {
    return this.region.width
  }
  setWidth(width: number) {
    this.region.width = width
  }
  getHeight(): number {
    return this.region.height
  }
  setHeight(height: number) {
    this.region.height = height
  }

  get type(): AccessibilityRegionType {
    return this._settings.type!
  }
  set type(type: AccessibilityRegionType) {
    utils.guard.isEnumValue(type, AccessibilityRegionTypeEnum, {name: 'type', strict: false})
    this._settings.type = type
  }
  getType(): AccessibilityRegionTypeEnum {
    return this.type as AccessibilityRegionTypeEnum
  }
  setType(type: AccessibilityRegionType) {
    this.type = type
  }

  /** @internal */
  toObject(): AccessibilityMatchSettings {
    return this._settings
  }

  /** @internal */
  toJSON(): AccessibilityMatchSettings {
    return utils.general.toJSON(this._settings)
  }

  /** @internal */
  toString(): string {
    return utils.general.toString(this)
  }
}
