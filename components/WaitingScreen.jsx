import React from 'react'

function LoadingScreen({message, handleLeave, opponentId}) {

  return (
    <div id='loading-screen' className='fixed flex flex-col items-center justify-evenly m-auto gap-4 bg-opacity-90 bg-white h-3/4 w-3/4'>
      <h1 className='text-3xl font-white'>Waiting in lobby</h1>
      <p className='text-xl'>
        {message}
      </p>
      <h3>{opponentId == null ? "Waiting for opponent to join" : `Opponent: ${opponentId}`}</h3>
      <button onClick={handleLeave} className='rounded outline-none p-2 bg-slate-200'>Leave Lobby</button>
    </div>
  )
}

export default LoadingScreen