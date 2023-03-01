import React from 'react'

export default class SetupPage extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			taskCategoryRows: [],
			dirty: false,
			saveSuccess: false,
			searchTaskCategories: [],
			searchTasks: [],
			categories: [],
			query: '',
		}
	}

	componentDidMount() {
		this.fetchCategories()
	}

	async fetchCategories() {
		try {
			const result = await fetch('/categories')
			const categories = await result.json()
			this.setState((state) => ({
				categories,
			}))
		} catch (e) {
			console.log(e)
		}
	}
	addRow(e) {
		const newRow = {
			subject: '',
			category: '',
		}
		this.setState((state) => ({
			taskCategoryRows: state.taskCategoryRows.concat(newRow),
			dirty: false,
		}))
	}

	handleAlertClose(e) {
		this.setState((state) => ({
			saveSuccess: false,
		}))
	}

	async handleCategoryOnChange(e, idx) {
		await this.updatetaskCategoryRows(e.target.value, 'category', idx)
		this.checkIsDirty()
	}

	async handleSubjectOnChange(e, idx) {
		await this.updatetaskCategoryRows(e.target.value, 'subject', idx)
		this.checkIsDirty()
	}

	checkIsDirty() {
		const isDirty = !this.state.taskCategoryRows.find((x) => x.subject == '' || x.category == '')
		if (isDirty) {
			this.setState((state) => ({
				dirty: isDirty,
			}))
		}
	}

	async updatetaskCategoryRows(value, prop, idx) {
		const tasks = structuredClone(this.state.taskCategoryRows)
		tasks[idx][prop] = value
		await this.setState((state) => ({
			taskCategoryRows: tasks,
		}))
	}

	async save(e) {
		fetch('/taskCategories', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json;charset=utf-8',
			},
			body: JSON.stringify(this.state.taskCategoryRows),
		})
			.then((resp) => {
				this.setState((state) => ({
					taskCategoryRows: [],
					saveSuccess: true,
				}))
			})
			.catch((e) => {
				console.log(e)
			})
	}

	alert() {
		if (this.state.saveSuccess) {
			return (
				<div className='alert alert-success alert-dismissible' role='alert'>
					<div>Save successful!</div>
					<button type='button' className='btn-close' onClick={(e) => this.handleAlertClose(e)}></button>
				</div>
			)
		}
	}

	async deleteRow(idx) {
		const newRowSet = this.state.taskCategoryRows.slice(0)
		newRowSet.splice(idx, 1)
		await this.setState((state) => ({
			taskCategoryRows: newRowSet,
		}))
		this.checkIsDirty()
	}

	onQueryChange(query) {
		this.setState((state) => ({
			query,
		}))
	}

	handleKeyDown(e) {
		if (this.state.query && e.code == 'Enter' && e.key == 'Enter') {
			e.preventDefault()
			this.search()
			return false
		}
	}

	async search() {
		try {
			const categories = fetch('/taskCategories?subject=' + this.state.query)
			const tasks = fetch('/searchTasks?search=' + this.state.query + '&limit=5')

			const result = await Promise.all([categories, tasks])

			const searchTaskCategories = await result[0].json()
			const searchTasks = await result[1].json()

			this.setState((state) => ({
				searchTaskCategories,
				searchTasks,
			}))
		} catch (e) {
			console.log(e)
		}
	}

	addCategory(e) {
		const temp = this.state.categories.splice(0)
		temp.push({
			category: '',
		})
		this.setState((state) => ({
			categories: temp,
		}))
	}

	onChangeCategory(e, idx, prop) {
		const temp = this.state.categories.splice(0)
		temp[idx][prop] = e.target.value
		this.setState((state) => ({
			categories: temp,
		}))
	}

	async saveCategories(e) {
		const newCategories = this.state.categories.filter(x => !x._id)
		const me = this
		fetch('/categories', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json;charset=utf-8',
			},
			body: JSON.stringify(newCategories),
		})
			.then((resp) => {
				me.fetchCategories()
				this.setState((state) => ({
					saveSuccess: true
				}))
			})
			.catch((e) => {
				console.log(e)
			})
	}

	render() {
		return (
			<div className='container-fluid mb-md-3'>
				<div className='row justify-content-center pt-5'>
					<div className='col col-md-6 col-12'>
						<div id='alertPlaceholder'>{this.alert()}</div>
						<div className='row align-items-center justifiy-content-between border-bottom px-2 mb-4 text-muted'>
							<p className='col-md-3 col-4 mb-2 h5'>Search</p>
							<div className='col-md-8 col-8 mb-2'>
								<input
									type='text'
									className='form-control'
									value={this.state.query}
									placeholder='Search a task'
									onChange={(e) => this.onQueryChange(e.target.value)}
									onKeyDown={(e) => this.handleKeyDown(e)}
								/>
							</div>
						</div>
						
						<div className='row'>
							{this.state.searchTasks.length ? (
								<div className='table-responsive'>
									<table className='table table-borderless caption-top'>
										<caption>Recent Tasks</caption>
										<thead className='table-light'>
											<tr>
												<th scope='col' className='text-muted'>
													Task
												</th>
												<th scope='col' className='text-muted'>
													Date
												</th>
												<th scope='col' className='text-muted'>
													Category
												</th>
											</tr>
										</thead>
										<tbody className='list'>
											{this.state.searchTasks.map((x, idx) => {
												return (
													<tr key={x._id}>
														<td>{x.subject}</td>
														<td>{new Date(x.date).toDateString()}</td>
														<td>{x.category}</td>
													</tr>
												)
											})}
										</tbody>
									</table>
								</div>
							) : (
								''
							)}
						</div>

						<div className='row'>
							{this.state.searchTaskCategories.length ? (
								<div className='table-responsive'>
									<table className='table table-borderless caption-top'>
										<caption>Task Category</caption>
										<thead className='table-light'>
											<tr>
												<th scope='col' className='text-muted'>
													Task
												</th>
												<th scope='col' className='text-muted'>
													Category
												</th>
											</tr>
										</thead>
										<tbody className='list'>
											{this.state.searchTaskCategories.map((x, idx) => {
												return (
													<tr key={x._id}>
														<td>{x.subject}</td>
														<td>{x.category}</td>
													</tr>
												)
											})}
										</tbody>
									</table>
								</div>
							) : (
								''
							)}
						</div>

						<div className='row align-items-center justify-content-between border-bottom px-2 mt-2 mb-4 text-muted'>
							<p className='col-md-4 col-4 h5'>Category List</p>
							<div className='col-md-4 col-6 mb-2'>
								<div className='d-flex flex-row'>
									<button type='button' className='btn btn-sm btn-primary form-control' onClick={(e) => this.addCategory(e)}>
										Add
									</button>
									<button type='button' className='btn btn-sm btn-primary form-control ms-2' onClick={(e) => this.saveCategories(e)} disabled={this.state.categories.find(x => x._id == undefined) ? false : true}>
										Save
									</button>
								</div>
							</div>
						</div>
						<div className='row'>
							<div className='table-response'>
								<table className='table table-borderless caption-top'>
									<thead className='table-light'>
										<tr>
											
											<th scope='col' className='text-muted'>
												Category
											</th>
											<th scope='col' className='text-muted'>
												Score
											</th>
										</tr>
									</thead>
									<tbody className='list'>
										{this.state.categories.map((x, idx) => {
											return (
												<tr key={idx}>
													
													<td>{x._id ? x.category : <input className='form-control' type='text' placeholder='Enter new category' onChange={(e) => this.onChangeCategory(e, idx, 'category')}></input>}</td>
													<td>{x._id ? x.score : <input className='form-control' type='text' placeholder='Enter score' onChange={(e) => this.onChangeCategory(e, idx, 'score')}></input>}</td>
												</tr>
											)
										})}
									</tbody>
								</table>
							</div>
						</div>

						<div className='row border-bottom px-2 mt-2 mb-4 text-muted'>
							<h5>Add Category to task</h5>
						</div>
						<div className='row align-items-center justify-content-evenly m-2'>
							<div className='col-md-2 col-4 mb-2'>
								<button type='button' className='btn btn-sm btn-primary form-control' onClick={(e) => this.addRow(e)}>
									Add
								</button>
							</div>
							<div className='col-md-2 col-4 mb-2'>
								<button type='button' className='col-md-2 col-4 mb-2 btn btn-sm btn-primary form-control' onClick={(e) => this.save(e)} disabled={!this.state.dirty}>
									Save
								</button>
							</div>
						</div>
						{this.state.taskCategoryRows.map((x, idx) => {
							return (
								<div id='taskRow' key={idx} className='row justify-content-between'>
									<div className='col-12 col-md-5 mb-2'>
										<input type='text' className='form-control' value={x.subject} placeholder='Enter new task' onChange={(e) => this.handleSubjectOnChange(e, idx)}></input>
									</div>
									<div className='col-10 col-md-6 mb-2'>
										<select className='form-select' aria-label='Default select example' value={x.category} onChange={(e) => this.handleCategoryOnChange(e, idx)}>
											<option defaultValue>Select category</option>
											{
												this.state.categories.map((x, idx) => {
													const category = x.category
													const categoryName = category.split('-').map(y => y.substr(0,1).toUpperCase().concat(y.substr(1, y.length))).join(' ')
													return (
														<option key={idx} value={category}>{categoryName}</option>
													)
												})
											}
										</select>
									</div>
									<div className='col-2 col-md-1 mt-2'>
										<button type='button' className='btn-close text-center' aria-label='Close' onClick={(e) => this.deleteRow(idx)}></button>
									</div>
								</div>
							)
						})}
					</div>
				</div>
			</div>
		)
	}
}
