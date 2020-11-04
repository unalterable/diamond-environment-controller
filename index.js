const http = require('http')
const childProcess = require('child_process')
const port = 3000

const log = (...args) => console.log((new Date()).toISOString(), ...args)

const addToPromiseChain = ((chain, iteration) => newItem => {
  const thisIteration = iteration++
  chain = chain.then(() => newItem(thisIteration)).catch(console.error)
  return thisIteration
})(Promise.resolve(), 1)

const exec = (cmd) => new Promise((resolve, reject) => {
  log(cmd)
  const process = childProcess.exec(cmd, (error, stdout) => error === null ? resolve(stdout) : reject(error.message))
  process.stdout.on('data', (data) => console.log(data.toString()))
})

const processRequestBody = request => new Promise((resolve, reject) => {
  let body = '';
  request.on('data', chunk => { body += chunk.toString() })
  request.on('end', () => {try {resolve(JSON.parse(body))} catch (e){resolve({})}});
})

const deploymentTask = async taskNumber => {
  try {
    log(`>>>>> Task starting: #${taskNumber}`)
    const githubUrl = process.env.ENV_REPO.replace('https://', `https://${process.env.GITHUB_ACCESS_TOKEN}@`)
    await exec(`git clone ${githubUrl} deployment`)
    await exec(`cd deployment && sh ./deploy.sh`)
    await exec(`rm -rf deployment`)
    log(`>>>>> Task succeeded: #${taskNumber}`)
  } catch (e) {
    log(`>>>>> Task failed: #${taskNumber}`)
    console.log(e)
    await exec(`rm -rf deployment && true`)
  }
  log(`>>>>> Task completed: #${taskNumber}`)
}



const requestHandler = async (request, response) => {
  try {
    const body = await processRequestBody(request)

    if (request.url !== '/github-webhook') throw Error('request.url !== \'/github-webhook\'')
    if (body.ref !== 'refs/heads/master') throw Error('body.ref !== \'refs/heads/master\'')

    const numberInQueue = addToPromiseChain(deploymentTask)
    log(`>>>>> Task registered: (#${numberInQueue})`)
    response.end(`Task registered: (#${numberInQueue})`)
  } catch(e) {
    response.end(`OK - request ignored, ${e.message}`)
  }
}

http
  .createServer(requestHandler)
  .listen(port, () => log(`server is listening on ${port}`))
