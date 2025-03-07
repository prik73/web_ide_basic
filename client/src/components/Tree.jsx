const FileTreeNode = ({ fileName, nodes, onSelect, path }) => {
    const isFolder = nodes !== null; // Explicit check

    return (
        <div onClick={(e)=>{
            e.stopPropagation()
            if(isFolder) return;

            onSelect(path)

        }} className={isFolder ? "folder-node" : "file-node"}>
            {fileName}
            {isFolder && fileName !== "node_modules" &&(
                <ul>
                    {Object.keys(nodes).map(child => (
                        <li key={child}>
                            <FileTreeNode 
                                onSelect={onSelect}
                                path={path + '/'+ child}
                                fileName={child}
                                nodes={nodes[child]}
                            />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

const FileTree = ({ tree, onSelect }) => {
    console.log(tree);
    return (
        <FileTreeNode 
            onSelect={onSelect}
            fileName={"/"}
            nodes={tree}
            path=""
        />
    );
};

export default FileTree;
