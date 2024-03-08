// const asyncHandller = (fn) => async(req, res, next) =>{
//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success: true,
//             message: err.message
//         })
//     }
// }

const asyncHandller = (requestHandler) =>{
    (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
}

export { asyncHandller }