import React from 'react'

function Button({clickFunction, disabled, text}) {
  return (
		<button
			onClick={clickFunction}
			className="bg-slate-200 hover:bg-slate-50 w-full p-2"
			disabled={disabled}
		>
			{text}
		</button>
  );
}

export default Button