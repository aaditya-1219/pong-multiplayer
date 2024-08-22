import React from 'react'
import "./Spinner.css"

function Spinner() {
  return (
    <div className='loading-container fixed flex flex-col items-center justify-evenly m-auto gap-4 bg-opacity-60 bg-black z-10  h-screen w-screen'>
      <div className='loader'></div>
    </div>
  )
}

export default Spinner