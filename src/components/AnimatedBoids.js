import * as React from 'react'
import './styles/boids-canvas-style.css';

import pointer from '../images/pointer-10.png'

class BoidsCanvas extends React.Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
    this.width = this.props.canvasWidth;
    this.height = this.props.canvasHeight;
    this.boidMap = []
    this.imgRef = React.createRef();

    this.drawBoids = this.drawBoids.bind(this);
  }

  componentDidMount() {
    this.drawCanvas();
  }

  componentDidUpdate() {
    this.drawCanvas();
  }

  drawCanvas() {
    const canvas = this.canvasRef.current;
    const ctx = canvas.getContext('2d',{alpha: false});
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = this.props.isFollow ? '#222222' : '#DDDDDD';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    this.drawBoids(ctx);
  }

  drawBoids(ctx) {
    //console.log(this.props.boids); // ! Some boids are dissapearing (NaN)
    ctx.fillStyle = '#AAAAAA';
    for(let boid of this.props.boids) {
      ctx.translate(boid.x,boid.y);
      ctx.rotate(-Math.atan2(boid.dx,boid.dy) + Math.PI);
      if(!this.props.isFollow) { ctx.filter = 'invert(1)'; }
      ctx.drawImage(this.imgRef.current,0,0);
      ctx.filter = 'invert(0)';
      // Reset current transformation matrix to the identity matrix
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    
  }

  render() {
    return <canvas id="boids" 
              width={this.props.canvasWidth} 
              height={this.props.canvasHeight} 
              ref={this.canvasRef}
              onMouseMove={this.props.mouseEventHandler}
              onClick={this.props.clickHandler}
              style={{cursor: "pointer"}}>
                      <img ref={this.imgRef} src={pointer} visible="false"/>
              </canvas>
  }
}


class AnimatedBoids extends React.Component {

  constructor(props) {
    super(props);
    // Setup values for boids
    this.numBoids = 500;
    this.visualRange = 40;
    this.mousePosX = -40;
    this.mousePosY = -40;
    this.isFollow = false;
    // Function bindings
    this.handleResize = this.handleResize.bind(this);
    // Event handlers
    this.updateAnimationState = this.updateAnimationState.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.distance = this.distance.bind(this);
    this.keepWithinBounds = this.keepWithinBounds.bind(this);
    this.flyTowardsCenter = this.flyTowardsCenter.bind(this);
    this.avoidOthers = this.avoidOthers.bind(this);
    this.avoidMouse = this.avoidMouse.bind(this);
    this.followMouse = this.followMouse.bind(this);
    this.matchVelocity = this.matchVelocity.bind(this);
    this.limitSpeed = this.limitSpeed.bind(this);
    this.clickHandler = this.clickHandler.bind(this);

    // State init
    this.state = {  canvasWidth: 1920, 
                    canvasHeight: 1080, 
                    boids: []};
  }

  componentDidMount() {
    this.handleResize();
    window.addEventListener('resize', this.handleResize);
    for(let i = 0; i<this.numBoids; i++) {
      this.setState(prevState => ({
        boids: [...prevState.boids, { x: Math.random() * window.innerWidth,
                                      y: Math.random() * window.innerHeight,
                                      dx: Math.random() * 10 - 5,
                                      dy: Math.random() * 10 - 5 }]
      }));
    }

    this.rAF = requestAnimationFrame(this.updateAnimationState);
  }
  componentWillUnmount() {
    window.removeEventListener('resize',this.handleResize);
  }

  updateAnimationState() {
    this.setState(prevState => ({
      boids: prevState.boids.map(_boid => {{
        let boid = Object.assign({}, _boid);
        
        this.flyTowardsCenter(boid);
        this.avoidOthers(boid);
        this.matchVelocity(boid);
        if(this.isFollow) { 
          this.avoidMouse(boid);
        } else {
          this.followMouse(boid); 
        }
        this.keepWithinBounds(boid);
        this.limitSpeed(boid);

        // Update the position based on the current velocity
        boid.x = Math.floor(boid.x + boid.dx);
        boid.y = Math.floor(boid.y + boid.dy);

        return boid;
      }})
    }));
    this.rAF = requestAnimationFrame(this.updateAnimationState);
  }

  handleResize() {
    this.setState({canvasHeight: window.innerHeight});
    this.setState({canvasWidth: window.innerWidth});
  }

  handleMouseMove({nativeEvent}) {
    const {offsetX, offsetY} = nativeEvent;
    this.mousePosX = offsetX;
    this.mousePosY = offsetY;
  }
  // ======================== BOIDS FUNCS =======================
  // Constrain a boid to within the window. If it gets too close to an edge,
  // nudge it back in and reverse its direction.

  avoidMouse(boid) {
    const distance = Math.sqrt(((boid.x - this.mousePosX) ** 2) + ((boid.y - this.mousePosY)**2));
    const radius = 100;
    if (distance < radius && distance > 0) {
      boid.dx -= (this.mousePosX - boid.x)/distance;
      boid.dy -= (this.mousePosY - boid.y)/distance;
    }
  }
  
