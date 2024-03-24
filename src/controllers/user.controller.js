import { asyncHandller } from '../utils/asyncHandller.js'
import { ApiError } from '../utils/ApiErrors.js'
import { User } from '../models/user.models.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import jwt from 'jsonwebtoken'

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh tokens")
    }
}

const registerUser = asyncHandller(async (req, res) => {
    const { fullname, username, email, password } = req.body
    // console.log("email", email);

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

    return res.status(200).json(
        new ApiResponse(200, createdUser, "Registered successfully")
    )
})

const loginUser = asyncHandller(async (req, res) => {
    const { email, username, password } = req.body

    if (!(email || username)) {
        throw new ApiError(404, "Email or Username is required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(400, "No user found with this email or username")
    }

    const isPasswordValid = await user.isPasswordCorrected(password)

    if (!isPasswordValid) {
        throw new ApiError(400, "Password is wrong")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    const loggedUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(

            new ApiResponse(
                200,
                {
                    user: loggedUser, accessToken, refreshToken
                },
                "User logged in sucessfuly"
            )
        )

})

const logoutUser = asyncHandller(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user.id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(200, {}, "User logout successfully")

})

const refreshAccessToken = asyncHandller(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unathorized refresh token")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken,
            process.env.ACCESS_REFRESH_SECRET
        )

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid user")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)

        const options = {
            httpOnly: true,
            secure: true
        }

        return res
            .status(200)
            .clearCookie("accessToken", accessToken, options)
            .clearCookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken: newRefreshToken
                    },
                    "Access token is refreshed")
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }

})

const changeCurrentPassword = asyncHandller(async (req, res) => {
    const { oldPassword, newPAssword } = req.body

    const user = await User.findById(user?._id)

    const isPasswordCorrect = await User.isPasswordCorrected(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Please enter correct password")
    }

    user.password = newPAssword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrUser = asyncHandller(async (req, res) => {
    returnres
        .status(200)
        .json(200, req.user, "Current user fetched successfully")
})

const updateUserDetail = asyncHandller(async (req, res) => {
    const { fullname, email } = req.body

    if (!(fullname || email)) {
        throw new ApiError(400, "Fullname and email are required")
    }

    const user = User.findByIdAndDelete(
        req.user?._id,
        {
            $set: {
                fullname,
                email
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Details updated successfully")
    )
})

const updateAvatar = asyncHandller(async (req, res) => {
    const avatarLocalPath = req.files?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading avatar file")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "avatar updated successfully")
        )

})

const updateCoverImage = asyncHandller(async (req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading cover image file")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: coverImage.url
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Cover image updated successfully")
        )

})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrUser,
    updateUserDetail,
    updateAvatar,
    updateCoverImage
}