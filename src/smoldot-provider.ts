import { start } from "smoldot"
import polkadotSpec from "./polkadot-spec"
import { getSyncProvider } from "@polkadot-api/json-rpc-provider-proxy"
import { appendFileSync, existsSync, rmSync } from "fs"
import { getTickDate } from "./tick-date"

const WIRE_FILE = "wire-logs.txt"
const SMOLDOT_LOGS_FILE = "smoldot-logs.txt"

if (existsSync(WIRE_FILE)) rmSync(WIRE_FILE)
if (existsSync(SMOLDOT_LOGS_FILE)) rmSync(SMOLDOT_LOGS_FILE)

const appendWireLog = (message: string, isInput: boolean) => {
  appendFileSync(
    WIRE_FILE,
    `${getTickDate()}-${isInput ? "<<" : ">>"}-${message}\n`,
  )
}

const appendSmlog = (level: number, target: string, message: string) => {
  appendFileSync(
    SMOLDOT_LOGS_FILE,
    `${getTickDate()} (${level})${target}\n${message}\n\n`,
  )
}

const smoldot = start({
  maxLogLevel: 9,
  logCallback: appendSmlog,
})

let nTries = 0
export default getSyncProvider(async () => {
  if (nTries++ > 0) throw new Error("DONE")

  const chain = await smoldot.addChain({
    chainSpec: polkadotSpec,
  })

  return (listener, onError) => {
    let listening = true
    ;(async () => {
      do {
        let message = ""
        try {
          message = await chain.nextJsonRpcResponse()
        } catch (e) {
          onError()
          return
        }
        if (!listening) break
        appendWireLog(message, true)
        listener(message)
      } while (listening)
    })()
    return {
      send(msg: string) {
        appendWireLog(msg, false)
        chain.sendJsonRpc(msg)
      },
      disconnect() {
        listening = false
        chain.remove()
      },
    }
  }
})
