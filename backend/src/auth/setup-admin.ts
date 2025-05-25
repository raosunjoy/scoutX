import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AuthService } from './auth.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const authService = app.get(AuthService);

  await authService.createAdminUser('admin', 'admin123');
  console.log('Admin user created: username=admin, password=admin123');
  await app.close();
}

bootstrap();