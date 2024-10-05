import React, { useRef, useEffect, useState } from 'react';
import Score from "../components/Score"

function GameScreen({socket, lobby, isLobbyLeader}) {
  const canvasRef = useRef(null);

  const getRandomDirection = () => {
    return ((Math.random() * 2) - 1)
  }

  const paddleHeight = 96, paddleWidth = 16;
  const paddleOffset = 0;
  const pongSize = 12;
  const paddleSpeed = 8;
  const pongSpeed = 8;
  const initialY = window.innerHeight/2 - (paddleHeight/2)

  let initSelf = (isLobbyLeader ? { x: paddleOffset, y: initialY }: { x: window.innerWidth - paddleOffset - paddleWidth, y: initialY })
  let initOpp = (!isLobbyLeader ? { x: paddleOffset, y: initialY }: { x: window.innerWidth - paddleOffset - paddleWidth, y: initialY })

  const initPong = {x: window.innerWidth/2 - (pongSize/2), y: window.innerHeight/2 - (pongSize/2)}
  const [self, setSelf] = useState(initSelf); 
  const [opp, setOpp] = useState(initOpp); 
  const [pong, setPong] = useState(initPong)
  const [direction, setDirection] = useState({x: 0, y: 0})
  const [gameRunning, setGameRunning] = useState(true)
  const [selfScore, setSelfScore] = useState(0)
  const [oppScore, setOppScore] = useState(0)
  // -1 for left, 1 for right
  const lastWinner = useRef(-1)

  const [keysPressed, setKeysPressed] = useState({});


  const startGame = () => {
    setSelf(initSelf)
    setOpp(initOpp)
    setPong(initPong)
    setDirection({x: 0, y: 0})
    // Freeze pong for some time before next round
    // const newDirection = {x: -1, y: getRandomDirection()}
    const newDirection = {x: -1, y: -1}
    setTimeout(() => {
      if(lastWinner.current == -1 && newDirection.x < 0) newDirection.x *= -1
      if(lastWinner.current == 1 && newDirection.x > 0) newDirection.x *= -1
      setDirection(newDirection)
    }, 1500);
  }

  useEffect(() => {
    startGame()
  }, [])

  // For drawing and re-drawing the canvas whenever position changes (every frame)
  useEffect(() => {
    if(!pong || !self || !opp) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d');

    const paddleSprite = new Image();
    paddleSprite.src = '../assets/sprite.png'; 
    
    const pongSprite = new Image();
    pongSprite.src = '../assets/sprite.png'; 

    const drawImage = (ctx, paddleSprite, x, y, width, height) => {
      ctx.drawImage(paddleSprite, x, y, width, height);
    };

    const pongLeft = pong.x;
    const pongRight = pong.x + pongSize;
    const pongTop = pong.y;
    const pongBottom = pong.y + pongSize;

    const selfRight = self.x + paddleWidth;
    const selfTop = self.y
    const selfBottom = self.y + paddleHeight;

    const oppLeft = opp.x
    const oppTop = opp.y
    const oppBottom = opp.y + paddleHeight;

    // ---
    // lobby leader only
    // collision between self and pong
    if (pongLeft < selfRight && pongBottom > selfTop && pongTop < selfBottom) {
      const leftCollisionDist = Math.abs(selfRight - pongLeft)
      const topCollisionDist = Math.abs(selfBottom - pongTop)
      const bottomCollisionDist = Math.abs(selfTop - pongBottom)
      const minDist = Math.min(leftCollisionDist,topCollisionDist,bottomCollisionDist);
      if(minDist == leftCollisionDist){
        setDirection(prev => ({...prev, x: 1}))
      } else if(minDist == topCollisionDist){
        setDirection(prev => ({...prev, y: prev.y * -1}))
      } else if(minDist == bottomCollisionDist){
        setDirection(prev => ({...prev, y: prev.y * -1}))
      }
    }

    if (pongRight > oppLeft && pongBottom > oppTop && pongTop < oppBottom) {
      const rightCollisionDist = Math.abs(oppLeft - pongRight)
      const topCollisionDist = Math.abs(oppBottom - pongTop)
      const bottomCollisionDist = Math.abs(oppTop - pongBottom)
      const minDist = Math.min(rightCollisionDist,topCollisionDist,bottomCollisionDist);
      if(minDist == rightCollisionDist){
        setDirection(prev => ({...prev, x: -1}))
      } else if(minDist == topCollisionDist){
        setDirection(prev => ({...prev, y: prev.y * -1}))
      } else if(minDist == bottomCollisionDist){
        setDirection(prev => ({...prev, y: prev.y * -1}))
      }
    }


    if(pongTop <= 0 || pongBottom >= window.innerHeight){
      setDirection(prev => ({...prev, y: prev.y * -1}))
    }

    const gameOver = () => {
      if(pongRight <= paddleWidth) {
        lastWinner.current = 1;
        setOppScore(prev => prev+1);
      } 
      if(pongLeft >= window.innerWidth - paddleWidth) {
        lastWinner.current = -1;
        setSelfScore(prev => prev+1)
      } 
      return (pongRight <= paddleWidth || pongLeft >= window.innerWidth - paddleWidth)
    }

    // Restart on round end
    if(gameOver()) {
      startGame()
    }
    // ---
    // lobby leader only

    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous frame
    drawImage(ctx, paddleSprite, self.x, self.y, paddleWidth, paddleHeight); // Self paddle
    drawImage(ctx, paddleSprite, opp.x, opp.y, paddleWidth, paddleHeight); // Opponent paddle
    drawImage(ctx, pongSprite, pong.x, pong.y, pongSize, pongSize); // Pong

  }, [self, opp, pong]);

  const emitInterval = 50;
  let lastEmitTime = 0;

  useEffect(() => {
    if(self == null) return
    let now = Date.now();
    if(now - lastEmitTime < emitInterval) return
    // any time self changes, emit player-movement event
    // socket.emit("player-movement", lobby, self.y)
    socket.emit("player-movement", lobby, {oppYPos: self.y, pongPos: pong})
    lastEmitTime = now;
  }, [self, pong])

  const setOppPosition = (obj) => {
    // console.log(oppPos);
    setOpp(prev => ({...prev, y: obj.oppYPos}))
    setPong(obj.pongPos)
  }

  useEffect(() => {
    socket.on("opp-movement", setOppPosition)

    return () => {
      socket.off("opp-movement", setOppPosition)
    }
  }, [])

  // key down
  const handleKeyDown = (event) => {
    setKeysPressed((prev) => ({ ...prev, [event.key]: true }));
  };

  // key release
  const handleKeyUp = (event) => {
    setKeysPressed((prev) => ({ ...prev, [event.key]: false }));
  };

  // Input processing
  useEffect(() => {
    let animationFrameId;

    const process = () => {
      if (!gameRunning) {
        cancelAnimationFrame(animationFrameId);
        return;
      }
      const canvas = canvasRef.current

      setSelf((prev) => {
        let newY = prev.y;

        if (keysPressed['ArrowUp']) newY = Math.max(newY-paddleSpeed,0);
        if (keysPressed['ArrowDown']) newY = Math.min(newY+paddleSpeed,canvas.height-paddleHeight);

        return {...prev, y: newY };
      });

      // lobby leader only
      setPong((prev) => {
        let newXPos = prev.x + (direction.x * pongSpeed)
        let newYPos = prev.y + (direction.y * pongSpeed)
        // temp
        // return initPong
        return {x: newXPos, y: newYPos}
      })

      // KEEP THE LOOP RUNNING
      animationFrameId = requestAnimationFrame(process); 
    };

    // Event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // START THE ANIMATION LOOP
    animationFrameId = requestAnimationFrame(process);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [keysPressed, direction, gameRunning]);

  return (
    <div>
      <Score leftScore={selfScore} rightScore={oppScore} />
      <canvas ref={canvasRef} height={window.innerHeight} width={window.innerWidth} />
    </div>
  );
}

export default GameScreen