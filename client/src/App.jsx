import { useEffect, useState, useCallback } from 'react';
import FileTree from './components/Tree';
import './App.css';
import Terminal from './components/Terminal';
import socket from './socket';
import AceEditor from "react-ace";

import ace from 'ace-builds';
import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-html";
import "ace-builds/src-noconflict/mode-css";
import "ace-builds/src-noconflict/mode-jsx";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/mode-text"; 
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools";

ace.config.set('basePath', '/node_modules/ace-builds/src-noconflict');

// Get backend URL from environment variable or fallback to localhost for development
const BACKEND_URL = import.meta.env.VITE_API_URL 
console.log("Backend URL:", import.meta.env.VITE_API_URL);

function App() {
  const [fileTree, setFileTree] = useState({});
  const [selectedFile, setSelectedFile] = useState("");
  const [selectedFileContent, setFileContent] = useState("");
  const [code, setCode] = useState("");
  const [mode, setMode] = useState("text"); // Default to text mode

  const isSaved = selectedFileContent === code;

  const getFileMode = (filePath) => {
    if (!filePath) return "text";
    
    const extension = filePath.split('.').pop().toLowerCase();
    const modeMap = {
      'js': 'javascript',
      'jsx': 'jsx',
      'ts': 'typescript',
      'tsx': 'typescript',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'py': 'python',
      'java': 'java',
      // Add more mappings as needed
    };
    return modeMap[extension] || "text";
  };

  const getFileTree = async() => {
    const response = await fetch(`${BACKEND_URL}/files`);
    const result = await response.json();
    setFileTree(result.tree);
  };

  const getFileContent = useCallback(async () => {
    if(!selectedFile) return;
    const response = await fetch(`${BACKEND_URL}/files/content?path=${selectedFile}`);
    const result = await response.json();
    setFileContent(result.content);
  }, [selectedFile]);

  useEffect(() => {
    if(selectedFile && selectedFileContent) {
      setCode(selectedFileContent);
    }
  }, [selectedFile, selectedFileContent]);

  useEffect(() => {
    getFileTree();
  }, []);

  useEffect(() => {
    setCode("");
  }, [selectedFile]);

  useEffect(() => {
    socket.on('file:refresh', getFileTree);
    return() => {
      socket.off('file:refresh', getFileTree);
    };
  }, []);

  useEffect(() => {
    if(code && !isSaved) {
      const timer = setTimeout(() => {
        console.log('save code', code);
        socket.emit('file:change', {
          path: selectedFile,
          content: code
        });
      }, 5000);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [code, selectedFile, isSaved]);

  useEffect(() => {
    if(selectedFile) getFileContent();
  }, [getFileContent, selectedFile]);
    
  return (
    <div className="playground-container">
      <div className="editor-container">
        {/* file ka tree structure */}
        <div className="file-structure">
          <FileTree onSelect={(path) => setSelectedFile(path)} tree={fileTree} />
        </div>
        
        {/* editor */}
        <div className="editor">
          {selectedFile && <p>{selectedFile.replaceAll("/", "|>")} {isSaved ? "saved": "unsaved"}</p>}
          <AceEditor
            value={code}
            onChange={e => setCode(e)}
          />
        </div>
      </div>
      
      <div className="terminal-container">
        <Terminal />
      </div>
    </div>
  );
}

export default App;