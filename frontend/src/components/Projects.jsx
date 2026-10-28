function Projects() {
return ( <section id="work" className="work"> <h2>My Projects</h2>

  <div className="projects">

    {/* Simple Calculator */}
    <div className="project">
      <img src="/AM.png" alt="Simple Calculator" />

      <div className="project-info">
        <h3>Simple Calculator</h3>

        <p>
          A simple calculator developed using HTML, CSS and JavaScript.
        </p>

        <a
          href="https://ansh4754se25.github.io/Calculator-simple/"
          target="_blank"
          rel="noopener noreferrer"
          className="project-button"
        >
          View Project
        </a>
      </div>
    </div>

    {/* Grade Calculator */}
    <div className="project">
      <img src="/AN.png" alt="Grade Calculator" />

      <div className="project-info">
        <h3>Grade Calculator</h3>

        <p>
          A grade calculator developed using HTML, CSS and JavaScript.
        </p>

        <a
          href="https://ansh4754se25.github.io/grade-calculator/"
          target="_blank"
          rel="noopener noreferrer"
          className="project-button"
        >
          View Project
        </a>
      </div>
    </div>

  </div>
</section>

);
}

export default Projects;
