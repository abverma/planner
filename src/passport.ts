import LocalStrategy from 'passport-local'
import UserModel from './models/userModel'
import mongoose from 'mongoose'
import passport from 'passport'


export default (passport: passport.PassportStatic, mongoose: mongoose.Mongoose) => {
    passport.use(new LocalStrategy.Strategy(async function verify(username, password, cb) {
        const User = UserModel(mongoose)
        try {
            const user = await User.findOne({
                username
            })
            if (!user || user.password !== password) {
                return cb(null, false, { message: 'Incorrect username or password.' })
            }
            if (user && user.password === password) {
                return cb(null, username)
            }
        }
        catch (e) {
            console.log(e)
            return cb(e)
        }
        
    }))
    passport.serializeUser(function(user, cb) {
        process.nextTick(function() {
          cb(null, {username: user})
        })
    })
    passport.deserializeUser(function (user: string, cb) {
        process.nextTick(function () {
            return cb(null, user)
        })
    })
}
