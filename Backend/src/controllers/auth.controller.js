const userModel = require("../models/user.model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")

const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 24 * 60 * 60 * 1000
}

async function registerUserController(req, res) {

    const { username, email, password } = req.body

    if (!username || !email || !password) {
        return res.status(400).json({
            message: "Please provide username,email and password"
        })
    }

    const isUserAlreadyExist = await userModel.findOne({
        $or: [{ username }, { email }]
    })

    if (isUserAlreadyExist) {
        return res.status(400).json({
            message: "Account already exist with this email address or username"
        })
    }

    const hash = await bcrypt.hash(password, 10)

    const user = await userModel.create({
        username,
        email,
        password: hash
    })

    const token = jwt.sign(
        {
            id: user._id,
            username: user.username
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    )

    res.cookie("token", token, cookieOptions)

    res.status(201).json({
        message: "User Registered Successfully",
        token: token,  // ✅ added
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    })
}

async function loginUserController(req, res) {

    const { email, password } = req.body

    const user = await userModel.findOne({ email })

    if (!user) {
        return res.status(400).json({
            message: "Invalid Email or Password"
        })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
        return res.status(400).json({
            message: "Invalid Email or Password"
        })
    }

    const token = jwt.sign(
        {
            id: user._id,
            username: user.username
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    )

    res.cookie("token", token, cookieOptions)

    res.status(200).json({
        message: "User loggedIn successfully",
        token: token,  // ✅ added
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    })
}

async function logoutUserControl(req, res) {

    // ✅ Cookie ya header dono se token lo
    const token = req.cookies?.token || 
                  req.headers?.authorization?.split(" ")[1]

    if (token) {
        await tokenBlacklistModel.create({ token })
    }

    res.clearCookie("token", cookieOptions)

    res.status(200).json({
        message: "User logged out successfully"
    })
}

async function getMeController(req, res) {

    const user = await userModel.findById(req.user.id)

    res.status(200).json({
        message: "User Details Fetch Successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    })
}

module.exports = {
    registerUserController,
    loginUserController,
    logoutUserControl,
    getMeController
}