import { DisjointError, createClient } from "@polkadot-api/substrate-client"
import { fromHex } from "@polkadot-api/utils"
import smProvider from "./smoldot-provider"
import { compact } from "scale-ts"
import { getTickDate } from "./tick-date"

const client = createClient(smProvider)

const follow = () => {
  console.log(`${getTickDate()} - starting new chainHead follow subscription`)
  const follower = client.chainHead(
    true,
    (e) => {
      if (e.type === "initialized") {
        console.log(`${getTickDate()} - Initialized - ${e.finalizedBlockHash}`)
        return
      }

      if (e.type === "finalized") {
        follower
          .unpin([...e.prunedBlockHashes, ...e.finalizedBlockHashes])
          .catch(catchDisjoinedError)
        return
      }
      if (e.type !== "bestBlockChanged") return

      follower
        .header(e.bestBlockHash)
        .then((rawHeader) => {
          const blockNumber =
            rawHeader && compact.dec(fromHex(rawHeader).slice(32))
          const msg = `${getTickDate()} - bestBlockChanged(${blockNumber}) - ${
            e.bestBlockHash
          }`
          console.log(msg)
        })
        .catch(catchDisjoinedError)
    },
    (error) => {
      console.log(`${getTickDate()} - ${error.message}`)
      setTimeout(follow, 0)
    },
  )
}

follow()

function catchDisjoinedError(e: any) {
  if (e instanceof DisjointError) return
  throw e
}
