import BaseModel from "./baseModel"
import TaskModel from './taskModel'

const lexicon: { [name: string]: string[]} = {
    'resistance-training': ['workout', 'ub workout', 'lb workout', 'fb workout', 'upper body workout', 'lower body workout', 'full body workout', 'lbw', 'fbw', 'ubw', 'ubrw', 'ubmew', 'ub max effort workout', 'upper body max effort workout', 'upper body repetition'],
    'cleaning': ['dishes', 'wash dishes', 'jhadu', 'pocha', 'poccha', 'vacuum', 'mini vacuum', 'clean kitchen', 'toilet', 'toilet seat', 'granite', 'litterbox', 'bin', 'take out bin', 'take out bins', 'bins', 'clean balcony', 'dusting', 'clean table', 'cleaned table', 'tidy', 'tidy up'],
    'chore': ['laundry', 'dry laundry', 'breakfast', 'lunch', 'dinner', 'cook', 'water plants', 'plants', 'grocery', 'groceries', 'watered plants'],
    'cardio': ['swimming', 'running', 'walking'],
    'productivity': ['meditation', 'study', 'coding', 'personal project', 'wordle', 'read', 'reading', 'german'],
    'health': ['ate fruit', 'fruit', 'protein', 'stretching', 'foal roll', 'massage', 'gun massage', 'yoga', 'bathed', 'bath', 'brush', 'brushed', 'moisturised']
}

const scoreMap: { [name: string]: number} = {
    'cardio': 10,
    'resistance-training': 5, 
    'cleaning': 3,
    'chore': 2,
    'productivity': 4,
    'health': 3
}
const getScore = (subject: string): number => {
    const r = /\d+/
    let multiplier = 1
    const match = subject.match(r)
    if (match) {
        multiplier *= match[0] ? parseInt(match[0]) : 1
        if (multiplier != 1) {
            subject = subject.replace(multiplier + '', '').replace(' x ', '')
        }
    } 
    for (const category in lexicon) {
        if (lexicon[category].find(x => {
            return x.toLowerCase().includes(subject.toLowerCase().trim())
        })) {
            return scoreMap[category] * multiplier
        }
    }
    return 0
}

export class TaskRouter {
    model: TaskModel
    constructor (baseModel: BaseModel) {
        this.model = new TaskModel(baseModel)
    }
    async addTask (task: any) {
        if (!task.subject) {
            return Promise.reject('Subject not found')
        }
        const score = getScore(task.subject)
        if (!score) {
            return Promise.reject('Score not found for ' + task.subject)
        }
        task.score = score
        task.creation_date = new Date()
        return Promise.resolve(this.model.create(task))
    }

    async getTasks(query: object, limit?: number) {
        return this.model.find(query, limit)
    }
    
    async delete(query: object) {
        return this.model.delete(query)
    }
}