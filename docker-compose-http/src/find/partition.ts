type Predicate<T> = (val: T) => boolean | Promise<boolean>

type PartitionReturn<T> = [T[], T[]];

export function partition<T>(
  predicate: Predicate<T>,
  arr: T[],
): Promise<PartitionReturn<T>> {

  async function reduce<A>(
    left: T[],
    f: (accumulator: A, value: T) => Promise<A>,
    current: A,
  ): Promise<A> {
    if (left.length === 0) {
      return Promise.resolve(current);
    }
    const [head, ...tail] = left;
    const next = await f(current, head);
    return reduce(tail, f, next);
  }

  return reduce<PartitionReturn<T>>(
    arr,
    async (acc, value) => {
      const [fst, snd] = acc;
      if (await predicate(value)) {
        return [[...fst, value], snd];
      }
      return [fst, [...snd, value]];
    },
    [[], []],
  );
}
