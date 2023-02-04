import mongoose from 'mongoose'
import { TaskCategoriesModel, TaskModel }  from '../models/models'

const HOST = '192.168.1.4:27017'
const DB = 'planner'
const DBLINK = `mongodb://${HOST}/${DB}`;

mongoose.connect(DBLINK)
const Task = TaskModel(mongoose)
const TaskCategories = TaskCategoriesModel(mongoose)
let notFound = 0

const findTaskCategoryAnUpdate  = (task: any, isLast: boolean = false) : Promise<void>  => {
    return new Promise<void>(async (resolve, reject) => {
        try {
            const categoryDoc = await TaskCategories.findOne({subject: task.subject.toLowerCase()})
            if (categoryDoc) {
                await Task.updateOne({
                    _id: task._id
                }, {
                    $set: {
                        category: categoryDoc.category
                    }
                })
            } else {
                notFound++
            }
            if (isLast) {
                console.log('updates done')
                console.log(`${notFound} not found`)
                await mongoose.disconnect()
            }
            resolve()
        }
        catch (e) {
            console.log(e)
            reject()
        }
    })
}
    
(async () => {
    try {
        
        const tasks = await Task.find({
            category: {
                $exists: false
            }
        }).limit(24)

        console.log('Erreneous tasks fetched')
        console.log('looping')

        // console.log(tasks.map(x => x.subject))

        await tasks.reduce(async (prev, curr, idx, arr) => {
            await prev
            return  findTaskCategoryAnUpdate(curr, idx == arr.length - 1)
        }, Promise.resolve())
    }
    catch (e) {
        console.log(e)
    }
    finally {
        // mongoose.disconnect()
    }
})()
