const http = require('http');
const express = require('express')  
const { Server: SocketServer } = require('socket.io')
var pty = require('node-pty');
const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const cors = require('cors')
const chokidar = require('chokidar');

const app = express()
const server = http.createServer(app);


const io = new SocketServer({
    cors: { origin: '*' }
})

app.use(cors())

const userDir = path.join(__dirname, 'user');
if (!fsSync.existsSync(userDir)) {
    fsSync.mkdirSync(userDir, { recursive: true });
}

const ptyProcess = pty.spawn('bash', [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: userDir, //current working directory  
    env: process.env
  });
  // Set up bash environment with directory restrictions
ptyProcess.write(`
    # Change to user directory
    cd "${userDir}"
    
    # Override cd command to restrict navigation
    function cd() {
        local new_dir="$1"
        if [ -z "$new_dir" ]; then
            new_dir="${userDir}"
        fi
        
        # Convert to absolute path if relative
        if [[ "$new_dir" != /* ]]; then
            new_dir="$(pwd)/$new_dir"
        fi
        
        # Normalize path
        new_dir="$(realpath -s "$new_dir" 2>/dev/null || echo "$new_dir")"
        
        # Check if the new directory is within the user directory
        if [[ "$new_dir" == "${userDir}"* ]]; then
            command cd "$new_dir"
        else
            echo "Permission denied: Cannot access directories outside of user workspace"
            return 1
        fi
    }
    
    # Set custom prompt to show restricted environment
    export PS1="\\[\\033[01;32m\\]user-workspace\\[\\033[00m\\]:\\[\\033[01;34m\\]\\w\\[\\033[00m\\]\\$ "
    
    # Show welcome message
    echo "You are in a restricted workspace. You can only access files within the user directory."
    echo "Current location: $(pwd)"
    echo ""
    \n`);
  


io.attach(server); 


chokidar.watch('./user').on('all', (event,path)=>{
    io.emit('file:refresh', path)
})

ptyProcess.onData(data =>{
    io.emit('terminal:data', data) 
})

io.on('connection', (socket)=>{
    console.log('socket connected', socket.id);

    socket.on('file:change', async ({path: filePath, content}) => {
        const sanitizedPath = filePath.replace(/\.\./g, '');
        const fullPath = `./user/${sanitizedPath}`;
        
        const resolvedPath = path.resolve(fullPath);
        if (!resolvedPath.startsWith(path.resolve('./user'))) {
            console.error('Attempted directory traversal attack:', filePath);
            return;
        }
        
        await fs.writeFile(fullPath, content);
    });


    socket.on('terminal:write', (data) =>{
        ptyProcess.write(data);
    })
})



app.get('/files', async (req, res)=>{
    const fileTree = await GenerateFileTree('./user');
    return res.json({ tree: fileTree})
})

app.get('/files/content', async(req, res) => {
    const filePath = req.query.path;
    
    // Validate path is within user directory
    const sanitizedPath = filePath.replace(/\.\./g, '');
    const fullPath = `./user/${sanitizedPath}`;
    
    // Check if path attempts to escape user directory
    const resolvedPath = path.resolve(fullPath);
    if (!resolvedPath.startsWith(path.resolve('./user'))) {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    try {
        const content = await fs.readFile(fullPath, 'utf-8');
        return res.json({ content });
    } catch (error) {
        return res.status(404).json({ error: 'File not found' });
    }
});

server.listen(9000, ()=>{
    console.log('docker runnning on port 9000')
});


async function GenerateFileTree(directory){
    const tree = {}

    async function buildTree(currentDir, currentTree){
        const files = await fs.readdir(currentDir)

        for (const  file of files){
            const filePath = path.join(currentDir, file)
            const stat = await fs.stat(filePath)

            if(stat.isDirectory()){
                currentTree[file] = {}
                await buildTree(filePath, currentTree[file])
            }else{
                currentTree[file] = null;
            }
        }
    }

    await buildTree(directory, tree)
    return tree
}