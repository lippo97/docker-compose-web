import path from 'path';
import fsCallback, { PathLike } from 'fs';
import { partition } from './partition';

const fs = fsCallback.promises;

abstract class FindMatch {
  abstract absolute(): string;

  abstract basename(): string;

  abstract dirname(): string;

  abstract extname(): string;

  abstract isFile(): Promise<boolean>;

  static of(pathLike: PathLike) {
    return new FindMatchImpl(pathLike);
  }
}

class FindMatchImpl extends FindMatch {
  constructor(public pathLike: PathLike) {
    super();
  }

  absolute(): string {
    return path.resolve(this.pathLike.toString());
  }

  basename(): string {
    return path.basename(this.pathLike.toString());
  }
  dirname(): string {
    return path.dirname(this.pathLike.toString());
  }
  extname(): string {
    return path.extname(this.pathLike.toString());
  }

  private lstat(): Promise<fsCallback.Stats> {
    return fs.lstat(this.absolute());
  }

  isFile(): Promise<boolean> {
    return this.lstat().then((_) => _.isFile());
  }
}

export function find(root: PathLike, pattern: string | RegExp, depth = 1): Promise<FindMatch[]> {
  async function go(
    root: PathLike,
    pattern: string | RegExp,
    depth: number,
    current: number,
  ): Promise<FindMatch[]> {
    const resolvedRoot = path.resolve(root.toString());
    const content = (await fs.readdir(resolvedRoot)).map(_ => path.resolve(resolvedRoot, _)).map(FindMatch.of);

    const matches = (regExp: RegExp | string) => (findMatch: FindMatch) => {
      if (regExp instanceof RegExp) {
        return regExp.test(findMatch.absolute())
      }
      return findMatch.absolute().includes(regExp);
    }

    const [files, dirs] = await partition((_) => _.isFile(), content);
    const flatten = <T>(arr: T[][]): T[] => arr.reduce((acc, value) => acc.concat(value), []);

    const next =
      current === depth
        ? []
        : await Promise.all(dirs.map((d) => go(d.absolute(), pattern, depth, current + 1)));
    return [...files, ...flatten(next)].filter(matches(pattern));
  }

  return go(root, pattern, depth, 1);
}