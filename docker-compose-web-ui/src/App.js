import { useEffect, useState } from "react";
import FiberManualRecordIcon from "@material-ui/icons/FiberManualRecord";
import _ from "lodash";
import {
  Container,
  Button,
  Box,
  Typography,
  Card,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  ButtonGroup,
} from "@material-ui/core";
import axios from "axios";
import "./App.css";
import Console from "./Console";

axios.defaults.withCredentials = false;

const backend = process.env.REACT_APP_BACKEND_SERVER || "http://localhost:8080";
const baseUrl = `${backend}/projects`;

const baseName = (path) => {
  const tokens = path.split("/");
  return tokens[tokens.length - 1];
};

function App() {
  const [projects, setProjects] = useState([]);
  const [output, setOutput] = useState([]);
  const [projectState, setProjectState] = useState({});

  const tuple = (fst) => (snd) => [fst, snd];
  const mapSnd = (f) => (arr) => arr.map(([fst, snd]) => [fst, f(snd)]);
  const pick = (k) => (obj) => obj[k];
  const call = (method) => (obj) => obj[method]();
  const filter = (pred) => (arr) => arr.filter(pred);
  const equal = (a) => (b) => a === b;
  const not = (predicate) => (x) => !predicate(x);

  useEffect(() => {
    async function fetchData() {
      try {
        const projects = await (await axios.get(baseUrl)).data;
        setProjects(projects);
      } catch (err) {
        console.error(err);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const empty = Symbol();
        const requests = await Promise.all(
          projects.map(
            ({ name }) =>
              axios
                .get(`${baseUrl}/${baseName(name)}/top`)
                .then(pick("status"))
                .then(tuple(name))
                .catch((err) => empty)
            // .then(filter(x => console.log(x), true))
          )
        );
        setProjectState(
          _.chain(requests.filter(not(equal(empty))))
            .keyBy(0)
            .mapValues(1)
            .value()
        );
      } catch (err) {
        // console.error(err);
      }
    }

    fetchProjects();
  }, [projects]);

  const append = (elem) => (arr) => [...arr, elem];

  const up = (name) => async () => {
    try {
      setOutput(append(`$ docker-compose up`));
      const statusCode = (await axios.post(`${baseUrl}/${name}/up`)).status;
      if (statusCode === 200 || statusCode === 201) {
        setOutput(append(`${name} is now running!`));
      }
    } catch (err) {
      console.error(err);
      setOutput(append(`WARNING: ${name} was already running!`));
    }
  };

  const down = (name) => async () => {
    try {
      setOutput(append(`$ docker-compose down`));
      const statusCode = (await axios.post(`${baseUrl}/${name}/down`)).status;
      if (statusCode === 200 || statusCode === 201) {
        setOutput(append(`${name} is now stopped!`));
      }
    } catch (err) {
      console.error(err);
      setOutput(append(`WARNING: ${name} was already stopped!`));
    }
  };

  const Status = ({ state }) => {
    if (state !== undefined) {
      return <FiberManualRecordIcon style={{ color: "rgb(161, 227, 159)" }} />;
    }
    return <FiberManualRecordIcon style={{ color: "#f88" }} />;
  };

  const renderProject = ({ name, path }) => (
    <TableRow>
      <TableCell align="center">
        <Status state={projectState[name]} />
      </TableCell>
      <TableCell align="center" style={{ fontWeight: "bold" }}>
        {baseName(name)}
      </TableCell>
      <TableCell align="center">{name}</TableCell>
      <TableCell align="center">{path}</TableCell>
      <TableCell align="center">
        <ButtonGroup>
          <Button color="primary" onClick={up(baseName(name))}>
            up
          </Button>
          <Button color="secondary" onClick={down(baseName(name))}>
            down
          </Button>
        </ButtonGroup>
      </TableCell>
    </TableRow>
  );

  const Projects = () => {
    if (projects.length === 0) {
      return <Typography component="p">Wow, such empty :(</Typography>;
    }

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Name</TableCell>
              <TableCell align="center">Path</TableCell>
              <TableCell align="center">Compose file</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>{projects.map(renderProject)}</TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Container maxWidth="sm">
      <Box my={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          <Typography
            component="p"
            style={{
              fontFamily: "monospace",
            }}
          >
            docker-compose
          </Typography>{" "}
          Web UI
        </Typography>

        <Projects />
        <Card></Card>
      </Box>

      <Console lines={output} />
    </Container>
  );
}

export default App;
