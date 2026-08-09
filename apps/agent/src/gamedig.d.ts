declare module "gamedig" {
  export type QueryOptions = {
    type: string;
    host: string;
    port?: number;
    socketTimeout?: number;
  };

  export type QueryResult = {
    ping: number;
    players: unknown[];
    maxplayers: number | null;
    version: string;
  };

  export class GameDig {
    static query(options: QueryOptions): Promise<QueryResult>;
  }
}
