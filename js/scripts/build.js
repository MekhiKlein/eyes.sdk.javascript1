#!/usr/bin/env node

/* eslint "no-console": "off" */
const fs = require('fs').promises
const path = require('path')
const {exec} = require('child_process')
const yargs = require('yargs')

yargs
  .command({
    command: '*',
    builder(yargs) {
      return yargs.options({
        target: {
          description: 'Target workspace path',
          type: 'string',
        },
        type: {
          description: 'Type of the build script for target workspace',
          type: 'string',
        },
        withDeps: {
          description: 'Build dependencies',
          type: 'boolean',
        },
      })
    },
    async handler(args) {
      try {
        console.log(args)
        await build(args)
      } catch (err) {
        console.error(err)
        process.exit(1)
      }
    },
  })
  .wrap(yargs.terminalWidth()).argv

async function build({target, type, withDeps}) {
  const workspaces = await getWorkspaces()
  const targetWorkspaces = []
  if (target) {
    const targetWorkspace = Object.values(workspaces).find(workspace => workspace.path === path.normalize(target))
    if (!targetWorkspace)
      throw new Error(`Target should be a workspace directory, but the current directory is "${target}"`)
    targetWorkspaces.push(targetWorkspace)
  } else {
    targetWorkspaces.push(...Object.values(workspaces))
  }

  await buildWorkspaces(targetWorkspaces)

  async function buildWorkspaces(workspaces) {
    const cache = new Map()

    await Promise.all(workspaces.map(buildWorkspace))

    function buildWorkspace(workspace) {
      if (cache.has(workspace)) return cache.get(workspace)
      const promise = new Promise(async (resolve, reject) => {
        if (withDeps) await Promise.all(workspace.dependencies.map(buildWorkspace))
        const command = `npm run build${type && targetWorkspaces.includes(workspace) ? `:${type}` : ' --if-present'}`
        const script = exec(command, {stdio: 'pipe', cwd: workspace.path})

        let stdout = ''
        script.stdout.on('data', data => (stdout += data.toString()))
        let stderr = ''
        script.stderr.on('data', data => (stderr += data.toString()))

        script.on('error', reject)
        script.on('exit', (code, signal) => {
          if (code === 0) {
            resolve({code, stdout, stderr})
          } else if (signal) {
            reject(
              Object.assign(new Error(`Command "${command}" exited due to a signal ${signal}`), {
                signal,
                stdout,
                stderr,
              }),
            )
          } else {
            reject(
              Object.assign(new Error(`Command "${command}" exited due non-zero code ${code}`), {code, stdout, stderr}),
            )
          }
        })
      })
      cache.set(workspace, promise)
      return workspace
    }
  }
}

async function getWorkspaces() {
  const rootManifestPath = path.resolve('package.json')
  const rootManifest = JSON.parse(await fs.readFile(rootManifestPath, {encoding: 'utf8'}))
  const workspaces = await rootManifest.workspaces.reduce(async (workspaces, workspaceDir) => {
    const workspacePath = path.resolve(workspaceDir)
    const workspaceManifestPath = path.resolve(workspacePath, 'package.json')
    if (!(await fs.stat(workspaceManifestPath).catch(() => false))) return workspaces
    const manifest = JSON.parse(await fs.readFile(workspaceManifestPath, {encoding: 'utf8'}))
    return {
      ...(await workspaces),
      [manifest.name]: {
        name: manifest.name,
        path: workspacePath,
        dependencies: Object.keys({...manifest.dependencies, ...manifest.devDependencies}),
      },
    }
  }, Promise.resolve({}))

  Object.values(workspaces).forEach(workspace => {
    workspace.dependencies = workspace.dependencies.flatMap(name => workspaces[name] ?? [])
  })

  return workspaces
}
