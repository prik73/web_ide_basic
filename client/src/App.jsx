import { useEffect, useState, useCallback } from 'react';
import  FileTree  from './components/Tree'

import './App.css'
import Terminal from './components/Terminal'
import socket from './socket';
import AceEditor from "react-ace";


import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools";



function App() {
  const [ fileTree, setFileTree ] = useState({});
  const [selectedFile, setSelectedFile] = useState("");

  const [selectedFileContent, setFileContent] = useState("")
  const [code, setCode ] = useState("")

  const isSaved = selectedFileContent === code



  const getFileTree = async() => {
        const response = await fetch("http://localhost:9000/files")
        const result = await response.json()

        setFileTree(result.tree);
  };

  const getFileContent = useCallback(async  ()=>{
    if(!selectedFile) return;
    const response = await fetch(`http://localhost:9000/files/content?path=${selectedFile}`);

    const result = await response.json()

    setFileContent(result.content)
  }, [selectedFile])

  useEffect(()=>{
        if(selectedFile && selectedFileContent){
            setCode(selectedFileContent);
        }
  }, [selectedFile, selectedFileContent])


  useEffect(()=>{
    getFileTree()
  }, [])

  useEffect(()=>{
    setCode("");

  }, [selectedFile])

  useEffect(()=>{
    socket.on('file:refresh', getFileTree)
    return()=>{
        socket.off('file:refresh', getFileTree)
    }
  },[])

  useEffect(()=>{
    if(code && !isSaved){
        const timer = setTimeout(()=>{
            console.log('save code', code)
            socket.emit('file:change', {
                path: selectedFile,
                content: code
            })
        }, 5000)

        return ()=>{
            clearTimeout(timer)
        }
    }
  }, [code, selectedFile, isSaved])


  useEffect(()=>{
    if(selectedFile) getFileContent();
  },[getFileContent, selectedFile])
   

  return (
   <div className="playground-container">
    <div className="editor-container">

        {/* file ka tree structure */}
        <div className="file-structure">
            <FileTree onSelect={(path)=> setSelectedFile( path)} tree={fileTree} />
        </div>

        {/* editor */}
        <div className="editor">
            {selectedFile && <p>{selectedFile.replaceAll("/", "|>")} {isSaved ? "saved": "unsaved"}</p>}
            <AceEditor 
            value={code}
            onChange={e=>setCode(e)}
            />
        </div>

      
    </div>
      <div className="terminal-container">
        <Terminal />
     </div>
    
   </div>
  )
}

export default App
