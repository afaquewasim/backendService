import { asyncHandller } from '../utils/asyncHandller.js'
import { ApiError } from '../utils/ApiErrors.js'
import { User } from '../models/user.models.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import router from '../routes/user.routes.js'

const registerUser = asyncHandller(async (req, res) => {
    const { fullname, username, email, password } = req.body
    console.log("email", email);

    if ([fullname, username, email, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All field are required")
    }
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User already exists")
    }

    const avatarLocalPath = req.files?.avatar[0].path
    // const coverImageLocalPath = req.files?.coverImage[0].path

    let coverImageLocalPath

    if (req.files && Array.isArray(req.files.coverImage && req.files.coverImage.length > 0)) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar is required")
    }

    const user = await User.create({
        email,
        fullname,
        password,
        username: username.toLowerCase(),
        avatar: avatar ? avatar.url : null,
        coverImage: coverImage?.url || ""
    })

    const createdUser = User.findById(user._id).select("-password -refreshToken")

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registring the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "Registered sucessfully")
    )
})

export { registerUser }