import express, { Request, Response } from 'express';
import _ from 'lodash';
import cors from 'cors';
import { ApiImpl, FindError } from './compose/api';
import { ProjectError } from './compose/project';

const port = process.env.PORT || 8080;
const workspace = process.env.WORKSPACE || '';
const api = new ApiImpl(workspace);
const app = express();

type Params = { name: string };

const handleError = (res: Response) => (error: ProjectError | FindError | 'stopped') => {
  switch (error) {
    case 'not-found':
      return res.sendStatus(404);
    case 'docker-compose-not-found':
    case 'splash':
    case 'stopped':
      return res.sendStatus(400);
    case 'unknown':
    default:
      return res.sendStatus(500);
  }
};

app.use(cors({ credentials: false }));

app.get('/hello', (_, res) => {
  res.send('ok');
});

app.get('/projects', async (req: Request, res: Response) => {
  const projects = await api.getProjects();
  projects.caseOf({
    Left: () => res.sendStatus(500),
    Right: (ps) => res.json(ps),
  });
});

app.get('/projects/:name', async (req: Request<Params>, res: Response) => {
  const { name } = req.params;
  const project = await api.find(name);
  project.caseOf({
    Left: handleError(res),
    Right: (p) => res.json(p),
  });
});

app.get('/projects/:name/top', async (req: Request<Params>, res: Response) => {
  const { name } = req.params;
  const top = await api.find(name).chain((p) => p.top());
  top.caseOf({
    Left: handleError(res),
    Right: (content) => res.json(_.chain(content).keyBy(0).mapValues(1).value()),
  });
});

app.post('/projects/:name/up', async (req: Request, res: Response) => {
  const { name } = req.params;
  const up = await api.find(name).chain((p) => p.up());
  up.caseOf({
    Left: handleError(res),
    Right: () => res.sendStatus(201),
  });
});

app.post('/projects/:name/down', async (req: Request, res: Response) => {
  const { name } = req.params;
  const up = await api.find(name).chain((p) => p.down());
  up.caseOf({
    Left: handleError(res),
    Right: () => res.sendStatus(201),
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}...`);
});
