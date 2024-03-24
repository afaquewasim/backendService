import dotenv from "dotenv"
import connectDB from "./db/index.js"
import {app} from './app.js'

dotenv.config({
    path: './.env'
})

connectDB()
    .then(() => {
        app.listen(process.env.PORT || 9000, () => {
            console.log(`Server is running at the port: ${process.env.PORT}`);
        })
    })
    .catch((error) => {
        console.log("MONGO DB connection failed", error);
    })







// (async() => {
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("EROOR", (error) => {
//             console.log("Error", error);
//             throw error
//         })

//         app.listen(process.env.PORT, () => {
//             console.log(`App is listening at PORT${process.env.PORT}`);
//         })
//     } catch (error) {
//         console.log('ERROR', error)
//         throw error
//     }
// })()