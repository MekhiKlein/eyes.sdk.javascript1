import {type UFGRequests} from '../../src/server/requests'
import {makeResource} from '../../src/resources/resource'
import {makeProcessResources} from '../../src/resources/process-resources'
import {makeFetchResource} from '../../src/resources/fetch-resource'
import {makeUploadResource} from '../../src/resources/upload-resource'
import {makeFixtureResources as makeFixtureCssResources} from '../fixtures/page/test.css.resources'
import {makeFixtureResources as makeFixtureSvgResources} from '../fixtures/page/with-style.svg.resources'
import {readFileSync} from 'fs'
import {makeLogger} from '@applitools/logger'
import {makeTestServer} from '@applitools/test-server'
import nock from 'nock'
import assert from 'assert'
import {type VerifyableAsynCache, makeAsyncCache} from '../utils/fake-async-cache'

describe('processResources', () => {
  let server: any, baseUrl: string
  const fetchResource = makeFetchResource({logger: makeLogger()})
  const uploadResource = makeUploadResource({
    requests: {
      checkResources: async ({resources}) => Array(resources.length).fill(true),
    } as UFGRequests,
    logger: makeLogger(),
  })

  before(async () => {
    server = await makeTestServer()
    baseUrl = `http://localhost:${server.port}`
  })

  after(async () => {
    await server.close()
  })

  for (const mode of [
    ['sync cache', () => undefined],
    ['async cache', makeAsyncCache],
  ] as [string, () => VerifyableAsynCache | undefined][]) {
    it(`works for absolute urls (${mode[0]})`, async () => {
      const processResources = makeProcessResources({
        fetchResource,
        uploadResource,
        asyncCache: mode[1](),
        logger: makeLogger(),
      })

      const jpgPath = 'page/smurfs.jpg'
      const jpgUrl = `${baseUrl}/${jpgPath}`
      const jpgResource = makeResource({
        url: jpgUrl,
        contentType: 'image/jpeg',
        value: readFileSync(`./test/fixtures/${jpgPath}`),
      })

      const jsonPath = 'page/index.cdt.json'
      const jsonUrl = `${baseUrl}/${jsonPath}`
      const jsonResource = makeResource({
        url: jsonUrl,
        contentType: 'application/json; charset=UTF-8',
        value: readFileSync(`./test/fixtures/${jsonPath}`),
      })

      const cssPath = 'page/test.css'
      const cssUrl = `${baseUrl}/${cssPath}`
      const cssResource = makeResource({url: cssUrl})

      const jsPath = 'page/test.js'
      const jsUrl = `${baseUrl}/${jsPath}`
      const jsResource = makeResource({
        url: jsUrl,
        contentType: 'application/javascript; charset=UTF-8',
        value: readFileSync(`./test/fixtures/${jsPath}`),
      })

      const resources = await processResources({
        resources: {
          [jpgUrl]: jpgResource,
          [jsonUrl]: jsonResource,
          [jsUrl]: jsResource,
          [cssUrl]: cssResource,
        },
        settings: {},
      })

      assert.deepStrictEqual(resources.mapping, {
        [jpgUrl]: jpgResource.hash,
        [jsonUrl]: jsonResource.hash,
        [jsUrl]: jsResource.hash,
        ...makeFixtureCssResources({baseUrl}),
      })
    })

    it(`works for urls with long paths (${mode[0]})`, async () => {
      const processResources = makeProcessResources({
        fetchResource,
        uploadResource,
        asyncCache: mode[1](),
        logger: makeLogger(),
      })

      const filePath = `page/long/path/to/something.js`
      const fileUrl = `${baseUrl}/${filePath}`

      const resources = await processResources({
        resources: {
          [fileUrl]: makeResource({url: fileUrl}),
        },
      })
      assert.deepStrictEqual(resources.mapping, {
        [fileUrl]: makeResource({
          url: fileUrl,
          contentType: 'application/javascript; charset=UTF-8',
          value: readFileSync(`./test/fixtures/${filePath}`),
        }).hash,
      })
    })

    it(`works for svg urls (${mode[0]})`, async () => {
      const processResources = makeProcessResources({
        fetchResource,
        uploadResource,
        asyncCache: mode[1](),
        logger: makeLogger(),
      })

      const svg1Path = 'page/basic.svg'
      const svg1Url = `${baseUrl}/${svg1Path}`
      const svg1UrlResource = makeResource({url: svg1Url})

      const svg2Path = 'page/basic2.svg'
      const svg2Url = `${baseUrl}/${svg2Path}`
      const svg2UrlResource = makeResource({url: svg2Url})

      const svg3Path = 'page/with-style.svg'
      const svg3Url = `${baseUrl}/${svg3Path}`
      const svg3UrlResource = makeResource({url: svg3Url})

      const resources = await processResources({
        resources: {
          [svg1Url]: svg1UrlResource,
          [svg2Url]: svg2UrlResource,
          [svg3Url]: svg3UrlResource,
        },
        settings: {},
      })
      assert.deepStrictEqual(resources.mapping, {
        [svg1Url]: makeResource({
          url: svg1Url,
          contentType: 'image/svg+xml',
          value: readFileSync(`./test/fixtures/${svg1Path}`),
        }).hash,
        [svg2Url]: makeResource({
          url: svg2Url,
          contentType: 'image/svg+xml',
          value: readFileSync(`./test/fixtures/${svg2Path}`),
        }).hash,
        ...makeFixtureSvgResources({baseUrl}),
      })
    })

    it(`fetches with user-agent and referer headers (${mode[0]})`, async () => {
      const url = 'http://url.com/'
      nock(url)
        .get(/.*/)
        .matchHeader('Referer', 'some-referer')
        .matchHeader('User-Agent', 'SomeUserAgent')
        .reply(200, 'content', {'Content-Type': 'text/plain'})
      const fetchResource = makeFetchResource({logger: makeLogger()})
      const processResources = makeProcessResources({
        fetchResource,
        uploadResource,
        asyncCache: mode[1](),
        logger: makeLogger(),
      })

      const resources = await processResources({
        resources: {[url]: makeResource({url})},
        settings: {
          headers: {Referer: 'some-referer', 'User-Agent': 'SomeUserAgent'},
        },
      })

      assert.deepStrictEqual(resources.mapping, {
        [url]: makeResource({url, contentType: 'text/plain', value: Buffer.from('content')}).hash,
      })
    })

    it(`gets resource from cache (${mode[0]})`, async () => {
      const fakeResource = makeResource({url: 'http://fake-url', contentType: 'type', value: Buffer.from('content')})
      const fakeUrlResource = makeResource({url: 'http://fake-url'})
      const asyncCache = mode[1]()
      await asyncCache?.getCachedResource(fakeResource.url, async () => ({hash: fakeResource.hash}))
      const processResources = makeProcessResources({
        fetchResource,
        uploadResource,
        cache: new Map<string, any>([[fakeResource.url, {hash: fakeResource.hash}]]),
        asyncCache,
        logger: makeLogger(),
      })

      const resourcesFromCache = await processResources({
        resources: {[fakeUrlResource.url]: fakeUrlResource},
      })
      assert.deepStrictEqual(resourcesFromCache.mapping, {
        [fakeUrlResource.url]: fakeResource.hash,
      })
    })

    it(`sets and gets resources from cache (${mode[0]})`, async () => {
      let called = 0
      const resource = makeResource({url: 'http://url.com', contentType: 'text/css', value: Buffer.from('content')})
      const fetchResource = async () => (++called, resource)
      const processResources = makeProcessResources({
        fetchResource,
        uploadResource,
        asyncCache: mode[1](),
        logger: makeLogger(),
      })

      const urlResource = makeResource({url: resource.url})

      const resources = await processResources({
        resources: {[urlResource.url]: urlResource},
      })
      const resourcesFromCache = await processResources({
        resources: {[urlResource.url]: urlResource},
      })

      assert.deepStrictEqual(called, 1)

      const expected = {[resource.url]: resource.hash}

      assert.deepStrictEqual(resources.mapping, expected)
      assert.deepStrictEqual(resourcesFromCache.mapping, expected)
    })

    it(`gets inner css resources also for cached resources (${mode[0]})`, async () => {
      const baseUrl = 'http://url.com'
      const resourceMapping = makeFixtureCssResources({baseUrl})
      delete resourceMapping[`${baseUrl}/predefined-status/403`]
      delete resourceMapping[`${baseUrl}/predefined-status/404`]
      delete resourceMapping[`${baseUrl}/predefined-status/hangup`]

      const cache = new Map<string, any>(
        Object.entries(resourceMapping).map(([url, hash]) => {
          return [url, {hash}]
        }),
      )

      const cssPath = 'page/test.css'
      const cssUrl = `${baseUrl}/${cssPath}`

      cache.get(cssUrl).dependencies = [`${baseUrl}/page/imported.css`, `${baseUrl}/page/zilla_slab.woff2`]
      cache.get(`${baseUrl}/page/imported.css`).dependencies = [
        `${baseUrl}/page/imported-nested.css`,
        `${baseUrl}/page/shadows_into_light.woff2`,
        `${baseUrl}/page/smurfs1.jpg`,
        `${baseUrl}/page/smurfs2.jpg`,
        `${baseUrl}/page/smurfs3.jpg`,
      ]

      const processResources = makeProcessResources({fetchResource, uploadResource, cache, logger: makeLogger()})

      const resourcesFromCache = await processResources({
        resources: {[cssUrl]: makeResource({url: cssUrl})},
        settings: {},
      })
      assert.deepStrictEqual(resourcesFromCache.mapping, resourceMapping)
    })

    it(`doesn't crash with unsupported protocols (${mode[0]})`, async () => {
      const processResources = makeProcessResources({
        fetchResource,
        uploadResource,
        asyncCache: mode[1](),
        logger: makeLogger(),
      })

      const dataUrl = 'data:text/html,<div>'
      const blobUrl = 'blob:http://localhost/something.css'
      const resources = await processResources({
        resources: {
          [dataUrl]: makeResource({url: dataUrl}),
          [blobUrl]: makeResource({url: blobUrl}),
        },
      })
      assert.deepStrictEqual(resources.mapping, {})
    })

    it(`doesn't crash with invalid resource (${mode[0]})`, async () => {
      const processResources = makeProcessResources({
        fetchResource,
        uploadResource,
        asyncCache: mode[1](),
        logger: makeLogger(),
      })

      const invalidUrl = 'https://www.pages03.net%3Frev%3D8.4/WTS/event.jpeg'
      const resources = await processResources({
        resources: {
          [invalidUrl]: makeResource({url: invalidUrl}),
        },
      })
      assert.deepStrictEqual(resources.mapping, {
        [invalidUrl]: makeResource({id: invalidUrl, errorStatusCode: 504}).hash,
      })
    })

    it(`handles empty resources (${mode[0]})`, async () => {
      const processResources = makeProcessResources({
        fetchResource,
        uploadResource,
        asyncCache: mode[1](),
        logger: makeLogger(),
      })

      const resource1 = makeResource({url: 'one', contentType: 'some-type', value: null as any})
      const resource2 = makeResource({url: 'two', contentType: 'some-type', value: Buffer.from('some-content')})

      const resources = await processResources({
        resources: {[resource1.url]: resource1, [resource2.url]: resource2},
      })

      assert.deepStrictEqual(resources.mapping, {
        [resource1.url]: resource1.hash,
        [resource2.url]: resource2.hash,
      })
    })

    it(`handles empty resources extracted from cache (${mode[0]})`, async () => {
      const resource = makeResource({url: 'https://some.com/img.jpg', contentType: 'image/jpeg', value: null as any})
      const asyncCache = mode[1]()
      await asyncCache?.getCachedResource(resource.url, async () => ({hash: resource.hash}))
      const processResources = makeProcessResources({
        fetchResource: (() => null) as any,
        uploadResource,
        cache: new Map<string, any>([[resource.url, {hash: resource.hash}]]),
        asyncCache,
        logger: makeLogger(),
      })

      const resourcesFromCache = await processResources({
        resources: {[resource.url]: makeResource({url: resource.url})},
      })

      assert.deepStrictEqual(resourcesFromCache.mapping, {
        [resource.url]: resource.hash,
      })
    })

    it(`handles uppercase urls (${mode[0]})`, async () => {
      const processResources = makeProcessResources({
        fetchResource,
        uploadResource,
        asyncCache: mode[1](),
        logger: makeLogger(),
      })

      const resource = makeResource({
        url: `${baseUrl.toUpperCase()}/page/imported2.css`,
        contentType: 'text/css; charset=UTF-8',
        value: readFileSync('./test/fixtures/page/imported2.css'),
      })

      const resources = await processResources({
        resources: {[resource.url]: makeResource({url: resource.url})},
      })
      assert.deepStrictEqual(resources.mapping, {[resource.url]: resource.hash})
    })

    it(`gets resources from prefilled resources (${mode[0]})`, async () => {
      const processResources = makeProcessResources({
        fetchResource,
        uploadResource,
        asyncCache: mode[1](),
        logger: makeLogger(),
      })

      const cssPath = 'page/blob.css'
      const cssUrl = `${baseUrl}/${cssPath}`
      const cssResource = makeResource({
        url: cssUrl,
        contentType: 'text/css; charset=UTF-8',
        value: readFileSync(`./test/fixtures/${cssPath}`),
      })

      const imgPath = 'page/smurfs4.jpg'
      const imgUrl = `${baseUrl}/${imgPath}`
      const imgResource = makeResource({
        url: imgUrl,
        contentType: 'image/jpeg',
        value: readFileSync(`./test/fixtures/${imgPath}`),
      })

      const fontZillaPath = 'page/zilla_slab.woff2'
      const fontZillaUrl = `${baseUrl}/${fontZillaPath}`
      const fontZillaUrlResource = makeResource({url: fontZillaUrl})
      const fontZillaResource = makeResource({
        url: fontZillaUrl,
        contentType: 'font/woff2',
        value: readFileSync(`./test/fixtures/${fontZillaPath}`),
      })

      const resources = await processResources({
        resources: {
          [cssResource.url]: cssResource,
          [imgResource.url]: imgResource,
          [fontZillaResource.url]: fontZillaUrlResource,
        },
      })

      assert.deepStrictEqual(resources.mapping, {
        [cssResource.url]: cssResource.hash,
        [imgResource.url]: imgResource.hash,
        [fontZillaResource.url]: fontZillaResource.hash,
      })
    })

    it(`doesn't extract dependencies from prefilled resources (${mode[0]})`, async () => {
      const processResources = makeProcessResources({
        fetchResource,
        uploadResource,
        asyncCache: mode[1](),
        logger: makeLogger(),
      })

      const cssPath = 'page/svg2.css' // has smurfs4.jpg as dependecy
      const cssUrl = `${baseUrl}/${cssPath}`
      const cssResource = makeResource({
        url: cssUrl,
        contentType: 'text/css; charset=UTF-8',
        value: readFileSync(`./test/fixtures/${cssPath}`),
      })

      const resources = await processResources({
        resources: {[cssUrl]: cssResource},
      })

      assert.deepStrictEqual(resources.mapping, {[cssUrl]: cssResource.hash})
    })

    it(`works for unknown content-type (${mode[0]})`, async () => {
      const processResources = makeProcessResources({
        fetchResource,
        uploadResource,
        asyncCache: mode[1](),
        logger: makeLogger(),
      })

      const filePath = 'page/no-content-type'
      const fileUrl = `${baseUrl}/${filePath}`
      const fileResource = makeResource({
        url: fileUrl,
        contentType: 'application/octet-stream',
        value: readFileSync(`./test/fixtures/${filePath}`),
      })

      const resources = await processResources({
        resources: {[fileUrl]: makeResource({url: fileUrl})},
      })

      assert.deepStrictEqual(resources.mapping, {[fileUrl]: fileResource.hash})

      const resourcesFromCache = await processResources({
        resources: {[fileUrl]: makeResource({url: fileUrl})},
      })

      assert.deepStrictEqual(resourcesFromCache.mapping, resources.mapping)
    })

    it(`doesn't fail when fetch fails, but write a log (${mode[0]})`, async () => {
      let output = ''
      const logger = {
        log: (...args: any[]) => void (output += args.join('')),
        error: () => void 0,
        extend: () => logger,
      } as any
      const processResources = makeProcessResources({
        fetchResource: () => {
          throw new Error('noop')
        },
        asyncCache: mode[1](),
        uploadResource,
        logger,
      })

      const url = 'http://localhost:1234/err/bla.css'
      const resources = await processResources({resources: {[url]: makeResource({url})}})
      assert.deepStrictEqual(resources.mapping, {[url]: makeResource({id: url, errorStatusCode: 504}).hash})
      // TODO this TS error will be fixed once we upgrade minimal supported Node.js version, so @types/node can be upgraded
      assert.match(
        output,
        /error fetching resource at http:\/\/localhost:1234\/err\/bla.css, setting errorStatusCode to 504. err=Error: noop/,
      )
    })

    it(`handles the case when the same resource appears as prefilled resource and as a dependency of another url resource (${mode[0]})`, async () => {
      const processResources = makeProcessResources({
        fetchResource,
        uploadResource,
        asyncCache: mode[1](),
        logger: makeLogger(),
      })

      const preResource = makeResource({
        url: `${baseUrl}/page/smurfs5.jpg`,
        contentType: 'bla-type',
        value: Buffer.from('bla-content'),
      })
      const cssPath = 'page/svg2.css'
      const cssUrl = `${baseUrl}/${cssPath}`
      const cssResource = makeResource({
        url: cssUrl,
        contentType: 'text/css; charset=UTF-8',
        value: readFileSync(`./test/fixtures/${cssPath}`),
      })
      const urlCssResource = makeResource({url: cssUrl})

      const resources = await processResources({
        resources: {[preResource.url]: preResource, [urlCssResource.url]: urlCssResource},
        settings: {},
      })
      assert.deepStrictEqual(resources.mapping, {
        [preResource.url]: preResource.hash,
        [cssResource.url]: cssResource.hash,
      })
    })

    it(`handles the case when the same resource appears both in prefilled resource and as a dependency of another prefilled resource (${mode[0]})`, async () => {
      const processResources = makeProcessResources({
        fetchResource,
        uploadResource,
        asyncCache: mode[1](),
        logger: makeLogger(),
      })

      const jpgResource = makeResource({
        url: `${baseUrl}/page/smurfs5.jpg`,
        contentType: 'bla-type',
        value: Buffer.from('bla-content'),
      })
      const cssPath = 'page/svg2.css'
      const cssResource = makeResource({
        url: `${baseUrl}/${cssPath}`,
        contentType: 'text/css; charset=UTF-8',
        value: readFileSync(`./test/fixtures/${cssPath}`),
      })

      const resources = await processResources({
        resources: {
          [jpgResource.url]: jpgResource,
          [cssResource.url]: cssResource,
        },
      })
      assert.deepStrictEqual(resources.mapping, {
        [jpgResource.url]: jpgResource.hash,
        [cssResource.url]: cssResource.hash,
      })
    })

    it(`handles recursive reference inside a dependency (${mode[0]})`, async () => {
      const processResources = makeProcessResources({
        fetchResource,
        uploadResource,
        asyncCache: mode[1](),
        logger: makeLogger(),
      })

      const cssPath = 'page/recursive.css'
      const cssUrl = `${baseUrl}/${cssPath}`
      const cssResource = makeResource({
        url: cssUrl,
        contentType: 'text/css; charset=UTF-8',
        value: readFileSync(`./test/fixtures/${cssPath}`),
      })
      const resources = await processResources({
        resources: {[cssResource.url]: makeResource({url: cssResource.url})},
      })

      assert.deepStrictEqual(resources.mapping, {[cssResource.url]: cssResource.hash})
    })

    it(`handles recursive reference inside a dependency from a prefilled resource (${mode[0]})`, async () => {
      const processResources = makeProcessResources({
        fetchResource,
        uploadResource,
        asyncCache: mode[1](),
        logger: makeLogger(),
      })

      const cssPath = 'page/recursive.css'
      const cssUrl = `${baseUrl}/${cssPath}`
      const cssResource = makeResource({
        url: cssUrl,
        contentType: 'text/css; charset=UTF-8',
        value: readFileSync(`./test/fixtures/${cssPath}`),
      })
      const resources = await processResources({
        resources: {[cssResource.url]: cssResource},
      })

      assert.deepStrictEqual(resources.mapping, {[cssResource.url]: cssResource.hash})
    })

    it(`handles mutually recursive references (${mode[0]})`, async () => {
      const processResources = makeProcessResources({
        fetchResource,
        uploadResource,
        asyncCache: mode[1](),
        logger: makeLogger(),
      })

      const css1Path = 'page/recursive-1.css'
      const css1Url = `${baseUrl}/${css1Path}`
      const css1Resource = makeResource({
        url: css1Url,
        contentType: 'text/css; charset=UTF-8',
        value: readFileSync(`./test/fixtures/${css1Path}`),
      })
      const css2Path = 'page/recursive-2.css'
      const css2Url = `${baseUrl}/${css2Path}`
      const css2Resource = makeResource({
        url: css2Url,
        contentType: 'text/css; charset=UTF-8',
        value: readFileSync(`./test/fixtures/${css2Path}`),
      })

      const resources = await processResources({
        resources: {[css1Resource.url]: makeResource({url: css1Resource.url})},
        settings: {},
      })

      assert.deepStrictEqual(resources.mapping, {
        [css1Resource.url]: css1Resource.hash,
        [css2Resource.url]: css2Resource.hash,
      })
    })

    it(`make sure we send user agent when fetching google fonts (${mode[0]})`, async () => {
      nock('https://fonts.googleapis.com')
        .get(/.*/)
        .matchHeader(
          'User-Agent',
          'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; .NET4.0C; .NET4.0E; .NET CLR 2.0.50727; .NET CLR 3.0.30729; .NET CLR 3.5.30729; rv:11.0) like Gecko',
        )
        .reply(200, 'font', {'Content-Type': 'application/x-font'})

      const fetchResource = makeFetchResource({logger: makeLogger()})
      const processResources = makeProcessResources({
        fetchResource,
        uploadResource,
        asyncCache: mode[1](),
        logger: makeLogger(),
      })

      const googleFontUrl = 'https://fonts.googleapis.com/css?family=Zilla+Slab'

      const resources = await processResources({
        resources: {
          [googleFontUrl]: makeResource({
            url: googleFontUrl,
            renderer: {name: 'ie', width: 100, height: 100},
          }),
        },
      })

      assert.deepStrictEqual(resources.mapping[googleFontUrl], {
        contentType: 'application/x-font',
        hash: '795ea3efa43d0872b63bf0067be97553b46983e4f075097669391e9d15388ecc',
        hashFormat: 'sha256',
      })
    })

    it(`handles resources with errorStatusCode (non-200 resources) from prefilled resources (${mode[0]})`, async () => {
      const processResources = makeProcessResources({
        fetchResource,
        uploadResource,
        asyncCache: mode[1](),
        logger: makeLogger(),
      })

      const resource = makeResource({id: 'http://resource-1', errorStatusCode: 500})

      const resources = await processResources({resources: {[resource.id]: resource}})
      assert.deepStrictEqual(resources.mapping, {[resource.id]: resource.hash})
    })

    it(`handles resources with errorStatusCode (non-200 resources) from url resources (${mode[0]})`, async () => {
      const processResources = makeProcessResources({
        fetchResource,
        uploadResource,
        asyncCache: mode[1](),
        logger: makeLogger(),
      })

      const resource = makeResource({id: `${baseUrl}/predefined-status/401`, errorStatusCode: 401})

      const resources = await processResources({
        resources: {[resource.id]: makeResource({url: resource.id})},
      })
      assert.deepStrictEqual(resources.mapping, {[resource.id]: resource.hash})
    })

    it(`handles resources with errorStatusCode (non-200 resources) from cache (${mode[0]})`, async () => {
      const processResources = makeProcessResources({
        fetchResource,
        uploadResource,
        asyncCache: mode[1](),
        logger: makeLogger(),
      })

      const resource = makeResource({id: 'http://resource-1', errorStatusCode: 500})

      await processResources({resources: {[resource.id]: resource}})

      const resources = await processResources({
        resources: {[resource.id]: makeResource({url: resource.id})},
      })
      assert.deepStrictEqual(resources.mapping, {[resource.id]: resource.hash})
    })

    it(`handles prefilled resources with dependencies (${mode[0]})`, async () => {
      const processResources = makeProcessResources({
        fetchResource,
        uploadResource,
        asyncCache: mode[1](),
        logger: makeLogger(),
      })

      const resource1 = makeResource({
        url: 'http://resource-1',
        contentType: 'type1',
        value: Buffer.from('content1'),
        dependencies: ['http://resource-2'],
      })
      const resource2 = makeResource({url: 'http://resource-2', contentType: 'type2', value: Buffer.from('content2')})

      const resources = await processResources({
        resources: {[resource1.url]: resource1, [resource2.url]: resource2},
      })

      const expected = {[resource1.url]: resource1.hash, [resource2.url]: resource2.hash}

      assert.deepStrictEqual(resources.mapping, expected)

      const resourcesFromCache = await processResources({
        resources: {[resource1.url]: makeResource({url: resource1.url})},
        settings: {},
      })

      assert.deepStrictEqual(resourcesFromCache.mapping, expected)
    })

    it(`handles cookies (${mode[0]})`, async () => {
      const results = [] as any[]
      nock('http://some-url.com')
        .get(/.*/)
        .reply(function (url) {
          results.push({url: `http://some-url.com${url}`, cookie: this.req.headers.cookie})
          return [200, 'content', {'Content-Type': 'text/plain'}]
        })
      nock('http://some-other-url.com')
        .get(/.*/)
        .reply(function (url) {
          results.push({url: `http://some-other-url.com${url}`, cookie: this.req.headers.cookie})
          return [200, 'content', {'Content-Type': 'text/plain'}]
        })
      nock('http://my-domain.com')
        .get(/.*/)
        .reply(function (url) {
          results.push({url: `http://my-domain.com${url}`, cookie: this.req.headers.cookie})
          return [200, 'content', {'Content-Type': 'text/plain'}]
        })
      nock('http://web.theweb.com')
        .get(/.*/)
        .reply(function (url) {
          results.push({url: `http://web.theweb.com${url}`, cookie: this.req.headers.cookie})
          return [200, 'content', {'Content-Type': 'text/plain'}]
        })
      nock('http://theinternet.com')
        .get(/.*/)
        .reply(function (url) {
          results.push({url: `http://theinternet.com${url}`, cookie: this.req.headers.cookie})
          return [200, 'content', {'Content-Type': 'text/plain'}]
        })
      const fetchResource = makeFetchResource({logger: makeLogger()})
      const processResources = makeProcessResources({
        fetchResource,
        uploadResource,
        asyncCache: mode[1](),
        logger: makeLogger(),
      })

      await processResources({
        resources: {
          'http://some-url.com/images/image.png': makeResource({
            url: 'http://some-url.com/images/image.png',
          }),
          'http://some-other-url.com/pictures/picture.jpeg': makeResource({
            url: 'http://some-other-url.com/pictures/picture.jpeg',
          }),
          'http://my-domain.com/static/style.css': makeResource({
            url: 'http://my-domain.com/static/style.css',
          }),
          'http://web.theweb.com/resources/resource.css': makeResource({
            url: 'http://web.theweb.com/resources/resource.css',
          }),
          'http://theinternet.com/assets/public/img.png': makeResource({
            url: 'http://theinternet.com/assets/public/img.png',
          }),
        },
        settings: {
          cookies: [
            {
              domain: 'some-other-url.com',
              path: '/pictures',
              name: 'hello',
              value: 'world',
              expiry: Date.now() / 1000 - 1,
            },
            {
              domain: '.theweb.com',
              path: '/resources/',
              name: 'resource',
              value: 'alright',
            },
            {domain: 'some-url.com', path: '/images', name: 'hello', value: 'world'},
            {domain: 'my-domain.com', path: '/static', name: 'static', value: 'yes', secure: true},
            {domain: 'theinternet.com', path: '/assets/public', name: 'assets', value: 'okay'},
          ],
        },
      })

      assert.deepStrictEqual(results, [
        {url: 'http://some-url.com/images/image.png', cookie: 'hello=world;'},
        {url: 'http://some-other-url.com/pictures/picture.jpeg', cookie: undefined}, // expired
        {url: 'http://my-domain.com/static/style.css', cookie: undefined}, // non secure (http)
        {url: 'http://web.theweb.com/resources/resource.css', cookie: 'resource=alright;'},
        {url: 'http://theinternet.com/assets/public/img.png', cookie: 'assets=okay;'},
      ])
    })

    it(`handles google fonts with cache (${mode[0]})`, async () => {
      nock('https://fonts.googleapis.com')
        .get('/some-font')
        .once()
        .reply(function () {
          return [200, 'font', {'Content-Type': `application/${this.req.headers['user-agent']}`}]
        })

      nock('http://bla')
        .get('/some-resource')
        .once()
        .reply(function () {
          return [200, 'data', {'Content-Type': `application/${this.req.headers['user-agent']}`}]
        })

      const cache = new Map()
      const asyncCache = mode[1]()
      const processResources = makeProcessResources({
        fetchResource,
        uploadResource,
        cache,
        asyncCache,
        logger: makeLogger(),
      })

      const googleFontResource = makeResource({
        url: 'https://fonts.googleapis.com/some-font',
        renderer: {name: 'ie', width: 100, height: 100},
      })
      const standardResource = makeResource({
        url: 'http://bla/some-resource',
        renderer: {name: 'ie', width: 100, height: 100},
      })
      const defaultUserAgent = 'DefaultUserAgent'

      const resources = await processResources({
        resources: {
          [googleFontResource.url]: googleFontResource,
          [standardResource.url]: standardResource,
        },
        settings: {
          renderer: {name: 'chrome', width: 100, height: 100},
          headers: {'User-Agent': defaultUserAgent},
        },
      })

      assert.strictEqual(
        (resources.mapping[googleFontResource.url] as any).contentType,
        `application/Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; .NET4.0C; .NET4.0E; .NET CLR 2.0.50727; .NET CLR 3.0.30729; .NET CLR 3.5.30729; rv:11.0) like Gecko`,
      )
      assert.strictEqual(
        (resources.mapping[standardResource.url] as any).contentType,
        `application/${defaultUserAgent}`,
      )

      const resourcesFromCache = await processResources({
        resources: {
          [googleFontResource.url]: googleFontResource,
          [standardResource.url]: standardResource,
        },
        settings: {
          renderer: {name: 'chrome', width: 100, height: 100},
        },
      })

      assert.strictEqual(
        (resourcesFromCache.mapping[googleFontResource.url] as any).contentType,
        `application/Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; .NET4.0C; .NET4.0E; .NET CLR 2.0.50727; .NET CLR 3.0.30729; .NET CLR 3.5.30729; rv:11.0) like Gecko`,
      )
      assert.strictEqual(
        (resourcesFromCache.mapping[standardResource.url] as any).contentType,
        `application/${defaultUserAgent}`,
      )

      const cacheToVerify = asyncCache?.getFetchCache() ?? cache
      assert.deepStrictEqual([...cacheToVerify.keys()], [`${googleFontResource.url}~ie`, standardResource.url])
    })

    it(`doesn't save data url dependencies in async cache (${mode[0]})`, async () => {
      const content = 'div{background:url("data:text/png,bla");}'

      const resource = makeResource({
        url: 'http://url.com/some.css',
        value: Buffer.from(content),
        contentType: 'text/css',
      })
      nock('http://url.com/').get('/some.css').reply(200, content, {'Content-Type': 'text/css'})

      const asyncCache = mode[1]()
      const cache = new Map()

      const processResources = makeProcessResources({
        fetchResource,
        uploadResource,
        asyncCache,
        cache,
        logger: makeLogger(),
      })

      const urlResource = makeResource({url: 'http://url.com/some.css'})

      const resources = await processResources({
        resources: {[urlResource.url]: urlResource},
      })

      assert.deepStrictEqual(resources.mapping, {[resource.url]: resource.hash})

      const cacheToVerify = asyncCache?.getFetchCache() ?? cache
      assert.deepStrictEqual(
        [...cacheToVerify.entries()].map(([key, value]) => {
          const {ready: _ready, ...valueWithoutReady} = value
          return [key, valueWithoutReady]
        }),
        [['http://url.com/some.css', {dependencies: [], hash: resource.hash}]],
      )
    })

    it(`waits for resource to upload to UFG in async cache (${mode[0]})`, async () => {
      const content = 'div{background:url("data:text/png,bla");}'

      const resource = makeResource({
        url: 'http://url.com/some.css',
        value: Buffer.from(content),
        contentType: 'text/css',
      })
      nock('http://url.com/').get('/some.css').reply(200, content, {'Content-Type': 'text/css'})

      const asyncCache = mode[1]()
      const cache = new Map()

      const processResources = makeProcessResources({
        fetchResource,
        uploadResource,
        asyncCache,
        cache,
        logger: makeLogger(),
      })

      const urlResource = makeResource({url: 'http://url.com/some.css'})

      const resources1 = await processResources({
        resources: {[urlResource.url]: urlResource},
      })

      assert.deepStrictEqual(resources1.mapping, {[resource.url]: resource.hash})

      const resources2 = await processResources({
        resources: {[urlResource.url]: urlResource},
      })

      assert.deepStrictEqual(resources2.mapping, resources1.mapping)

      await resources2.promise

      if (asyncCache) {
        assert.deepStrictEqual([...asyncCache.getUploadCache().entries()], [[JSON.stringify(resource.hash), true]])
      }
    })
  }
})
