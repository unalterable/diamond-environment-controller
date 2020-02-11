const http = require('http')
const childProcess = require('child_process')
const port = 3000

const exec = cmd => new Promise((resolve, reject) =>
  childProcess.exec(cmd, (error, stdout) =>
    error === null ? resolve(stdout) : reject(error.message)))

const addToPromiseChain = ((chain, iteration) => newItem => {
  const thisIteration = iteration++
  chain = chain.then(() => newItem(thisIteration)).catch(console.error)
  return thisIteration
})(Promise.resolve(), 1)

const task = async currIteration => {
  try {
    console.log(`>>>>> Iteration ${currIteration} starting`)
    const result = await exec('sh ./clone.sh')
    console.log(`>>>>> Iteration ${currIteration} succeeded:`)
    console.log(result)
  } catch (e) {
    console.log(`>>>>> Iteration ${currIteration} failed:`)
    console.log(e)
  }
}

const registerTask = () => {
  const numberInQueue = addToPromiseChain(task)
  const result = `>>>>> New task registered (Iteration ${numberInQueue})`
  console.log(result)
  return result
}

const processBody = request => new Promise((resolve, reject) => {
  let body = '';
  request.on('data', chunk => { body += chunk.toString() })
  request.on('end', () => {
    try {
      resolve(JSON.parse(body))
    } catch (e){
      reject(e)
    }
  });
})

const requestHandler = async (request, response) => {
  try {
    if (request.method === 'POST') {
      const body = await processBody(request)
      if(body.ref === "refs/heads/master") {
        console.log('>>>>> Request webhook event received')
        response.end(registerTask())
      } else {
        console.log('>>>>> Request recieved and ignored (classified as invalid webhook)')
        response.end('Request ignored (classified as invalid webhook)')
      }
    } else {
      response.end('OK')
    }
  } catch (e) {
    console.log('>>>>> Request created an error:', e)
    response.end(`Error ${e}`)
  }
}

http
  .createServer(requestHandler)
  .listen(port, () => console.log(`server is listening on ${port}`))
