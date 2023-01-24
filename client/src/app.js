import React from 'react'
import ReactDOM from 'react-dom/client'
import HomePage from './pages/home'
import SetupPage from './pages/setup'

export default class App extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			root: null,
			pages: [{
				id: 'HomePage',
				path: '#'
			}, {
				id: 'SetupPage',
				path: '#setup'
			}]
		}
	}
	async componentDidMount() {
		const main = ReactDOM.createRoot(document.getElementById('main'))
		const path = window.location.href.split('/').length > 2 ? window.location.href.split('/')[3] || '#' : '#'
		await this.setState((state) => ({
			root: main
		}))
		this.renderPage(path)
	}
	renderPage(path) {
		const currentPage = this.state.pages.find(x => x.path == path)['id']
		const main = this.state.root
		switch (currentPage) {
			case 'HomePage':
				main.render(<HomePage />)
				break
			case 'SetupPage':
				main.render(<SetupPage />)
				break
			default:
				break
		}
	}

	render() {
		return (
			<div>
				<nav className='navbar navbar-expand-lg navbar-light bg-light shadow px-2'>
					<div className='container-fluid'>
						<span className='navbar-brand'>Protrack</span>
						<button
							className='navbar-toggler'
							type='button'
							data-bs-toggle='collapse'
							data-bs-target='#navbarSupportedContent'
							aria-controls='navbarSupportedContent'
							aria-expanded='false'
							aria-label='Toggle navigation'
						>
							<span className='navbar-toggler-icon'></span>
						</button>
						<div className='collapse navbar-collapse' id='navbarSupportedContent'>
							<ul className='navbar-nav me-auto mb-2 mb-lg-0'>
								<li className='nav-item'>
									<a id='HomePage' className='nav-link' href="#" onClick={(e) => this.renderPage('#')}>
										Home
									</a>
								</li>
								<li className='nav-item'>
									<a id='SetupPage' className='nav-link' href="#setup" onClick={(e) => this.renderPage('#setup')}>
										Setup
									</a>
								</li>
							</ul>
						</div>
					</div>
				</nav>
				<div id='main'></div>
			</div>
		)
	}
}
