import AnimatedBoids from "./AnimatedBoids";
import * as React from 'react'

import './styles/background.css'
import "@fontsource/roboto"
import kayakingPic from '../images/myles-kayaking.jpg'
import resume from '../files/resume.pdf'

class Landing extends React.Component {
    constructor(props) {
        super(props);
        this.state = { styleName: "initial-follow"};

        this.landingRef = React.createRef();

        this.changeIsFollow = this.changeIsFollow.bind(this);
    }

    changeIsFollow(following) {
        if(following) {
            this.setState({styleName: "is-follow"});
        } else {
            this.setState({styleName: "not-follow"});
        }
    }

    render() {
        return (<div id="landing">
                    <div className={`landing-background ${this.state.styleName}`} isfollow={this.isFollow} ref={this.landingRef}>
                        <AnimatedBoids changeIsFollow={this.changeIsFollow}/>
                    </div>

                    <div id="about">
                        <span id="name">MYLES VERDON</span><br/>
                        <span id="details">Software Engineer | Web Developer | UI/UX</span><br/><br/>
                        <p id="blurb">I’m Myles, a passionate software engineer/developer with a focus on front-end technologies and user experience. I am currently working on 3D visualisation software of remote-handling robotics.
                            <br/><br/>
                            I have aspirations to change the world, and I always strive to find opportunities to best support that dream.
                        </p>
                        <div id="picture"><img src={kayakingPic} style={{maxWidth: "100%", borderRadius: "50%"}} alt="Myles Kayaking in Cornwall"/></div>
                        <div style={{color: "lightgrey"}}><a href="https://www.linkedin.com/in/mylesverdon/" target="_blank">LinkedIn</a> | <a href={resume} target="_blank">Resume</a></div>
                    </div>
                </div>);
    }
}

export default Landing;