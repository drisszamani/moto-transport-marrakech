import { Controller, Get } from "@nestjs/common";
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from "@nestjs/terminus";
import { InjectRedis } from '@nestjs-modules/ioredis';
import type Redis from "ioredis";

@Controller()
export class HealthController {
    constructor(
        private health: HealthCheckService,
        private db: TypeOrmHealthIndicator,
        @InjectRedis() private redis: Redis,
    ) {}
    
    @Get('health')
    @HealthCheck()
    check() {
        return this.health.check([
            () => this.db.pingCheck('database'),
            async () => {
                const pong = await this.redis.ping();
                if (pong !== 'PONG') throw new Error('Redis not healthy');
                return { redis: { status: 'up' } };
            },
        ]);
    }
}