const express = require('express')

const app = express()

app.get('/', (req, res)=>{
    res.json({msg: "hello from" })
})

app.listen(8000, ()=> console.log('listening'))