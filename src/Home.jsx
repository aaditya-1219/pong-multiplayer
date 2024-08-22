import React from 'react'
import { socket } from "../src/socket.js"
import WaitingScreen from "../components/WaitingScreen.jsx"
import Button from '../components/Button.jsx';
import Spinner from "../components/Spinner.jsx"
import { toast } from 'react-toastify';
import { useState,useEffect } from 'react'
import GameScreen from "../src/GameScreen.jsx"

function Home() {
	const [isLoading, setIsLoading] = useState(false)
	const [isWaiting, setIsWaiting] = useState(false)
	const [lobby, setLobby] = useState(null);
	const [playerId, setPlayerId] = useState(null);
	const [opponentId, setOpponentId] = useState(null);
	const [inGame, setInGame] = useState(false)

	const [message, setMessage] = useState('')
	const [nickname, setNickname] = useState('')

	const handleCreate = () => {
		if(lobby != null) return;
		// error checks
		if(nickname === '') {
			toast.error("Please enter a nickname");
			return
		}
		socket.emit("create-lobby") // create lobby with random name
	}

	const onLobbyCreated = (lobbyName) => {
		setLobby(lobbyName)
		console.log(`Lobby: ${lobbyName}`)
		setIsWaiting(true)
		setMessage(`Share lobby name with your friend: ${lobbyName}`)
	}
	
	const handleJoin = () => {
		if(nickname === '') {
			toast.error("Please enter a nickname");
			return
		}
		var joinInput = document.getElementById('joinInput')

		socket.emit("join-lobby", joinInput.value, (callback) => {
			if(callback == null) {
				toast.error("Lobby does not exist")
			} else {
				setLobby(callback.lobby)
			}
		})
	}

	const handleLeave = () => {
		if(lobby == null) return
		socket.emit("request-leave", lobby)
		setLobby(null)
		setIsWaiting(false)
		setMessage('')
	}

	const leaveNotify = () => {
		setInGame(false)
		toast.info("Opponent left")
		setOpponentId(null)
		setLobby(null) // join own lobby again
	};

	const onConnect = (id) => {
		console.log("Connected")
		setPlayerId(id);
	}

	const onDisconnect = () => {
		console.log("Disconnected")
		setPlayerId(null)
		setLobby(null)
	}

	const getOpponent = (id) => {
		console.log("Got opponent")
		setOpponentId(id)
	}

	const handleDisconnect = () => {
		if(playerId == null) return // not even connected yet
		socket.disconnect()
	}

	const getId = (id) => {
		console.log(`Connected with id ${id}`);
		setPlayerId(id);
	};

	const onPlayersJoined = () => {
		setIsLoading(true)
		setTimeout(() => {
			setIsLoading(false)
			setInGame(true)
		}, 3000);
	}

	useEffect(() => {
		socket.on("connect", onConnect);
		socket.on("disconnect", onDisconnect);

		socket.on("get-opponent", getOpponent);
		socket.on("get-id", getId);
		socket.on("leave-notify", leaveNotify);
		socket.on("lobby-created", onLobbyCreated)
		socket.on("players-joined", onPlayersJoined)

		return () => {
			// trivial
			socket.off("connect", onConnect);
			socket.off("disconnect", onDisconnect);

			socket.off("get-id", getId);
			socket.off("get-opponent", getOpponent);
			socket.off("leave-notify", leaveNotify);
			socket.off("lobby-created", onLobbyCreated)
			socket.off("players-joined", onPlayersJoined)
		};
	}, []);

  return (
	<>
	{isLoading && <Spinner />}
	<div>
		{!inGame ? (
    <div className="flex flex-col h-full w-full justify-center items-center">
        {isWaiting && (
            <WaitingScreen
                message={message}
                opponentId={opponentId}
                handleLeave={handleLeave}
            />
        )}
        {playerId && (
            <h2 className="absolute bottom-10 left-10 text-white">
                Player ID: {playerId}
            </h2>
        )}
        {lobby && (
            <h2 className="absolute bottom-20 left-10 text-white">
                Lobby: {lobby}
            </h2>
        )}
        <div className="flex flex-col h-screen items-center justify-between w-full bg-slate-900 p-4">
            <h1 className="text-center text-white text-5xl font-mono">
                PONG
            </h1>
            <div
                className="flex flex-col p-4 gap-3 items-center w-2/5"
                id="menu"
            >
                <input
                    className="p-2 outline-none rounded w-full"
                    type="text"
                    name="nickname"
                    id="nickname"
                    placeholder="Nickname"
                    onChange={(e) => setNickname(e.target.value)}
                />
                <Button
                    clickFunction={handleCreate}
                    disabled={isLoading}
                    text={"Create Lobby"}
                />
                <div className="w-full flex justify-between">
                    <input
                        className="p-2 outline-none rounded flex-grow mr-2"
                        type="text"
                        name="joinInput"
                        id="joinInput"
                        placeholder="Enter id code"
                    />
                    <Button
                        clickFunction={handleJoin}
                        disabled={isLoading}
                        text={"Join Lobby"}
                    />
                </div>
                <Button
                    clickFunction={handleDisconnect}
                    disabled={isLoading}
                    text={"Disconnect"}
                />
                <Button
                    clickFunction={() => socket.connect()}
                    disabled={isLoading}
                    text={"Connect"}
                />
            </div>
        </div>
    </div>
	) : (<GameScreen />)}
	</div>
	</>
  )
}

export default Home