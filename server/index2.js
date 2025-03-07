const http = require('http')
const express = require('express')
const { Server: SocketServer } = require('Socket.io')
const pty = require('node-pty')
const fs = require('path');
const cors = require('cors')
const chokidar = require('chokidar')

const app = express()
const server = http.createServer(app);

const io = new SocketServer({
    cors: { origin: '*' }
})

app.use(cors())

const ptyProcess = pty.spawn('bash', [], {
    name: 'xterm-color',
    cols: 30,
    rows: 30,
    cwd: process.env.INIG_CWD,
    env: process.env
})


io.attach(server)

chokidar.watch('./user').on('all', (event, path)=>{
    io.emit('file:refresh', path)
})


ptyProcess.onData(data =>{
    io.emit('terminal:data', data);
})


io.on('connection', (socket)=>{
    console.log('connected to ' , socket.id);
    socket.on('terminal:write', (data)=>{
        ptyProcess.write(data);
    })
})


app.get('/files', async(req , res)=>{
    const fileTree = await MakeFileTree('./user');
    return res.json({tree: fileTree});
})


server.listen(9001, ()=>{
    console.log('running on port 9001')
})

async function MakeFileTree(directory){
    const tree = {}

    async function buildTree(currentDir, currentTree){
        const files = await fs.readdir(currentDir);

        for (const file of files){
            const filePath = path.join(currentDir, file)
            const stat = await fs.stat(filePath)

            if(stat.isDirectory()){
                currentDir[file] = {};
                await buildTree(filePath, currentTree[file])
            }else{
                currentDir[file] = null;
            }
        }
    }


    await buildTree(directory, tree);
    return tree
}