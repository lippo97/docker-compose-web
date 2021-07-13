import { always, Either, EitherAsync, Left, Right } from 'purify-ts';
import child_process from 'child_process';
import { promisify } from 'util';
import _ from 'lodash';

const exec = promisify(child_process.exec);

export type ProjectError = 'unknown' | 'splash';
type Output = { stdout: string; stderr: string };

export interface Project {
  readonly name: string;

  readonly path: string;

  top(): EitherAsync<Stopped, TopResult>;

  up(): EitherAsync<ProjectError, void>;

  down(): EitherAsync<ProjectError, void>;
}

export class ProjectImpl implements Project {
  readonly path: string;

  constructor(private dockerComposeFilePath: string, public name: string) {
    this.path = this.dockerComposeFilePath;
  }

  private dockerCompose(arg: 'top' | 'up -d' | 'down'): Promise<Output> {
    return exec(`docker-compose ${arg}`, { cwd: this.name });
  }

  top(): EitherAsync<Stopped, TopResult> {
    const splitInSubarrays = (predicate: (x: string) => boolean, array: string[]): string[][] => {
      const result = [];
      let current = [];
      for (const line of array) {
        if (predicate(line)) {
          result.push(current);
          current = [];
        } else {
          current.push(line);
        }
      }
      return result;
    };
    const parseProcess = (out: string): TopResultRecord => {
      /* eslint-disable @typescript-eslint/no-unused-vars */
      const [uid, pid_, ppid_, c, sTime, tty, time, ...cmd_] = out.split(/\s+/);
      /* eslint-enable @typescript-eslint/no-unused-vars */
      const cmd = cmd_.join(' ');
      const pid = parseInt(pid_);
      const ppid = parseInt(ppid_);
      return {
        uid,
        cmd,
        ppid,
        pid,
      };
    };
    const parseContainer = (out: string[]) => {
      const [name, , , ...processes] = out;

      return [name, processes.map(parseProcess)] as [string, TopResultRecord[]];
    };
    const parseOutput = ({ stdout, stderr }: Output): Either<ProjectError, TopResult> => {
      if (stderr) {
        return Left('splash');
      }
      const containers = splitInSubarrays((x) => x === '', stdout.split('\n'));
      return Right(containers.map(parseContainer));
    };

    return EitherAsync(() => this.dockerCompose('top'))
      .chain((out) => EitherAsync.liftEither(parseOutput(out)))
      .ifLeft((left) => console.log('inspect', left))
      .mapLeft(always('stopped'));
  }

  private noOutCommand(command: 'up -d' | 'down', failedIf: (stderr: string) => boolean): EitherAsync<ProjectError, void> {
    return (
      EitherAsync(() => this.dockerCompose(command))
        .chain(({ stderr }) => {
          console.error(stderr)
          return EitherAsync.liftEither(failedIf(stderr) ? Left('splash') : Right(''))
        })
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        .map(() => {})
        .mapLeft(always('splash'))
    );
  }

  up(): EitherAsync<ProjectError, void> {
    return this.noOutCommand('up -d', (stderr) => stderr.includes('up-to-date'))
  }
  down(): EitherAsync<ProjectError, void> {
    return this.noOutCommand('down', (stderr) => stderr.includes('not found'))
  }
}

type Stopped = 'stopped';

type TopResult = Array<[string, TopResultRecord[]]>;

interface TopResultRecord {
  readonly uid: string;
  readonly pid: number;
  readonly ppid: number;
  readonly cmd: string;
}
