import React from 'react'

export default class MajorTaskPanel extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			pendingTasks: [],
			mjTaskCheckedCount: 0,
			selectState: {},
			task: ''
		}
	}
	componentDidMount() {
		this.getPendingMajorTasks()
	}
	
	handleAddBtnClick (e) {
		e.preventDefault()
		if (this.state.task) {
			this.addNewMjTask(this.state.task)
		}
	}

	handleChange(e) {
		this.setState({task: e.target.value})
	}

	async handleDeleteBtnClick (e) {
		e.preventDefault()
		let newTaskList = []
		const selectedTasks = []
		if (this.state.pendingTasks.length) {
			newTaskList = this.state.pendingTasks.slice(0)
			Object.keys(this.state.selectState).forEach(x => {
				if (this.state.selectState[x]) {
					newTaskList = newTaskList.filter(y => y._id !== x)
					selectedTasks.push(x)
				}
			})
		}
		const confirmDelete = confirm('Are you sure that you want to delete selected tasks?')
		if (confirmDelete) {
			await this.setState((state) => ({
				pendingTasks: newTaskList
			}))
			this.deleteMajorTasks(selectedTasks)
			this.getPendingMajorTasks()
		}
	}
	
	handleKeyDown (e) {
		if (this.state.task && e.code == 'Enter' && e.key == 'Enter') {
			e.preventDefault()
			this.addNewMjTask(e.target.value)
			return false
		}
	}

	async handleMarkComplete (e) {
		e.preventDefault()
		let newTaskList = []
		const selectedTasks = []
		if (this.state.pendingTasks.length) {
			newTaskList = this.state.pendingTasks.slice(0)
			Object.keys(this.state.selectState).forEach(x => {
				if (this.state.selectState[x]) {
					newTaskList = newTaskList.filter(y => y._id !== x)
					selectedTasks.push(x)
				}
			})
		}
		const confirmAdd = confirm('Are you sure that you want to complete selected tasks?')
		console.log(confirmAdd)
		if (confirmAdd) {
			await this.updateMajorTasks(selectedTasks)
			this.getPendingMajorTasks()
			// TODO: getTasksForSelectedDate()
		}
	}

	async handleSelect (e, _id) {
		let selectStateClone = Object.assign({}, this.state.selectState)
		selectStateClone[_id] = e.target.checked
		this.setState((state) => ({
			selectState: selectStateClone
		}))
		if (e.target.checked) {
			await this.setState((state) => ({
				mjTaskCheckedCount: state.mjTaskCheckedCount + 1
			}))
		} else {
			await this.setState((state) => ({
				mjTaskCheckedCount: state.mjTaskCheckedCount - 1
			}))
		}
	}

	async handleSelectAllBtnClick (e) {
		e.preventDefault()
		const selectStateCopy = this.state.selectState
		Object.keys(selectStateCopy).forEach(x => {
			selectStateCopy[x] = true
		})
		await this.setState((state) => ({
			selectState: selectStateCopy
		}))
	}

	getPendingMajorTasks() {
		const me = this
		fetch('/majorTasks?status=pending')
			.then((resp) => {
				return resp.json()
			})
			.then((tasks) => {
				if (tasks.length) {
					const selectState = {}
					tasks.forEach(x => {
						selectState[x._id] = false
					})
					this.setState({
						pendingTasks: tasks,
						selectState: selectState
					})
					document.getElementById('selectMjTaskBtn').disabled = false
				}
			})
			.catch((e) => {
				console.log(e)
			})
	}

	async addNewMjTask(subject) {
		try {
			const score = prompt('Add a score to this task (default: 30)')
			await this.createMjTask({
				subject,
				score: score || 30,
			})
		} catch (e) {
			console.log(e)
		}
		this.setState({
			task: ''
		})
	}

	async createMjTask(task) {
		try {
			const resp = await fetch('/majorTask', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json;charset=utf-8',
				},
				body: JSON.stringify(task),
			})
			if (resp.ok) {
				console.log('Major Task added')
				this.getPendingMajorTasks()
			} else {
				console.log(resp.body)
				const result = await resp.json()
				throw result.error
			}
		} catch (e) {
			console.log(e)
			if (e.validationError) {
				throw e.error
			}
		}
	}

	async deleteMajorTasks (idsToDelete) {
		const resp = await fetch('/majorTasks', {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json;charset=utf-8',
			},
			body: JSON.stringify(idsToDelete),
		})
		if (resp.ok) {
			console.log('Major Task deleted')
		} else {
			console.log(resp.body)
			const result = await resp.json()
			throw result.error
		}
	}

	async updateMajorTasks (ids) {
		const resp = await fetch('/majorTasks', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json;charset=utf-8',
			},
			body: JSON.stringify({
				ids,
				status: 'complete',
			}),
		})
		if (resp.ok) {
			console.log('Major Tasks updated')
		} else {
			console.log(resp.body)
			const result = await resp.json()
			throw result.error
		}
	}

	render() {
		return (
			<div className='col-12'>
				<div className='row pt-2 bg-danger'>
					<h5 className='col'>Major Tasks</h5>
				</div>
				<div className='row my-3 row-cols-sm-3 align-items-center'>
					<div className='col-sm-12 col-md-4 mb-2'>
						<input id='newMjTask' type='text' placeholder='Enter task' className='form-control' value={this.state.task} onChange={(e) => this.handleChange(e)} onKeyDown={(e) => this.handleKeyDown(e)}></input>
					</div>
					<div className='col-4 col-md-2 mb-2'>
						<button id='addMjTaskBtn' className='btn btn-sm btn-primary form-control' type='button' onClick={(e) => this.handleAddBtnClick(e)}>
							Add
						</button>
					</div>
					<div className='col-4 col-md-2 mb-2'>
						<button id='selectMjTaskBtn' className='btn btn-sm btn-primary form-control' type='button' onClick={(e) => this.handleSelectAllBtnClick(e)}>
							Select All
						</button>
					</div>
					<div className='col-4 col-md-2 mb-2'>
						<button id='deleteMjTaskBtn' disabled={!Object.keys(this.state.selectState).filter(x => this.state.selectState[x]).length} className='btn btn-sm btn-primary form-control' type='button' onClick={(e) => this.handleDeleteBtnClick(e)}>
							Delete
						</button>
					</div>
					<div className='col-4 col-md-2 mb-2'>
						<button id='markMjTaskBtn' disabled={!Object.keys(this.state.selectState).filter(x => this.state.selectState[x]).length} className='btn btn-sm btn-success form-control' type='button' onClick={(e) => this.handleMarkComplete(e)}>
							Complete
						</button>
					</div>
				</div>
				<div className='row my-3'>
					<ul id='majorTasksList' className='col list-group p-2'>
						{this.state.pendingTasks.map((x) => {
							return (
								<li mongo_id={x._id} key={x._id} className='list-group-item d-flex justify-content-between'>
									<div>
										<input type='checkbox' className='form-check-input me-2' checked={this.state.selectState[x._id]} onChange={(e) => this.handleSelect(e, x._id)}/>
										<span>{x.subject}</span>
									</div>
									<span className='badge bg-primary rounded-pill'>{x.score}</span>
								</li>
							)
						})}
					</ul>
				</div>
			</div>
		)
	}
}
