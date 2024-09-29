import React from 'react'
import "../src/App.css"

function Score({leftScore, rightScore}) {
  return (
    <div className='flex flex-row' id="score">
      <div className='text-white'>
      {leftScore}
      </div>
      <div className='text-white'>
      {rightScore}
      </div>
    </div>
  )
}

export default Score; 