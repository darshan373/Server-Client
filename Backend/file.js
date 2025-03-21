const fs=require("fs")


// sync fun
// fs.writeFileSync("./test.txt", "Jatin is the bhakra")

// async fun
// fs.writeFile("./test.txt", "Jatin is the bhakra",(err)=>{
//     console.log(err)
// } )


//read sync
// const result=fs.readFileSync("./test.txt","utf-8")
// console.log(result)


// async read
fs.readFile("./test.txt","utf-8",(err,res)=>{
    err ? console.log(err):console.log(res)
})
