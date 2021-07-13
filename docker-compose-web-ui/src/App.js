import { useEffect, useState } from "react";
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

axios.defaults.withCredentials = true;

const backend = process.env.REACT_APP_BACKEND_SERVER || "http://localhost:8080";
const baseUrl = `${backend}/projects`;

const baseName = (path) => {
  const tokens = path.split("/");
  return tokens[tokens.length - 1];
};

function App() {
  const [projects, setProjects] = useState([]);
  const [output, setOutput] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const projects = await (await axios.get(baseUrl)).data;
        setProjects(projects);
        console.log(projects);
      } catch (err) {
        console.error(err);
      }
    }
    fetchData();
  }, []);

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
      setOutput(append(`$ docker-compose down!`));
      const statusCode = (await axios.post(`${baseUrl}/${name}/down`)).status;
      if (statusCode === 200 || statusCode === 201) {
        setOutput(append(`${name} is now stopped`));
      }
    } catch (err) {
      console.error(err);
      setOutput(append(`WARNING: ${name} was already stopped!`));
    }
  };

  const renderProject = ({ name, path }) => (
    <TableRow>
      <TableCell>{baseName(name)}</TableCell>
      <TableCell>{name}</TableCell>
      <TableCell>{path}</TableCell>
      <TableCell>
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
              <TableCell>Name</TableCell>
              <TableCell>Path</TableCell>
              <TableCell>Compose file</TableCell>
              <TableCell>Actions</TableCell>
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
