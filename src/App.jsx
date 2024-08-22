import './App.css'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Home from "../src/Home.jsx"
import GameScreen from "../src/GameScreen.jsx"
import { Route, Routes} from "react-router-dom"

function App() {
	return (
		<>
			<ToastContainer
				pauseOnHover={false}
				hideProgressBar={true}
				autoClose={2000}
			/>
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/game" element={<GameScreen />} />
			</Routes>
		</>
	);
}

export default App