const http = require('http')
const childProcess = require('child_process')
const port = 3000

const log = (...args) => console.log((new Date()).toISOString(), ...args)

const addToPromiseChain = ((chain, iteration) => newItem => {
  const thisIteration = iteration++
  chain = chain.then(() => newItem(thisIteration)).catch(console.error)
  return thisIteration
})(Promise.resolve(), 1)

const exec = (cmd, pre) => new Promise((resolve, reject) => {
  log(pre, cmd)
  const process = childProcess.exec(cmd, (error, stdout) => error === null ? resolve(stdout) : reject(error.message))
  process.stdout.on('data', (data) => log(pre, data.toString()))
})

const processBody = request => new Promise((resolve, reject) => {
  let body = '';
  request.on('data', chunk => { body += chunk.toString() })
  request.on('end', () => {
    try {
      resolve(JSON.parse(body))
    } catch (e){
      resolve({})
    }
  });
})

const task = async currIteration => {
  const pre = `>>> Iteration ${currIteration}`
  try {
    log(pre, 'starting')
    const githubUrl = process.env.ENV_REPO.replace('https://', `https://${process.env.GITHUB_ACCESS_TOKEN}@`)
    await exec(`git clone ${githubUrl} deployment`, pre)
    await exec('sh deployment/deploy.sh', pre)
    await exec('rm -rf deployment', pre)
    log(pre, `>>> Iteration ${currIteration} succeeded:`)
  } catch (e) {
    log(`>>> Iteration ${currIteration} failed:`)
    log(e)
    await exec('rm -rf deployment && true', pre)
  }
}

const requestHandler = async (request, response) => {
  const body = await processBody(request)
  if (request.url === '/github-webhook' && body.ref === "refs/heads/master"){
    const numberInQueue = addToPromiseChain(task)
    log(`>>> New task registered (Iteration ${numberInQueue})`)
    response.end(`OK - New task registered (Iteration ${numberInQueue})`)
  } else {
    log('>>> Request Rejected')
    response.end(`OK`)
  }
}

http
  .createServer(requestHandler)
  .listen(port, () => log(`server is listening on ${port}`))
