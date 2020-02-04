const http = require('http')
const childProcess = require('child_process')
const port = 3000

const addToPromiseChain = ((chain, iteration) => newItem => {
  const thisIteration = iteration++
  chain = chain.then(() => newItem(thisIteration)).catch(console.error)
  return thisIteration
})(Promise.resolve(), 1)

const exec = cmd => new Promise((resolve, reject) =>
  childProcess.exec(cmd, (error, stdout) =>
    error === null ? resolve(stdout) : reject(error.message)))

const requestHandler = (request, response) => {
  const numberInQueue = addToPromiseChain(async currIteration => {
    try {
      console.log(`>>>>> Iteration ${currIteration} starting`)
      const result = await exec('sh ./clone.sh')
      console.log(`>>>>> Iteration ${currIteration} succeeded:`)
      console.log(result)
    } catch (e) {
      console.log(`>>>>> Iteration ${currIteration} failed:`)
      console.log(e)
    }
  })
  console.log(`>>>>> New task registered (Iteration ${numberInQueue})`)
  response.end('OK')
}

http
  .createServer(requestHandler)
  .listen(port, () => console.log(`server is listening on ${port}`))
