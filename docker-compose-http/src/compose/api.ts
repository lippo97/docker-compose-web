import { always, EitherAsync, Maybe } from 'purify-ts';
import { Project, ProjectImpl } from './project';
import { find } from '../find/find';

export type ApiError = 'unknown' | 'docker-compose-not-found';
export type FindError = ApiError | 'not-found';

const dockerComposeFileName = /(docker-)?compose\.(yml|yaml)/;

interface Api {
  getProjects(): EitherAsync<ApiError, Project[]>;

  find(name: string): EitherAsync<FindError, Project>;
}

export class ApiImpl implements Api {
  constructor(private baseDir: string) {}

  getProjects(): EitherAsync<ApiError, Project[]> {
    const projectOf = (dockerComposeFilePath: string, name: string) =>
      new ProjectImpl(dockerComposeFilePath, name);
    return EitherAsync(() => find(this.baseDir, dockerComposeFileName, 2))
      .map(
        (
          _, // EitherAsync content
        ) => _.map((_) => projectOf(_.absolute(), _.dirname())),
      )
      .mapLeft(always('unknown'));
  }

  find(name: string): EitherAsync<FindError, Project> {
    return this.getProjects().chain((ps) =>
      EitherAsync.liftEither(
        Maybe.fromNullable(ps.find((p) => p.name.includes(name))).toEither('not-found'),
      ),
    );
  }
}
