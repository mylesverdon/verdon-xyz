import * as React from "react"
import './styles/boids-canvas-style.css';


class BoidsCanvas extends React.Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();

    this.drawBoid = this.drawBoid.bind(this);
    this.onSizeChange = this.onSizeChange.bind(this);
  }

  componentDidUpdate() {
    const { boids } = this.props.boids;
    const canvas = this.canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = this.props.canvasWidth;
    const height = this.props.canvasHeight;
    ctx.clearRect(0, 0, width, height);

    // Clear the canvas and redraw all the boids in their current positions
    ctx.clearRect(0, 0, width, height);
    for (let boid of boids) {
      this.drawBoid(ctx, boid);
    }
  }
  

  drawBoid(ctx, boid) {
    const angle = Math.atan2(boid.dy, boid.dx);
    ctx.translate(boid.x, boid.y);
    ctx.rotate(angle);
    ctx.translate(-boid.x, -boid.y);
    ctx.fillStyle = "#558cf4";
    ctx.beginPath();
    ctx.moveTo(boid.x, boid.y);
    ctx.lineTo(boid.x - 15, boid.y + 5);
    ctx.lineTo(boid.x - 15, boid.y - 5);
    ctx.lineTo(boid.x, boid.y);
    ctx.fill();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  // Called initially and whenever the window resizes to update the canvas
  // size and width/height variables.
  onSizeChange(e) {
    const canvas = this.canvasRef;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    canvas.width = this.width;
    canvas.height = this.height;
  }

  render() {
    return <canvas id="boids" width={this.props.canvasWidth} height={this.props.canvasHeight} ref={this.canvasRef} /> ; //! Need to lift the state up
  }
}


class AnimatedBoids extends React.Component {
  constructor(props) {

    super(props);

    // General canvas state
    this.height = this.props.canvasHeight;
    this.width = this.props.canvasWidth;
    this.numBoids = 50
    this.visualRange = 70;

    // Function bindings
    this.updateAnimationState = this.updateAnimationState.bind(this);
    this.distance = this.distance.bind(this);
    this.keepWithinBounds = this.keepWithinBounds.bind(this);
    this.flyTowardsCenter = this.flyTowardsCenter.bind(this);
    this.avoidOthers = this.avoidOthers.bind(this);
    this.matchVelocity = this.matchVelocity.bind(this);
    this.limitSpeed = this.limitSpeed.bind(this);


    // Boids initial state
    this.state = {boids: []};
    
  }

  componentDidMount() {
    // Setting initial positions for the boids
    console.log(this.state.boids);
    for (var i = 0; i < this.numBoids; i += 1) {
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        dx: Math.random() * 10 - 5,
        dy: Math.random() * 10 - 5

      })
      this.setState((state) => ({
        boids: [{
        },
        {
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          dx: Math.random() * 10 - 5,
          dy: Math.random() * 10 - 5
        }]
        /*state.boids.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          dx: Math.random() * 10 - 5,
          dy: Math.random() * 10 - 5
        })*/
      }));
    }

    // Starting the animation
    this.rAF = requestAnimationFrame(this.updateAnimationState)
  }


  updateAnimationState() {
    // Update each boid
    this.setState((state) => ({
      boids: state.boids.map(boid => {
        // Update the velocities according to each rule
      })
    }));
    console.log(this.state.boids);     

    // Schedule the next frame
    this.rAF = requestAnimationFrame(this.updateAnimationState);

  }

  distance(boid1, boid2) {
    return Math.sqrt(
      (boid1.x - boid2.x) * (boid1.x - boid2.x) +
        (boid1.y - boid2.y) * (boid1.y - boid2.y),
    );
  }

  // Constrain a boid to within the window. If it gets too close to an edge,
// nudge it back in and reverse its direction.
  keepWithinBounds(boid) {
    const margin = 200;
    const turnFactor = 1;

    if (boid.x < margin) {
      boid.dx += turnFactor;
    }
    if (boid.x > this.width - margin) {
      boid.dx -= turnFactor
    }
    if (boid.y < margin) {
      boid.dy += turnFactor;
    }
    if (boid.y > this.height - margin) {
      boid.dy -= turnFactor;
    }
  }

  // Find the center of mass of the other boids and adjust velocity slightly to
  // point towards the center of mass.
  flyTowardsCenter(boid) {
    const centeringFactor = 0.005; // adjust velocity by this %

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
    const minDistance = 20; // The distance to stay away from other boids
    const avoidFactor = 0.05; // Adjust velocity by this %
    let moveX = 0;
    let moveY = 0;
    for (let otherBoid of this.state.boids) {
      if (otherBoid !== boid) {
        if (this.distance(boid, otherBoid) < minDistance) {
          moveX += boid.x - otherBoid.x;
          moveY += boid.y - otherBoid.y;
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
    const speedLimit = 15;

    const speed = Math.sqrt(boid.dx * boid.dx + boid.dy * boid.dy);
    if (speed > speedLimit) {
      boid.dx = (boid.dx / speed) * speedLimit;
      boid.dy = (boid.dy / speed) * speedLimit;
    }
  }

  render() {
    return (
    <><BoidsCanvas canvasWidth={window.innerWidth} canvasHeight={window.innerHeight} ref={this.canvasRef} boids={this.state.boids}/></> );
  }


} export default AnimatedBoids;







