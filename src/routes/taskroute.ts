import BaseModel from "../models/baseModel"
import TaskModel from '../models/taskModel'
import TaskCategoriesModel from "../models/taskCategoriesModel"

const scoreMap: { [name: string]: number} = {
    'cardio': 10,
    'resistance-training': 5, 
    'cleaning': 3,
    'chore': 2,
    'productivity': 4,
    'health': 3
}
const sanitizeSubject = (subject: string): any => {
    const r = /\d+/
    let multiplier = 1
    const match = subject.match(r)
    let returnSubject = subject.slice()
    if (match) {
        multiplier *= match[0] ? parseInt(match[0]) : 1
        if (multiplier != 1) {
            returnSubject = returnSubject.replace(multiplier + '', '').replace(' x ', '')
        }
    } 
    return {
        subject: returnSubject,
        multiplier
    }
}

export class TaskRouter {
    model: TaskModel
    taskCategoriesModel: TaskCategoriesModel
    constructor (baseModel: BaseModel) {
        this.model = new TaskModel(baseModel)
        this.taskCategoriesModel = new TaskCategoriesModel(baseModel)
    }
    async addTask (task: any) {
        try {
            if (!task.subject) {
                return Promise.reject({
                    validationError: true,
                    error: 'Subject not found'
                })
            }
            let score = 0
            task.subject = task.subject.trim()
            const {subject, multiplier } = sanitizeSubject(task.subject)
            let categoryDoc = await this.taskCategoriesModel.findOne({
                subject: subject
            })
            if (!categoryDoc) {
                categoryDoc = await this.taskCategoriesModel.findOne({
                    subject: new RegExp(subject).toLocaleString()
                })
            }
            if (categoryDoc) {
                score = scoreMap[categoryDoc.category]
            }
            if (!score) {
                return Promise.reject({
                    validationError: true,
                    error: 'Score not found for ' + task.subject
                })
            }
            task.score = score * multiplier
            task.creation_date = new Date()
            return Promise.resolve(this.model.create(task))
        } 
        catch (e) {
            console.log(e)
            return Promise.reject({
                error: e
            })
        }
    }

    async getTasks(query: object, limit?: number) {
        return this.model.find(query, limit)
    }
    
    async delete(query: object) {
        return this.model.delete(query)
    }

    async aggregate(pipelines: object) {
        return this.model.aggregate(pipelines)
    }
}