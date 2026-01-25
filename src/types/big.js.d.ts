declare module "big.js" {
  export default class Big {
    static RM: number;

    constructor(value: string | number | bigint);
    plus(value: Big | string | number): Big;
    times(value: Big | string | number): Big;
    toFixed(dp?: number): string;
  }
}
