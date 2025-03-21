
const jwt=require("jsonwebtoken")
const auth = async(req,res,next)=>{
    try {
        const token = req.cookies.accessToken || req?.headers?.authorization?.split(" ")[1]
       
        if(!token){
            return res.status(401).json({
                message : "Provide token"
            })
        }

        const decode = await jwt.verify(token,process.env.JWT_SECRET)

        if(!decode){
            return res.status(401).json({
                message : "unauthorized access",
                error : true,
                success : false
            })
        }

        req.user_id = decode.id

        next()

    } catch (error) {
        return res.status(500).json({
            message : "You have not login",///error.message || error,
            error : true,
            success : false
        })
    }
}

module.exports=auth