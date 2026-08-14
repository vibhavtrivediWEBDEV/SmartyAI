import 'dotenv/config'

declare global {
  namespace NodeJS {
    interface Global {
      socketIO: import('socket.io').Server | null
    }
  }
  
  var socketIO: import('socket.io').Server | null | undefined
}

export {}
