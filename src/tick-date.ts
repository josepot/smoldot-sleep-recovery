let tickDate = ""

const setTickDate = () => {
  tickDate = new Date().toISOString()
  setTimeout(setTickDate, 0)
}
setTickDate()

export const getTickDate = () => tickDate
