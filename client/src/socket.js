import {io} from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:9000'
const socket = io(SOCKET_URL)

export default socket
