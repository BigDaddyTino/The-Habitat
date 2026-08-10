declare module "gamedig" {
  export type QueryOptions = {
    type: string;
    host: string;
    port?: number;
    socketTimeout?: number;
    username?: string;
    password?: string;
  };

  export type QueryResult = {
    ping: number;
    numplayers: number;
    players: Array<{ name?: unknown; raw?: unknown }>;
    maxplayers: number | null;
    version: string;
  };

  export class GameDig {
    static query(options: QueryOptions): Promise<QueryResult>;
  }
}
