import { ApiError } from "../utils/ApiErrors.js";
import { asyncHandller } from "../utils/asyncHandller.js";
import { User } from "../models/user.models.js";
import jwt from "jsonwebtoken";

export const varifyJWT = asyncHandller(async(req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    
        if (!token) {
            throw new ApiError(400, "Unauthorized User")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -accessToken")
    
        if (!user) {
            throw new ApiError(400, "Invalid access token")
        }
    
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(400, error?.message || "Invalid access token")
    }
})