  followMouse(boid) {
    const distance = Math.sqrt(((boid.x - this.mousePosX) ** 2) + ((boid.y - this.mousePosY)**2));
    const radius = 100;
    const dMax = 0.2;
    if (distance > 0) {
      boid.dx += (this.mousePosX - boid.x) > 0 ? Math.min(dMax,(this.mousePosX - boid.x)/distance) : Math.max(-dMax,(this.mousePosX - boid.x)/distance);
      boid.dy += (this.mousePosY - boid.y) > 0 ? Math.min(dMax,(this.mousePosY - boid.y)/distance) : Math.max(-dMax,(this.mousePosY - boid.y)/distance);
    }
  }

  distance(boid1, boid2) {
    return Math.sqrt(
      (boid1.x - boid2.x) * (boid1.x - boid2.x) +
        (boid1.y - boid2.y) * (boid1.y - boid2.y),
    );
  }

  keepWithinBounds(boid) {
    const margin = 200;
    const turnFactor = 0.1;

    if (boid.x < margin) {
      boid.dx += turnFactor;
    }
    if (boid.x > this.state.canvasWidth - margin) {
      boid.dx -= turnFactor
    }
    if (boid.y < margin) {
      boid.dy += turnFactor;
    }
    if (boid.y > this.state.canvasHeight - margin) {
      boid.dy -= turnFactor;
    }
  }

  // Find the center of mass of the other boids and adjust velocity slightly to
  // point towards the center of mass.
  flyTowardsCenter(boid) {
    const centeringFactor = 0.001; // adjust velocity by this %

    let centerX = 0;
    let centerY = 0;
    let numNeighbors = 0;

    for (let otherBoid of this.state.boids) {
      if (this.distance(boid, otherBoid) < this.visualRange) {
        centerX += otherBoid.x;
        centerY += otherBoid.y;
        numNeighbors += 1;
      }
    }

    if (numNeighbors) {
      centerX = centerX / numNeighbors;
      centerY = centerY / numNeighbors;

      boid.dx += (centerX - boid.x) * centeringFactor;
      boid.dy += (centerY - boid.y) * centeringFactor;
    }
  }

  // Move away from other boids that are too close to avoid colliding
  avoidOthers(boid) {
    const targetDistance = 50; // The distance to stay away from other boids
    const avoidFactor = 0.01; // Adjust velocity by this %
    let moveX = 0;
    let moveY = 0;
    for (let otherBoid of this.state.boids) {
      if (otherBoid !== boid) {
        const separation = this.distance(boid, otherBoid);
        if (separation < targetDistance && separation > 0) {
          moveX += separation ? 2*(boid.x - otherBoid.x)/separation : Math.random();
          moveY += separation ? 2*(boid.y - otherBoid.y)/separation : Math.random();
        } 
      }
    }

    boid.dx += moveX * avoidFactor;
    boid.dy += moveY * avoidFactor;
  }

  // Find the average velocity (speed and direction) of the other boids and
  // adjust velocity slightly to match.
  matchVelocity(boid) {
    const matchingFactor = 0.05; // Adjust by this % of average velocity

    let avgDX = 0;
    let avgDY = 0;
    let numNeighbors = 0;

    for (let otherBoid of this.state.boids) {
      if (this.distance(boid, otherBoid) < this.visualRange) {
        avgDX += otherBoid.dx;
        avgDY += otherBoid.dy;
        numNeighbors += 1;
      }
    }

    if (numNeighbors) {
      avgDX = avgDX / numNeighbors;
      avgDY = avgDY / numNeighbors;

      boid.dx += (avgDX - boid.dx) * matchingFactor;
      boid.dy += (avgDY - boid.dy) * matchingFactor;
    }
  }

  // Speed will naturally vary in flocking behavior, but real animals can't go
  // arbitrarily fast.
  limitSpeed(boid) {
    const speedLimit = 8;
    const minSpeed = 3;
    const speed = Math.sqrt(boid.dx * boid.dx + boid.dy * boid.dy);
    if (speed > speedLimit) {
      boid.dx = (boid.dx / speed) * speedLimit;
      boid.dy = (boid.dy / speed) * speedLimit;
    } else if (speed < minSpeed) {
      boid.dx = (boid.dx / speed) * minSpeed;
      boid.dy = (boid.dy / speed) * minSpeed;
    }
  }

  // =============================================================
  clickHandler() {
    console.log("HERE!");
    this.isFollow = !this.isFollow
  }

  render() {
    return <div id="boids-wrapper" >
      <BoidsCanvas  canvasWidth={this.state.canvasWidth} 
                    canvasHeight={this.state.canvasHeight} 
                    boids={this.state.boids}
                    mouseEventHandler={this.handleMouseMove}
                    isFollow={this.isFollow}
                    clickHandler={this.clickHandler}/>
      </div>
  }
}
export default AnimatedBoids;