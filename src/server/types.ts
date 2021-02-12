import { AuthConfig } from 'tiny-host-common';

export interface Config extends AuthConfig {
  ip: string;
  port: number;

  dbName: string;
}
