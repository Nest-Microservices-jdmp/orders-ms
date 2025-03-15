import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envs, NATS_SERVICE } from 'src/config';

const TRANSPORTS = ClientsModule.register([
  {
    name: NATS_SERVICE,
    transport: Transport.NATS,
    options: {
      servers: envs.NATS_SERVERS,
    },
  },
]);

@Module({
  imports: [TRANSPORTS],
  exports: [TRANSPORTS],
})
export class NatsModule {}
